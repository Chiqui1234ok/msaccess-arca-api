import { model, Schema } from 'mongoose'

const alicIvaSchema = new Schema({
  Id: { type: Number, required: true },
  BaseImp: { type: Number, required: true },
  Importe: { type: Number, required: true }
}, { _id: false });

const ivaSchema = new Schema({
  AlicIva: { type: [alicIvaSchema], required: true }
}, { _id: false });

const voucherSchema = new Schema({
  Concepto: { type: Number, required: true },
  DocTipo: { type: Number, required: true },
  DocNro: { type: Number, required: true },
  CbteDesde: { type: Number, required: true },
  CbteHasta: { type: Number, required: true },
  CbteFch: {
    type: String,
    minlenght: 8,
    maxlenght: 8,
    trim: true,
    required: true 
  }, // AAAAMMDD
  ImpTotal: { type: Number, required: true },
  ImpTotConc: { type: Number, required: true },
  ImpNeto: { type: Number, required: true },
  ImpOpEx: { type: Number, required: true },
  ImpTrib: { type: Number, required: true },
  ImpIVA: { type: Number, required: true },
  FchServDesde: { 
    type: String,
    minlenght: 8,
    maxlenght: 8,
    trim: true,
  },
  FchServHasta: { 
    type: String,
    minlenght: 8,
    maxlenght: 8,
    trim: true,
  },
  FchVtoPago: {
    type: String,
    minlenght: 8,
    maxlenght: 8,
    trim: true,
  },
  MonId: { type: String, required: true },
  MonCotiz: { type: Number, required: true },
  CondicionIVAReceptorId: { type: Number, required: true },
  Iva: { type: ivaSchema, required: true },
  Resultado: { type: String, required: true },
  CodAutorizacion: { type: String, required: true },
  EmisionTipo: { type: String, required: true },
  FchVto: { type: String, required: true },
  FchProceso: { type: String, required: true },
  PtoVta: { type: Number, required: true },
  CbteTipo: { type: Number, required: true },
  voucher_number: { type: Number, required: true }
}, {
  timestamps: true // agrega createdAt y updatedAt automáticamente
});

const Voucher = model('Voucher', voucherSchema);