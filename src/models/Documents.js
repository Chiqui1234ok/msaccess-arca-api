import { model, Schema } from 'mongoose'

const documentsSchema = new Schema({
    
});

const DocumentsSchema = model('ConceptTypes', documentsSchema);

export default DocumentsSchema;