import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { __root } from "../config/paths.js";
import Arca from "./Arca.js";

export class Pdf {
    constructor() {}

    async getVoucherForPdf(data) {
        const arca = new Arca();
        const result = await arca.getVoucherFromDb({ 
            PtoVta: data.PtoVta, 
            VoucherNumber: data.VoucherNumber
        });

        if( !result || !result._id ) {
            throw new Error(`No se encontró el voucher para generar el PDF.`);
        }

        const emisor = {
            RazonSocial: data.RazonSocial,
            Direccion: data.Direccion,
            CondicionIVA: data.CondicionIVA,
            CUIT: data.CUIT,
            IIBB: data.IIBB,
            InicioDeActividad: data.InicioDeActividad
        };
        const receptor = {
            RazonSocial: result.RazonSocial,
            DocNro: result.DocNro,
            CondicionIVAReceptorId: result.CondicionIVAReceptorId
        };
        const voucher = {
            PtoVta: result.PtoVta,
            VoucherNumber: result.VoucherNumber,
            CbteFch: result.CbteFch,
            FchServDesde: result.FchServDesde,
            FchServHasta: result.FchServHasta,
            FchVtoPago: result.FchVtoPago,
            Concepto: await arca.getConceptoById(result.Concepto),
            ImpIVA: result.ImpIVA,
            ImpTrib: result.ImpTrib,
            ImpTotal: result.ImpTotal,
            Iva: result.Iva.toObject(),
            Tributos: result.Tributos.toObject(),
            CAE: result.CAE,
            CAEFchVto: result.CAEFchVto
        }

        return {
            emisor,
            receptor,
            voucher
        };
    }

    async createInvoice(data) {
        // Compilación del template
        const templatePath = path.join(__root, "templates", "invoice.html");
        const templateHtml = fs.readFileSync(templatePath, "utf8");
        const template = Handlebars.compile(templateHtml);
        console.log('createInvoice() debug');
        console.log(JSON.stringify(data, null, 2));
        const htmlFinal = template(data);
        // Renderizar PDF
        let args = [];
        if(process.env.MS_ACCESS_WEBAPP_NODE_ENV != 'prod') {
            args.push('--no-sandbox');
            args.push('--disable-setuid-sanbox');
        }
        const browser = await puppeteer.launch({ args });
        const page = await browser.newPage();
        await page.setContent(htmlFinal, { waitUntil: "networkidle0" });

        const file = await page.pdf({
            format: "A4",
            printBackground: true,
        });

        await browser.close();

        const filename = `${String(data.PtoVta).padStart(5, '0')}-${data.VoucherNumber}.pdf`;
        return { filename, file };
	}

}