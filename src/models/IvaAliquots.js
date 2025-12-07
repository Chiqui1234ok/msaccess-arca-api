import { model, Schema } from 'mongoose';

const ivaAliquotSchema = new Schema({
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

const IvaAliquotsSchema = model('IvaAliquot', ivaAliquotSchema);

export default IvaAliquotsSchema;