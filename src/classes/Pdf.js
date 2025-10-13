import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { __root } from "../config/paths.js";

export class Pdf {
    constructor() {}

    async createInvoice(data) {
        // Compilación del template
        const templatePath = path.join(__root, "templates", "invoice.html");
        const templateHtml = fs.readFileSync(templatePath, "utf8");
        const template = Handlebars.compile(templateHtml);
        const htmlFinal = template(data);
        console.log(data);
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