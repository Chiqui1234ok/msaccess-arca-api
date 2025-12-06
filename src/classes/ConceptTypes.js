import Arca from './Arca.js'
import ConceptTypesSchema from '../models/ConceptTypes.js'

class ConceptTypes {
    constructor() {

    }

    /**
     * @returns IVA Condition types (ex: Responsable inscripto,
     * Monotributo, Exento, etc) from database or ARCA
     */
    static async get() {
        let result = await ConceptTypesSchema.find();
        
        // Returns DB if we have anything
        if(result.length > 0) return result;

        // Otherwise, we need to fetch this data from ARCA
        return await ConceptTypes.getFromArca();
    }

    /**
     * Fetch ARCA's condition types (ex: Responsable inscripto,
     * Monotributo, Exento, etc) and saves it in database
     * @returns {Promise<Array>} ARCA's condition types
     */
    static async getFromArca() {
        const arca = new Arca();
        let result = await arca.ElectronicBilling.getConceptTypes();

        if(result.length <= 0 || !result[0].hasOwnProperty('Desc')) throw new Error('No se pudieron obtener los conceptos de factura correctamente.');

        await ConceptTypesSchema.deleteMany({}); // Clear previous entries (could be garbage data)
        result = await ConceptTypesSchema.insertMany(result);
        return result;
    }
}

export default ConceptTypes;