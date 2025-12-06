import { model, Schema } from 'mongoose'
import AliquotsSchema from './Aliquots.js';

const IvaSchema = new Schema({
  Id: { type: Number, required: true },
  BaseImp: { type: Number, required: true },
  Importe: { type: Number, required: true }
}, { _id: false });

IvaSchema.statics.calcularArray = async function(alicuotas) {
    let IvaData = [];
        for(let i = 0;i < alicuotas.length;i++) {
            // Convert IVA (front-end sends as percentage) to decimal (ex: 0.21 converts to 21)
            const IvaValue = alicuotas[i].IVA != 0 && alicuotas[i].IVA <= 1 ? alicuotas[i].IVA * 100 : alicuotas[i].IVA;

            const IvaItem = {
                Id: await AliquotsSchema.findOne({ Desc: IvaValue }).then(result => result ? result.Id : null),
                BaseImp: alicuotas[i].Importe * alicuotas[i].Cantidad,
                Importe: (alicuotas[i].Importe * alicuotas[i].Cantidad) * (IvaValue / 100)
            };
            if(process.env.MS_ACCESS_WEBAPP_NODE_ENV == 'dev') {
                console.log('models/Iva.js');
                console.log('IvaValue', IvaValue);
                console.log('IvaItem', IvaItem);
            }
            if(!IvaItem.Id) {
                throw new Error(`Indicaste un tipo de IVA incorrecto: "${alicuotas[i].IVA}"`);
            }
            // Check if this IVA type already exists in the array (IvaData)
            const existingIva = IvaData.find(iva => iva.Id === IvaItem.Id);
            if(existingIva) {
                // If this IVA type already exists, sum the values
                existingIva.BaseImp += IvaItem.BaseImp;
                existingIva.Importe += IvaItem.Importe;
            } else {
                // If it's a new IVA type, add it to the array
                IvaData.push(IvaItem);
            }
        }
        return IvaData;
}

const IvaModel = model("Iva", IvaSchema);

export { IvaSchema, IvaModel };