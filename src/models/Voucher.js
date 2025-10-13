import { model, Schema } from 'mongoose'
import Arca from '../classes/Arca.js';
import { IvaSchema } from './Iva.js';

const tributesSchema = new Schema({
  Id: { type: Number, required: true },
  Alic: { type: Number, required: true },
  BaseImp: { type: Number, required: true },
  Importe: { type: Number, required: true }
}, { _id: false });

const voucherSchema = new Schema({
  Concepto: { type: Number, required: true },
  IdClienteEnAccess: { type: String, required: true },
  RazonSocial: { type: String, required: true },
  DocTipo: { type: Number, required: true },
  DocNro: { type: Number, required: true },
  CbteFch: {
    type: String,
    minlenght: 8,
    maxlenght: 8,
    trim: true,
    required: true 
  }, // AAAAMMDD
  ImpTotal: { type: Number, required: true }, // Importe total del comprobante
  ImpTotConc: { type: Number }, // Importe neto no gravado
  ImpNeto: { type: Number, required: true }, // Importe neto gravado
  ImpOpEx: { type: Number }, // Importe exento de IVA
  ImpTrib: { type: Number }, // Importe total de IVA
  ImpIVA: { type: Number, required: true }, // Importe total de tributos
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
  Iva: { type: [IvaSchema], required: true }, // Alícuotas del comprobante
  Tributos: { type: [tributesSchema] }, // Tributos/Percepciones del comprobante
  // Resultado: { type: String, required: true },
  // CodAutorizacion: { type: String, required: true },
  // FchProceso: { type: String, required: true },
  PtoVta: { type: Number, required: true },
  CbteTipo: { type: Number, required: true },
  VoucherNumber: { type: Number },
  CAE: { type: String },
  CAEFchVto: { type: String }
}, {
  timestamps: true // agrega createdAt y updatedAt automáticamente
});

/**
 * Check existence of initial data from front-end
 */
voucherSchema.methods.validarInput = async function(req) {
  if( !req.FchVtoPago ) {
      throw new Error('Cuándo se factura por un servicio, se debe especificar el periodo de éste.');
    }
    if( !req.Concepto ) {
      throw new Error('Se debe indicar si la factura es por un Producto, Servicio o ambos.');
    }
    if( req.Concepto != 1 && ( !req.FchServDesde || !req.FchServHasta) ) {
      throw new Error('Cuándo se factura por un servicio, se debe especificar el periodo de éste.');
    }
    if( !req.IdClienteEnAccess || isNaN(req.IdClienteEnAccess) || req.IdClienteEnAccess < 0 || !req.RazonSocial ) {
      throw new Error('No se indicó el cliente.');
    }
    if( !req.DocTipo ) {
      throw new Error('No se indicó el tipo de documento del cliente.');
    }
    if( !req.CondicionIVAReceptorId ) {
      throw new Error('Es necesario saber la condición del IVA del receptor.');
    }
    if( !req.VoucherItems || !Array.isArray(req.VoucherItems) || req.VoucherItems.length == 0 ) {
      throw new Error('El detalle de la factura (producto(s)/servicio(s) a prestar) es obligatoria.');
    }
}


/**
 * Calculate voucher's final amounts.
 */
voucherSchema.methods.calcularSumasDelVoucher = function(items, ImpTrib) {
  if(!items || !Array.isArray(items) || items.length == 0) throw new Error('No se especificó ninguna alícuota.');
  const arca = new Arca();
  const { ImpTotal, ImpNeto, ImpIVA } = arca.calculateVoucherSums(items, ImpTrib);
  this.ImpTotal = ImpTotal;
  this.ImpNeto = ImpNeto;
  this.ImpIVA = ImpIVA;
  // Default override
  this.MonId = 'PES';
  this.MonCotiz = 1;
}

/**
 * Converts dates to something ARCA will understand before saving into database.
 */
voucherSchema.methods.calcularFechasArca = function() {
  const arca = new Arca();
  this.CbteFch = arca.getArcaDate( new Date() );
  this.FchVtoPago = arca.getArcaDate( this.FchVtoPago );
  if( this.FchServDesde ) {
    this.FchServDesde = arca.getArcaDate( this.FchServDesde );
  }
  if( this.FchServHasta ) {
    this.FchServHasta = arca.getArcaDate( this.FchServHasta );
  }
}

/**
 * Delete "Tributos" key if it's an empty array, otherwise afipsdk will fail creating the XML
 */
voucherSchema.set('toObject', {
  transform: (doc, obj) => {
    if(Array.isArray(obj.Tributos) && obj.Tributos.length === 0) {
      delete obj.Tributos;
    }
    delete obj._id;
    return obj;
  }
});


// voucherSchema.pre("save", function(next) {
//   this.calcularFechasArca();
//   next();
// });

// voucherSchema.pre("save", function (next) {
//   if () {
//     return next(new Error("Error"));
//   }
//   next();
// });

const Voucher = model('Voucher', voucherSchema);

export default Voucher;