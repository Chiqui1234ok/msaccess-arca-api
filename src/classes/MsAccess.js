import DateFormatSlashes from "../helpers/DateFormatSlashes.js";

class MsAccess {
    constructor() {

    }

    /**
     * 
     * @param {*} date - ex: "2025-08-01T03:00:00.000Z" 
     * @param format - ex: "YMD", "DMY", etc. This uses an ENUM
     * @returns ex: "2025-08-01T03:00:00.000Z" formatted to "20250801" (ARCA uses this format)
     */
    static getDate(date = new Date(), format = DateFormatSlashes.YMD) {
        const d = (date instanceof Date) ? date : new Date(date);

        console.log('date', date);
        console.log('d', d);
        console.log('format', format);
        const localTime = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        const year = localTime.getFullYear().toString();
        console.log('year', year);
        const month = String(localTime.getMonth() + 1).padStart(2, "0");
        console.log('month', month);
        const day = String(localTime.getDate()).padStart(2, "0");
        console.log('day', day);

        // Evaluar el enum usando replace
        return format
            .replace("${year}", `${year}`)
            .replace("${month}", `${month}`)
            .replace("${day}", `${day}`);
    }

    static getPdfUrl(PtoVta, VoucherNumber) {
        const baseUrl = process.env.MS_ACCESS_WEBAPP_NODE_ENV === 'prod' ? 
        process.env.MS_ACCESS_WEBAPP_API_BASE_URL_PROD :
        process.env.MS_ACCESS_WEBAPP_API_BASE_URL_DEV;
		const PDFUrl = `${baseUrl}/arca/pdf/${PtoVta}/${VoucherNumber}`;
        return PDFUrl;
    }

    /**
     * 
     * @param {*} PtoVta 
     * @param {*} VoucherNumber 
     * @returns PtoVta-VoucherNumber, ex: 00004-000047
     */
    static getFullVoucherNumber(PtoVta, VoucherNumber) {
        const pos = String(PtoVta).padStart(5, "0");
        const voucherNumber = String(VoucherNumber).padStart(6, "0");
        return `${pos}-${voucherNumber}`;
    }
}

export default MsAccess;