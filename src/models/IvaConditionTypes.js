import { model, Schema } from 'mongoose'

const ivaConditionTypesSchema = new Schema({
    Id: { type: Number, required: true, unique: true }, // Not be mistaken with MongoDB `_id`. This is an ARCA's ID.
    Desc: { type: String, required: true },
    Cmp_Clase: { type: String, required: true }
});

const IvaConditionTypesSchema = model('IvaConceptTypes', ivaConditionTypesSchema);

export default IvaConditionTypesSchema;