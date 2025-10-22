import fs from "fs";
import Afip from "@afipsdk/afip.js";
import path from 'path';
import { fileURLToPath } from "url";
import Aliquots from "../models/Aliquots.js";
// import Tributes from "../models/Tributes.js";
import Voucher from '../models/Voucher.js'
import DateFormat from "../helpers/DateFormat.js";

export default class Arca extends Afip {
    constructor() {
        const key = fs.readFileSync(
            path.resolve(fileURLToPath(new URL('../../.arca/credentials/priv.key', import.meta.url))),
            'utf8'
        );

        const cert = fs.readFileSync(
            path.resolve(fileURLToPath(new URL('../../.arca/credentials/pub.crt', import.meta.url))),
            'utf8'
        );
        
        const CUIT = parseInt(process.env.MS_ACCESS_WEBAPP_ARCA_CUIT || '');

        if(!key) throw new Error('Clave privada no definida.');
        if(!cert) throw new Error('Certificado público no definido.');
        if(!CUIT) throw new Error('CUIT no definido.');

        // Call parent constructor with credentials
        super({
            key,
            cert,
            CUIT,
            production: process.env.MS_ACCESS_WEBAPP_NODE_ENV === 'prod'
        });
    }

    /**
     * @typedef {Object} Item
     * @property {string} Desc
     * @property {number} Importe
     * @property {number} Cantidad
     * @property {number} IVA
     */
    /**
     * @param {Item[]} items - Details of each item in the voucher
     * @returns {{ ImpTotal: number, ImpNeto: number, ImpIVA: number }}
     */

    /**
     * Calcula los totales del voucher (neto, con IVA, sin IVA, no gravado)
     * ⚠ Esta función no soporta ítems no gravables por ley
     * @param {*} items - items del voucher
     * @param {*} ImpTrib - suma del importe de cada tributo del voucher
     */
    calculateVoucherSums(items, ImpTrib) {
        let ImpTotal = 0; // Total con IVA
        let ImpNeto = 0; // Total sin IVA
        let ImpIVA = 0; // Total IVA
        let ImpTotConc = 0; // Total no gravado (IVA = "-1%"")

        let i = 0;
        while(i < items.length) {
            const item = items[i];
            // Si un ítem del voucher no está alcanzado por el IVA (no gravado)
            // Nos damos cuenta porque el front-end envía el IVA en negativo
            if(item.IVA < 0) {
                ImpTotConc += item.Importe * item.Cantidad;
                continue;
            }
            // Convert IVA (front-end sends as percentage) to decimal (ex: 0.21 converts to 21). This convertion happens only when front-end sends IVA as percentaje/decimal, otherwise we will keep it intact.
            const IvaValue = items[i].IVA != 0 && items[i].IVA <= 1 ? items[i].IVA * 100 : items[i].IVA;
            const itemWithIva = (item.Importe * item.Cantidad) * (1 + (IvaValue / 100));
            const itemWithoutIva = (item.Importe * item.Cantidad);
            // Adds final value to ImpTotal (including IVA)
            ImpTotal += itemWithIva;
            // Adds only the the value from items without IVA
            ImpNeto += itemWithoutIva;
            // Adds only the IVA value
            ImpIVA += itemWithIva - itemWithoutIva;

            i++;
        }
        ImpTotal += ImpTrib;
        return { ImpTotal, ImpNeto, ImpIVA, ImpTotConc };
    }

    /**
     * @typedef {Object} IvaData
     * @property {string} Id - Identificador del tipo de IVA.
     * @property {number} BaseImp - Base imponible asociada.
     * @property {number} Importe - Monto del IVA calculado.
     */
    /**
     * Get the ID of each IVA involved in the voucher.
     * Through [items], this function determines which IVA types are present and their respective amounts.
     *
     * @param {items[]} items - Details of each item in the voucher
     * @returns {IvaData[]} Array of objects, each containing Id, BaseImp and Importe.
     */
    // 2025-09-14: moved to IvaSchema
    async setIvaArray(items) {
        let IvaData = [];
        for(let i = 0;i < items.length;i++) {
            // Convert IVA (front-end sends as percentage) to decimal (ex: 0.21 converts to 21)
            const IvaValue = items[i].IVA != 0 && items[i].IVA <= 1 ? items[i].IVA * 100 : items[i].IVA;

            const IvaItem = {
                Id: await Aliquots.findOne({ Desc: IvaValue }).then(result => result ? result.Id : null),
                BaseImp: items[i].Importe * items[i].Cantidad,
                Importe: (items[i].Importe * items[i].Cantidad) * (IvaValue / 100)
            };
            if(!IvaItem.Id) {
                throw new Error(`Indicaste un tipo de IVA incorrecto: "${items[i].IVA}"`);
            }
            // Check if this IVA type already exists in the array (IvaData)
            const existingIva = IvaData.find(iva => iva.Id === IvaItem.Id);
            if(existingIva) {
                // If this IVA type already exists, sum the values
                existingIva.BaseImp += IvaItem.BaseImp;
                existingIva.Importe += IvaItem.Importe;
            } else {
                // If it's a new IVA type, add it to the array
                IvaData.push(IvaItem);
            }
        }
        return IvaData;
    }

