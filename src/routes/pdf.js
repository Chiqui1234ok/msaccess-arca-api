import express from 'express';
import Arca from '../classes/Arca.js';
import { Pdf } from '../classes/Pdf.js';
import { auth } from '../helpers/Auth.js';

const router = express.Router();

/**
 * Fetch a voucher in DB with voucher_number and PtoVta, then generate and return its PDF
 */
router.get('/:PtoVta/:VoucherNumber', async(req, res) => {
    try {
        const { PtoVta, VoucherNumber } = req.params;
        const pdf = new Pdf();
        let result = null;
        
        if( !PtoVta || isNaN(PtoVta) || PtoVta < 0 ) {
            return res.status(400).send({ error: 'El punto de venta indicado no es válido. Debe ser un número igual o mayor a cero.' });
        }
        if( !VoucherNumber || isNaN(VoucherNumber) || VoucherNumber <= 0 ) {
            return res.status(400).send({ error: 'El número de comprobante es inválido. '});
        }

        const RazonSocial = process.env.MS_ACCESS_WEBAPP_RAZON_SOCIAL;
        const Direccion = process.env.MS_ACCESS_WEBAPP_DIRECCION;
        const CondicionIVA = process.env.MS_ACCESS_WEBAPP_COND_IVA;
        const CUIT = process.env.MS_ACCESS_WEBAPP_CUIT;
        const IIBB = process.env.MS_ACCESS_WEBAPP_IIBB;
        const InicioDeActividad = process.env.MS_ACCESS_WEBAPP_INICIO_ACTIVIDAD;

        if(!RazonSocial) {
            throw new Error(`Se debe especificar la Razón social del emisor de la factura.`);
        }
        if(!Direccion) {
            throw new Error(`Se debe especificar la dirección del emisor de la factura.`);
        }
        if(!CondicionIVA) {
            throw new Error(`Se debe especificar la Condición del IVA ante ARCA para el emisor de la factura.`);
        }
        if(!CUIT) {
            throw new Error(`El CUIT del emisor no está especificado.`);
        }
        if(!IIBB) {
            throw new Error(`Se debe indicar la suscripción de IIBB.`);
        }
        if(!InicioDeActividad) {
            throw new Error(`Se debe especificar el inicio de actividad del emisor de esta factura.`);
        }
        
        result = await pdf.getVoucherForPdf({ PtoVta, VoucherNumber, RazonSocial, Direccion, CondicionIVA, CUIT, IIBB, InicioDeActividad });
        
        if(process.env.MS_ACCESS_WEBAPP_NODE_ENV == 'dev') {
            console.log(result);
        }

        if( result && result.voucher && result.emisor ) {
            result = await pdf.createInvoice(result);
        } else {
            return res.status(404).send({ error: 'Los datos de este PDF no se pudieron encontrar.' });
        }

        // Configuración de los headers HTTP para que se interprete como PDF
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${result.filename}"`,
            "Content-Length": result.file.length,
            });

        // Se envía el PDF
        res.send(result.file);
    } catch(error) {
        return res.status(500).send({ error: error.message || `Surgió un error desconocido.` });
    }
});

export default router;