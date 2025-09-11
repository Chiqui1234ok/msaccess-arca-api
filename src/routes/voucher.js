import express from "express";
import Arca from "../classes/Arca.js";

const router = express.Router();

/**
 * Retrieve voucher types (TODO: we need to store all these types in a DB collection + optimization)
 * Example: Factura A, Factura B, Nota de Débito A, Nota de Crédito B, etc.
 */
router.get('/', async (req, res) => {
	const arca = new Arca();
	const { id } = req.query;
	// Retrieve all voucher types
	let result = await arca.ElectronicBilling.getVoucherTypes();
	// If an ID is provided, filter the result to return only that specific voucher type
	if(id && parseInt(id) > 0) {
		const aux = result;
		result = [];
		result.push(aux.find(a => a.Id == id)); // front-end expects an array
		if(!result) res.status(404).send({ error: 'Tipo de comprobante no encontrado.' });
	}
	res.send(result);
});

/**
 * Retrieve specific voucher already registered in ARCA
 */
router.post('/', async (req, res) => {
	const { voucher_number, PtoVta, CbteTipo } = req.body;
	const arca = new Arca();
	const result = await arca.getVoucher({ voucher_number, PtoVta, CbteTipo });
	res.send(result);
});

/**
 * Create a new voucher
 * Note: a voucher can be a Factura A, Factura B, Nota de Débito A, Nota de Crédito B, etc.
 */
router.post('/new', async (req, res) => {
	try {
		const { Concepto, PtoVta, CbteTipo, DocNro, Razon_Social, DocTipo, CondicionIVAReceptorId } = req.body;
		let { FchServDesde, FchServHasta, FchVtoPago, Items } = req.body;

		const arca = new Arca();
		/**
		 * Check required fields
		 * FchVtoPago is always required
		 * If Concepto != 'Producto' (id == 1), then FchServDesde and FchServHasta are also required.
		 */
		if(!FchVtoPago) {
			return res.status(400).send({ error: 'FchVtoPago es obligatorio.' });
		}
		if(Concepto != 1 && (!FchServDesde || !FchServHasta)) {
			return res.status(400).send({ error: 'FchServDesde, FchServHasta y FchVtoPago son obligatorios si Concepto es distinto de "Producto".' });
		}
		// Voucher's date data
		const CbteFch = arca.getArcaDate(new Date());		
		FchServDesde = arca.getArcaDate(FchServDesde);
		FchServHasta = arca.getArcaDate(FchServHasta);
		FchVtoPago = arca.getArcaDate(FchVtoPago);
		
		if(!Items) {
			return res.status(400).send({ error: 'No se han definido items para la factura.' });
		}

		// console.log(Items);

		let { ImpTotal, ImpNeto, ImpIVA } = arca.calculateVoucherSums(Items);
		let Iva = await arca.setIvaArray(Items);

		console.log('Iva calculado:', Iva);

		// Info del comprobante
		let dataForArca = {
			'CantReg': 1,  	// Cantidad de comprobantes a registrar
			Concepto,
			PtoVta: process.env.MS_ACCESS_WEBAPP_NODE_ENV === 'prod' ? PtoVta : 1,
			CbteTipo,
			FchServDesde,
			FchServHasta,
			FchVtoPago,
			DocNro,
			DocTipo,
			CondicionIVAReceptorId,
			CbteFch,
			ImpTotal,
			'ImpTotConc': 0,   		// Importe neto no gravado
			ImpNeto,
			'ImpOpEx' 	: 0,   		// Importe exento de IVA
			ImpIVA,
			'ImpTrib' 	: 0,   		//Importe total de tributos
			'MonId' 	: 'PES', 	// Moneda utilizada ('PES' = AR$)
			'MonCotiz' 	: 1,     	// Cotización de la moneda usada (1 para pesos argentinos)  
			Iva, 					// Alícuotas asociadas al comprobante
			// 'Tributos' 	: items
		};

		const result = await arca.ElectronicBilling.createNextVoucher(dataForArca, false);

		res.send(result);
	} catch(error) {
		console.error(error);
		res.status(500).send({ error: error.message || 'No se pudo crear el comprobante.' });
	}
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

/**
 * Fetch a voucher in DB with voucher_number and PtoVta, then generate and return its PDF
 */
router.post('/pdf', async (req, res) => {
	const { voucher_number, PtoVta } = req.body;
	const arca = new Arca();
	
});

export default router;