    /**
     * @typedef {Object} tributesData
     * @property {string} Id - Identificador del tipo de tributo.
     * @property {string} [Desc] - Descripción opcional del tributo.
     * @property {number} BaseImp - Base imponible del tributo.
     * @property {number} Alic - Alícuota aplicada.
     * @property {number} Importe - Monto del tributo calculado.
     */
    /**
     * Applies taxes to the voucher based on the provided tributes and base amount.
     *
     * @param {tributes[]} tributes - Details of each tax to be applied
     * @returns {tributesData[]} Array of objects, each containing Id, Desc, BaseImp, Alic and Importe.
     */
    async setTributesArray(tributes) {
        if(!tributes || !Array.isArray(tributes) || tributes.length === 0) {
            return [];
        }
        let tributesData = [];
        let i = 0;
        while(i < tributes.length) {
            // Skip tributes which aren't defined
            if(!tributes[i].Base_Imponible || !tributes[i].Alicuota || !tributes[i].arcaId) {
                tributes.splice(i, 1);
                continue;
            }
            const Alicuota = tributes[i].Alicuota != 0 && parseFloat(tributes[i].Alicuota) <= 1 ? parseFloat(tributes[i].Alicuota) : parseFloat(tributes[i].Alicuota) / 100;
            const taxItem = {
                Id: tributes[i].arcaId,
                BaseImp: tributes[i].Base_Imponible,
                Alic: Alicuota,
                Importe: parseFloat(tributes[i].Base_Imponible) * Alicuota
            };
            tributesData.push(taxItem);
            i++;
        }
        return tributesData;
    }

    /**
     * Gets a voucher by its number, point of sale and type of voucher.
     */
    async getVoucherFromArca(data) {
        if(!data.voucher_number)
            throw new Error('Número de comprobante no definido.');
        if(!data.PtoVta)
            throw new Error('Punto de venta no definido.');
        if(!data.CbteTipo)
            throw new Error('Tipo de comprobante no definido.');

        const arca = new Arca();
        const result = await arca.ElectronicBilling.getVoucherInfo(data.voucher_number, data.PtoVta, data.CbteTipo);
        // This key isn't by default, so I added it for easier identification
        result.voucher_number = data.voucher_number;

        if(result) {
            return result;
        } else {
            // If this voucher doesn't exist, getVoucherInfo returns null
            throw new Error('Comprobante no encontrado.');
        }
    }

    /**
     * Gets a voucher by its number and point of sale.
     * Is useful when you want to check a voucher registered though the API
     */
    async getVoucherFromDb(data) {
        if(!data.VoucherNumber) {
            throw new Error('Número de comprobante no definido.');
        }
        if(!data.PtoVta) {
            throw new Error('Punto de venta no definido.');
        }
        if(process.env.MS_ACCESS_WEBAPP_NODE_ENV == 'dev') {
            console.log(`Se busca en base de datos el voucher ${data.PtoVta}-${data.VoucherNumber}`);
        }
        
        const result = await Voucher.findOne({
            VoucherNumber: data.VoucherNumber,
            PtoVta: data.PtoVta
        });

        if(result) return result;
        else throw new Error('Comprobante no encontrado.');
    }

    /**
     * 
     * @param {*} date - ex: "2025-08-01T03:00:00.000Z" 
     * @param format - ex: "YMD", "DMY", etc. This uses an ENUM
     * @returns ex: "2025-08-01T03:00:00.000Z" formatted to "20250801" (ARCA uses this format)
     */
    getArcaDate(date = new Date(), format = DateFormat.YMD) {
        const d = (date instanceof Date) ? date : new Date(date);

        const localTime = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        const year = localTime.getFullYear().toString();
        const month = String(localTime.getMonth() + 1).padStart(2, "0");
        const day = String(localTime.getDate()).padStart(2, "0");

        // Evaluar el enum usando replace
        return format
            .replace("${year}", `${year}`)
            .replace("${month}", `${month}`)
            .replace("${day}", day);
    }

    /**
     * 
     * @param {*} date - ex: "2025-08-01T03:00:00.000Z" 
     * @param format - ex: "YMD", "DMY", etc. This uses an ENUM
     * @returns ex: "2025-08-01T03:00:00.000Z" formatted to "20250801" (ARCA uses this format)
     */
    getAccessDate(date = new Date(), format = DateFormat.YMD) {
        const d = (date instanceof Date) ? date : new Date(date);

        const localTime = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        const year = localTime.getFullYear().toString();
        const month = String(localTime.getMonth() + 1).padStart(2, "0");
        const day = String(localTime.getDate()).padStart(2, "0");

        // Evaluar el enum usando replace
        return format
            .replace("${year}", `${year}/`)
            .replace("${month}", `${month}/`)
            .replace("${day}", `${day}`);
    }

    /**
     * Get IVA type from "Desc" field.
     * Example: "21" or "21%" returns the object with that description.
     */
    getIvaByDesc(percentage) {
        // This replace is in case the user sends "21%" instead of "21". We store it as a number.
        const value = String(percentage).trim().replace('%', '');
        const Desc = parseFloat(value);
        return Aliquots.findOne({ Desc });
    }

    /**
     * 
     * @param {*} id 
     * @returns id (number) transformed to string with real meaning
     */
    getConceptoById(id) {
        // TODO
        //
        //
        return id;
    }
}