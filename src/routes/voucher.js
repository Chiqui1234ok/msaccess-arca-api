import express from "express";
import Arca from "../classes/Arca.js";
import Voucher from "../models/Voucher.js";
import { IvaModel } from "../models/Iva.js";

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
		const { PtoVta, VoucherItems, VoucherTributos } = req.body;		

		console.log('Lo que llega de Access:', req.body);

		const arca = new Arca();
		const newVoucher = new Voucher(req.body);
		newVoucher.validarInput(req.body);

		// 🏁 Cálculo de datos básicos
		newVoucher.PtoVta = process.env.MS_ACCESS_WEBAPP_NODE_ENV == 'dev' ? 1 : PtoVta;
		newVoucher.calcularFechasArca();	

		// 🏁 Cálculo de alícuotas de IVA
		newVoucher.Iva = await IvaModel.calcularArray(VoucherItems);

		// 🏁 Cálculo de tributos
		if(VoucherTributos) {
			const Tributos = await arca.setTributesArray(VoucherTributos);
			// Se escriben los Tributos sólo
			if(Tributos.length > 0)	newVoucher.Tributos = Tributos;
		}
		newVoucher.ImpTrib = newVoucher.Tributos ? newVoucher.Tributos.reduce((resultado, Tributo) => resultado + Number(Tributo.Importe || 0), 0) : 0;

		// Cálculo de sumas/totales del voucher
		newVoucher.calcularSumasDelVoucher(VoucherItems);
		console.log('ImpIVA', newVoucher.ImpIVA);

		let dataForArca = newVoucher.toObject();
		dataForArca.CantReg = 1;

		console.log('Se enviará a ARCA:', dataForArca);

		const result = await arca.ElectronicBilling.createNextVoucher(dataForArca, false);
		if(!result.voucherNumber) {
			return res.status(500).send({ error: error.message || 'Hubo un error en ARCA y no pudo generarse el comprobante.' });
		}
		
		await newVoucher.save();
		console.log('Comprobante creado y guardado en DB local:', newVoucher);

		res.send(newVoucher);
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