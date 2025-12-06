import { model, Schema } from 'mongoose'

const conceptTypesSchema = new Schema({
    Id: { type: Number, required: true },
    Desc: { type: String, required: true },
    FchDesde: { type: String, required: true },
    FchHasta: { type: String, required: true }
});

const ConceptTypesSchema = model('ConceptTypes', conceptTypesSchema);

export default ConceptTypesSchema;