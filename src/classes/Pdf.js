import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { __root } from "../config/paths.js";

export class Pdf {
    constructor() {}

    async createInvoice(data) {
        const templatePath = path.join(__root, "templates", "factura.html");
        const templateHtml = fs.readFileSync(templatePath, "utf8");

        const template = Handlebars.compile(templateHtml);
        const htmlFinal = template(data);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlFinal, { waitUntil: "networkidle0" });

        /**
         * Save the PDF in the "public/invoices" folder with a name like "factura_00001-000005_20250908.pdf"
         *  */
        const PtoVta = String(data.PtoVta).padStart(5, "0");
        const voucher_number = String(data.voucher_number).padStart(6, "0");
        const CbteFch = String(data.CbteFch);
        const filename = `factura_${PtoVta}-${voucher_number}_${CbteFch}.pdf`;
        const filePath = path.join(__root, "public", "invoices", filename);
        await page.pdf({
            path: filePath,
            format: "A4",
            printBackground: true,
        });
        await browser.close();

        if(!process.env.MS_ACCESS_WEBAPP_API_BASE_URL) {
            throw new Error('La URL del API no está definida.');
        }
        const baseUrl = process.env.MS_ACCESS_WEBAPP_API_BASE_URL;
        return `${baseUrl}/public/invoices/${filename}`;
	}

}