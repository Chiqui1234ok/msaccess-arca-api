import { model, Schema } from 'mongoose'

const IvaSchema = new Schema({
  Id: { type: Number, required: true },
  /**
   * Item description (ex: "Servicios de fumigación")
   */
  Desc: { type: String, required: true },
  BaseImp: { type: Number, required: true },
  Importe: { type: Number, required: true },
  Cantidad: { type: Number, required: true }
}, { _id: false });

const IvaModel = model("Iva", IvaSchema);

export { IvaSchema, IvaModel };