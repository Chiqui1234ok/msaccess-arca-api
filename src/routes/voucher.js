import express from "express";
import Arca from "../classes/Arca.js";
import Voucher from "../models/Voucher.js";
import { IvaModel } from "../models/Iva.js";
import DateFormat from "../helpers/DateFormat.js";
import { auth } from "../helpers/Auth.js";

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
		if(!result) return res.status(404).send({ error: 'Tipo de comprobante no encontrado.' });
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
router.post('/new', auth, async (req, res) => {
	try {
		const { PtoVta, VoucherItems, VoucherTributos } = req.body;		

		console.log('Lo que llega de Access:', req.body);

		const arca = new Arca();

		const newVoucher = new Voucher(req.body);
		await newVoucher.validarInput(req.body);

		// 1. Cálculo de datos básicos
		newVoucher.PtoVta = process.env.MS_ACCESS_WEBAPP_NODE_ENV == 'dev' ? 1 : PtoVta;
		newVoucher.calcularFechasArca();	

		// 2. Cálculo de alícuotas de IVA
		newVoucher.Iva = await IvaModel.calcularArray(VoucherItems);

		// 3. Cálculo de tributos
		if(VoucherTributos) {
			const Tributos = await arca.setTributesArray(VoucherTributos);
			// Se escriben los Tributos sólo
			if(Tributos.length > 0)	newVoucher.Tributos = Tributos;
		}
		newVoucher.ImpTrib = newVoucher.Tributos ? newVoucher.Tributos.reduce((resultado, Tributo) => resultado + Number(Tributo.Importe || 0), 0) : 0;

		// 4. Cálculo de sumas/totales del voucher
		newVoucher.calcularSumasDelVoucher(VoucherItems, newVoucher.ImpTrib);

		let dataForArca = newVoucher.toObject();
		dataForArca.CantReg = 1;

		console.log('Se enviará a ARCA:', dataForArca);

		const result = await arca.ElectronicBilling.createNextVoucher(dataForArca, false);
		if(!result.voucherNumber) {
			return res.status(500).send({ error: error.message || 'Hubo un error en ARCA y no pudo generarse el comprobante.' });
		}

		newVoucher.VoucherNumber = result.voucherNumber;
		newVoucher.CAE = result.CAE;
		newVoucher.CAEFchVto = result.CAEFchVto;

		await newVoucher.save();
		console.log('Comprobante creado y guardado en DB local:', newVoucher);

		// Se devuelven los campos requeridos para que el front-end (Microsoft Access) añada el registro a su base de datos
		const CbteFch = arca.getAccessDate( new Date(req.body.CbteFch), DateFormat.DMY );
		console.log('CbteFch', CbteFch);
		const FchVtoPago = arca.geAccessDate( new Date(req.body.FchVtoPago), DateFormat.DMY );
		// Se construye la URL 👇
		const baseUrl = process.env.MS_ACCESS_WEBAPP_NODE_ENV === 'prod' ? process.env.MS_ACCESS_WEBAPP_API_BASE_URL_PROD : process.env.MS_ACCESS_WEBAPP_API_BASE_URL_DEV;
		const PDFUrl = `${baseUrl}/arca/pdf/${newVoucher.PtoVta}/${newVoucher.VoucherNumber}`;
		// Se envía a front-end 👇
		res.send({
			N_FACTURA: result.voucherNumber,
			FECHA: CbteFch,
			IMPORTE: newVoucher.ImpTotal,
			FECHA_DE_VENCIMIENTO: FchVtoPago,
			VER_FACTURA: PDFUrl, // la URL es una ruta POST de la API porque el PDF se genera en el momento
			idCliente: newVoucher.IdClienteEnAccess
		});
	} catch(error) {
		console.error(error);
		return res.status(500).json(error.message || 'No se pudo crear el comprobante.');
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

export default router;