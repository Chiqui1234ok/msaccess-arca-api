import fs from "fs";
import Afip from "@afipsdk/afip.js";
import path from 'path';
import { fileURLToPath } from "url";
import Aliquots from "../models/Aliquots.js";

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
     * Calculate the sums for the voucher based on the items provided.
     * ⚠ This function doesn't support not-taxable items.
     */
    calculateVoucherSums(items) {
        let ImpTotal = 0; // Total amount including IVA
        let ImpNeto = 0; // Total amount without IVA
        let ImpIVA = 0; // Total IVA amount
        for(let i = 0;i < items.length;i++) {
            const item = items[i];
            const itemWithIva = (item.Importe * item.Cantidad) * (1 + (item.IVA / 100));
            const itemWithoutIva = (item.Importe * item.Cantidad);
            // Adds final value to ImpTotal (including IVA)
            ImpTotal += itemWithIva;
            // Adds only the the value from items without IVA
            ImpNeto += itemWithoutIva;
            // Adds only the IVA value
            ImpIVA += itemWithIva - itemWithoutIva;
        }
        return { ImpTotal, ImpNeto, ImpIVA };
    }

    /**
     * Calculate and finds each tax ID per item
     */
    calculateVoucherItems(items) {
        
    }

    /**
     * Gets a voucher by its number, point of sale and type of voucher.
     */
    async getVoucher(data) {
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
     * 
     * @param {*} data - ex: "2025-08-01T03:00:00.000Z" 
     * @returns ex: "2025-08-01T03:00:00.000Z" formatted to "20250801" (ARCA uses this format)
     */
    getArcaDate(data) {
        const date = new Date(data);
        
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // enero=0
        const day = String(date.getUTCDate()).padStart(2, "0");

        return `${year}${month}${day}`;
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
}