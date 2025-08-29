import express from "express";
import Arca from "../classes/Arca.js";

const router = express.Router();

/**
 * Retrieve voucher types
 * Example: Factura A, Factura B, Nota de Débito A, Nota de Crédito B, etc.
 */
router.get('/', async (req, res) => {
	const arca = new Arca();
	const result = await arca.ElectronicBilling.getVoucherTypes();
	res.send(result);
});

/**
 * Create a new voucher
 * Note: a voucher can be a Factura A, Factura B, Nota de Débito A, Nota de Crédito B, etc.
 */
router.post('/new', async (req, res) => {
	const { Concepto, PtoVta, CbteTipo, FchVto, Cliente, DocTipo, CondicionIVAReceptorId, items } = req.body;

	const arca = new Arca();

	const date = new Date(Date.now() - ((new Date()).getTimezoneOffset() * 60000)).toISOString().split('T')[0];

	const { ImpTotal, ImpNeto, ImpIVA } = arca.calculateVoucherSums(items);
	// Info del comprobante
	let dataForArca = {
		'CantReg': 1,  	// Cantidad de comprobantes a registrar
		Concepto,
		// PtoVta,
		PtoVta: 10, 	// Punto de venta TESTING (forzado)
		CbteTipo,
		FchVto, 		// Fecha vencimiento para la factura al generar PDF
		DocNro,
		DocTipo,
		CondicionIVAReceptorId,
		'CbteFch' 	: parseInt(date.replace(/-/g, '')),
		ImpTotal,
		'ImpTotConc': 0,   // Importe neto no gravado
		ImpNeto,
		'ImpOpEx' 	: 0,   	// Importe exento de IVA
		ImpIVA,
		'ImpTrib' 	: 0,   	//Importe total de tributos
		'MonId' 	: 'PES', // Moneda utilizada ('PES' = AR$)
		'MonCotiz' 	: 1,     // Cotización de la moneda usada (1 para pesos argentinos)  
		'Iva' 		: items // Alícuotas asociadas al comprobante
		// 'Tributos' 	: items
	};

    const result = await arca.ElectronicBilling.createNextVoucher(dataForArca, false);

    result['CAE']; //CAE asignado el comprobante
    result['CAEFchVto']; //Fecha de vencimiento del CAE (yyyy-mm-dd)

    res.send(result);
});

/**
 * Retrieves concept types for the voucher
 * Example: Productos, Servicios, Productos y Servicios
 */
router.get('/conceptTypes', async (req, res) => {
	const arca = new Arca();
	const result = await arca.ElectronicBilling.getConceptTypes();
	res.send(result);
});

export default router;