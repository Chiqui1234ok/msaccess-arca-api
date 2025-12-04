import { model, Schema } from 'mongoose'

const conceptTypesSchema = new Schema({
    
});

const ConceptTypes = model('ConceptTypes', conceptTypesSchema);

export default ConceptTypes;