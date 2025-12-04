import { model, Schema } from 'mongoose';
import Arca from '../classes/Arca.js'

const aliquotSchema = new Schema({
    Id: { type: Number, required: true, unique: true }, // Not be mistaken with MongoDB `_id`. This is an ARCA's ID.
    Desc: { type: Number, required: true },
    FchDesde: { type: String, required: true },
    FchHasta: { type: String, required: true },
    },
    {
        _id: false,
        versionKey: false
    }
);

const AliquotsSchema = model('Aliquot', aliquotSchema);

export default AliquotsSchema;