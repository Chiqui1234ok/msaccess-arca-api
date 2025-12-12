import express from "express";
import Arca from "../classes/Arca.js";
import Voucher from "../models/Voucher.js";
import { IvaModel } from "../models/Iva.js";
import DateFormat from "../helpers/DateFormat.js";
import ConceptTypes from '../classes/ConceptTypes.js'
import IvaAliquots from "../classes/IvaAliquots.js";
import MsAccess from '../classes/MsAccess.js'
import DateFormatSlashes from "../helpers/DateFormatSlashes.js";

const router = express.Router();

/**
 * Retrieve voucher types (TODO: we need to store all these types in a DB collection + optimization)
 * Example: Factura A, Factura B, Nota de Débito A, Nota de Crédito B, etc.
 */
router.get('/voucher', async (req, res) => {
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
router.post('/voucher', async (req, res) => {
	const { voucher_number, PtoVta, CbteTipo } = req.body;
	const arca = new Arca();
	const result = await arca.getVoucher({ voucher_number, PtoVta, CbteTipo });
	res.send(result);
});

/**
 * Create a new voucher
 * Note: a voucher can be a Factura A, Factura B, Nota de Débito A, Nota de Crédito B, etc.
 */
router.post('/voucher/new', async (req, res) => {
	try {
		const { PtoVta, VoucherItems, VoucherTributos } = req.body;		

		console.log('Lo que llega de Access:', req.body);

		const arca = new Arca();

		const voucherForDb = new Voucher(req.body);
		await voucherForDb.validarInput(req.body);

		// 1. Cálculo de datos básicos
		voucherForDb.PtoVta = process.env.MS_ACCESS_WEBAPP_NODE_ENV == 'dev' ? 1 : PtoVta;
		voucherForDb.calcularFechasArca();	

		// 2. Cálculo de alícuotas de IVA
		voucherForDb.Iva = await IvaAliquots.calcularArray(VoucherItems);

		// 3. Cálculo de tributos
		if(VoucherTributos) {
			const Tributos = await arca.setTributesArray(VoucherTributos);
			// Se escriben los Tributos sólo
			if(Tributos.length > 0)	voucherForDb.Tributos = Tributos;
		}
		voucherForDb.ImpTrib = voucherForDb.Tributos ? voucherForDb.Tributos.reduce((resultado, Tributo) => resultado + Number(Tributo.Importe || 0), 0) : 0;

		// 4. Cálculo de sumas/totales del voucher
		voucherForDb.calcularSumasDelVoucher(VoucherItems, voucherForDb.ImpTrib);

		let voucherForArca = voucherForDb.toObject();
		voucherForArca.CantReg = 1;
		// Removes "Desc", because ARCA will not accept this

		if (Array.isArray(voucherForArca.Iva)) {
			voucherForArca.Iva.forEach(obj => delete obj.Desc);
		}

		if (Array.isArray(voucherForArca.Tributos)) {
			voucherForArca.Tributos.forEach(obj => delete obj.Desc);
		}

		console.log('Se enviará a ARCA:', voucherForArca);

		const result = await arca.ElectronicBilling.createNextVoucher(voucherForArca, false);
		if(!result.voucherNumber) {
			return res.status(500).send({ error: error.message || 'Hubo un error en ARCA y no pudo generarse el comprobante.' });
		}

		voucherForDb.VoucherNumber = result.voucherNumber;
		voucherForDb.CAE = result.CAE;
		voucherForDb.CAEFchVto = result.CAEFchVto;

		await voucherForDb.save();
		console.log('Comprobante creado y guardado en DB local:', voucherForDb);

		// Se devuelven los campos requeridos para que el front-end (Microsoft Access) añada el registro a su base de datos
		const CbteFch = MsAccess.getDate(new Date(), DateFormatSlashes.DMY );
		const FchVtoPago = MsAccess.getDate( new Date(req.body.FchVtoPago), DateFormatSlashes.DMY );
		console.log('CbteFch:', CbteFch);
		console.log('FchVtoPago', FchVtoPago);

		// Se construye la URL 👇
		const PDFUrl = MsAccess.getPdfUrl(voucherForDb.PtoVta, voucherForDb.VoucherNumber);
		// Se envía a front-end 👇
		res.send({
			NRO_FACTURA: result.voucherNumber,
			FECHA: CbteFch,
			IMPORTE: voucherForDb.ImpTotal,
			// FECHA_DE_VENCIMIENTO: FchVtoPago,
			VER_FACTURA: PDFUrl, // la URL es una ruta POST de la API porque el PDF se genera en el momento
			idCliente: voucherForDb.IdClienteEnAccess
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
router.get('/voucher/conceptTypes', async (req, res) => {
	const result = await ConceptTypes.get();
	res.send(result);
});

export default router;