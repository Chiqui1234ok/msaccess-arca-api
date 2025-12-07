import IvaAliquotsSchema from "../models/IvaAliquots.js";
import Arca from "./Arca.js";

class IvaAliquots {
    constructor() {

    }

    /**
     * @returns IVA Aliquots from database or ARCA
     */
    static async get() {
        let result = await IvaAliquotsSchema.find();
        
        // Returns DB if we have anything
        if(result.length > 0) return result;

        // Otherwise, we need to fetch this data from ARCA
        return await IvaAliquots.getFromArca();
    }

    /**
     * Fetch ARCA's IVA percentages and saves it in database
     *
     * @returns {Promise<Array>} ARCA's aliquots
     */
    static async getFromArca() {
        const arca = new Arca();
        let result = [];
        result = await arca.ElectronicBilling.getAliquotTypes();
        if(!result || result.length == 0) {
            throw new Error(`ARCA está sin servicio y no pudo devolver las alícuotas de IVA.`);
        }
        result = result.map(i => {
            const parsedDesc = String(i.Desc).replace('%', '').trim();
            return {
                ...i,
                Id: parseInt(i.Id),
                Desc: parseFloat(parsedDesc)
            };
        });
        await IvaAliquotsSchema.deleteMany({}); // Clear previous entries (could be garbage data)
        result = await IvaAliquotsSchema.insertMany(result);
        console.log('getFromArca', result);
        return result;
    }

    static async calcularArray(alicuotas) {
        let IvaData = [];
        for(let i = 0;i < alicuotas.length;i++) {
            /**
             * Front-end sends percentage as decimal.
             * Back-end converts this to a real number if this happens.
             * If front-ends sends real number (ex: 21), back-end
             * will not convert because is already converted.
            */
            const IvaValue = alicuotas[i].IVA != 0 && alicuotas[i].IVA <= 1 ? alicuotas[i].IVA * 100 : alicuotas[i].IVA;

            // Get all IVA's percentages from DB (or ARCA) 👇
            const IvaAliquotsData = await IvaAliquots.get();
            console.log('Data:', IvaAliquotsData);
            // Get object which has same `Desc` attribute
            const IvaAliquot = IvaAliquotsData.find(obj => obj.Desc === IvaValue) || null;

            console.log('IvaAliquot', IvaAliquot);

            if(!IvaAliquot) {
                throw new Error(`Este porcentaje de IVA no corresponde a ninguna alícuota vigente.`);
            }

            const IvaItem = {
                Id: IvaAliquot.Id,
                Desc: IvaAliquot.Desc,
                BaseImp: alicuotas[i].Importe * alicuotas[i].Cantidad,
                Importe: (alicuotas[i].Importe * alicuotas[i].Cantidad) * (IvaValue / 100),
                Cantidad: alicuotas[i].Cantidad
            };
            
            if(process.env.MS_ACCESS_WEBAPP_NODE_ENV == 'dev') {
                console.log('models/Iva.js');
                console.log('IvaValue', IvaValue);
                console.log('IvaItem', IvaItem);
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
}

export default IvaAliquots;