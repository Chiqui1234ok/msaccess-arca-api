import IvaConditionTypesSchema from '../models/IvaConditionTypes.js';
import Arca from './Arca.js'

class IvaConditionTypes {
    constructor() {

    }

    /**
     * @returns IVA Condition types (ex: Responsable inscripto,
     * Monotributo, Exento, etc) from database or ARCA
     */
    static async get() {
        let result = await IvaConditionTypesSchema.find();
        
        // Returns DB if we have anything
        if(result.length > 0) return result;

        // Otherwise, we need to fetch this data from ARCA
        return await IvaConditionTypes.getFromArca();
    }

    /**
     * Fetch ARCA's condition types (ex: Responsable inscripto,
     * Monotributo, Exento, etc) and saves it in database
     * @returns {Promise<Array>} ARCA's condition types
     */
    static async getFromArca() {
        const arca = new Arca();
        /**
         * `result` get response from ARCA directly
         * (through `executeRequest()`).
         * That's because we need to check for
         * `ResultGet` and `CondicionIvaReceptor` objects.
         * I mean, isn't a common call to AfipSDK 😉
         * FEParamGetCondicionIvaReceptor: Método  para consultar
         * valores de los identificadores de la condición frente
         * al IVA del receptor 
        */ 
        let result = await arca.ElectronicBilling.executeRequest('FEParamGetCondicionIvaReceptor');
        result = result?.ResultGet?.CondicionIvaReceptor ? result.ResultGet.CondicionIvaReceptor : {};

        if(result.length <= 0 || !result[0].hasOwnProperty('Desc')) throw new Error('No se pudieron obtener los tipos correctamente.');

        await IvaConditionTypesSchema.deleteMany({}); // Clear previous entries (could be garbage data)
        result = await IvaConditionTypesSchema.insertMany(result);
        console.log('getFromArca', result);
        return result;
    }
}

export default IvaConditionTypes;