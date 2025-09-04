import express from "express";
import Arca from "../classes/Arca.js";

const router = express.Router();

/**
 * Retrieve voucher types
 * Example: Factura A, Factura B, Nota de Débito A, Nota de Crédito B, etc.
 */
router.get('/', async (req, res) => {
	const arca = new Arca();

	const { id } = req.query;
	let result = await arca.ElectronicBilling.getVoucherTypes();
	if(id && parseInt(id) > 0) {
		result = result.find(a => a.Id == id);
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
	const { Concepto, PtoVta, CbteTipo, DocNro, Razon_Social, DocTipo, CondicionIVAReceptorId } = req.body;
	let { FchServDesde, FchServHasta, FchVtoPago, Items } = req.body;

	const arca = new Arca();
	// TODO: Validate all required fields
	
	// Voucher's date
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0"); // 01~12
	const day = String(now.getDate()).padStart(2, "0");        // 01~31
	const CbteFch = `${year}${month}${day}`;
	// These fields are optional, only if Concepto != 'Producto'
	FchServDesde = FchServDesde ? arca.getArcaDate(FchServDesde) : null;
	FchServHasta = FchServHasta ? arca.getArcaDate(FchServHasta) : null;
	FchVtoPago = FchVtoPago ? arca.getArcaDate(FchVtoPago) : null;
	
	if(!Items) {
		return res.status(400).send({ error: 'No se han definido items.' });
	}

	// Items = await Items.map(async item => {
	// 	item.Id = await arca.getIvaByDesc(item.IVA);
	// 	if(!item.Id) {
	// 		throw new Error(`Indicaste un tipo de IVA incorrecto: "${item.IVA}"`);
	// 	}
	// 	return {
	// 		...item,
	// 		Id: item.Id
	// 	};
	// });

	console.log(Items);

	let { ImpTotal, ImpNeto, ImpIVA } = arca.calculateVoucherSums(Items);

	// Info del comprobante
	let dataForArca = {
		'CantReg': 1,  	// Cantidad de comprobantes a registrar
		Concepto,
		// PtoVta,
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
		'ImpTotConc': 0,   // Importe neto no gravado
		ImpNeto,
		'ImpOpEx' 	: 0,   	// Importe exento de IVA
		ImpIVA,
		'ImpTrib' 	: 0,   	//Importe total de tributos
		'MonId' 	: 'PES', // Moneda utilizada ('PES' = AR$)
		'MonCotiz' 	: 1,     // Cotización de la moneda usada (1 para pesos argentinos)  
		'Iva' 		: Items // Alícuotas asociadas al comprobante
		// 'Tributos' 	: items
	};

    const result = await arca.ElectronicBilling.createNextVoucher(dataForArca, false);

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

// router.post('/pdf', async (req, res) => {
// 	const html = require('fs').readFileSync('../templates/invoice.html', 'utf8');
// 	const arca = new Arca();

// 	// Nombre para el archivo (sin .pdf)
// 	const name = 'PDF de prueba';
	
// 	// Opciones para el archivo
// 	const options = {
// 	width: 8, // Ancho de pagina en pulgadas. Usar 3.1 para ticket
// 	marginLeft: 0.4, // Margen izquierdo en pulgadas. Usar 0.1 para ticket 
// 	marginRight: 0.4, // Margen derecho en pulgadas. Usar 0.1 para ticket 
// 	marginTop: 0.4, // Margen superior en pulgadas. Usar 0.1 para ticket 
// 	marginBottom: 0.4 // Margen inferior en pulgadas. Usar 0.1 para ticket 
// 	};
	
// 	// Creamos el PDF
// 	const result = await afip.ElectronicBilling.createPDF({
// 		html: html,
// 		file_name: name,
// 		options: options
// 	});
	
// 	// Mostramos la url del archivo creado
// 	console.log(result.file);
// });

export default router;