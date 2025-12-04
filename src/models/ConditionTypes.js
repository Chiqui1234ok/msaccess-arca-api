import { model, Schema } from 'mongoose'

const conditionTypesSchema = new Schema({
    
});

const ConditionTypesSchema = model('ConceptTypes', conditionTypesSchema);

export default ConditionTypesSchema;