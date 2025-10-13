import express from 'express';
import Arca from '../classes/Arca.js';
import { Pdf } from '../classes/Pdf.js';
import { auth } from '../helpers/Auth.js';

const router = express.Router();

/**
 * Fetch a voucher in DB with voucher_number and PtoVta, then generate and return its PDF
 */
router.get('/:PtoVta/:VoucherNumber', auth, async(req, res) => {
    const { PtoVta, VoucherNumber } = req.params;
    const arca = new Arca();
    let pdf = new Pdf();

    if( !PtoVta || isNaN(PtoVta) || PtoVta < 0 ) {
        res.status(400).send({ error: 'El punto de venta indicado no es válido. Debe ser un número igual o mayor a cero.' });
    }
    if( !VoucherNumber || isNaN(VoucherNumber) || VoucherNumber <= 0 ) {
        res.status(400).send({ error: 'El número de comprobante es inválido. '});
    }
    
    const voucher = await arca.getVoucherFromDb({ PtoVta, VoucherNumber });
    if( voucher && voucher._id ) {
        pdf = await pdf.createInvoice(voucher);
    } else {
        res.status(404).send({ error: 'Tipo de comprobante no encontrado.' });
    }

    // Configuración de los headers HTTP para que se interprete como PDF
    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pdf.filename}"`,
        "Content-Length": pdf.file.length,
        });

    // Se envía el PDF
    res.send(pdf.file);
});

export default router;