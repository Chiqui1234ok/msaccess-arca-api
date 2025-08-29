import fs from "fs";
import Afip from "@afipsdk/afip.js";
import path from 'path';
import { fileURLToPath } from "url";

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
}