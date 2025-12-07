// 👇 Esto lo podemos convertir en un ENUM, si el proyecto se convierte a TypeScript
const DateFormatSlashes = {
    YMD: "${year}/${month}/${day}", // YYYYMMDD
    DMY: "${day}/${month}/${year}", // DDMMYYYY
    MDY: "${month}/${day}/${year}"  // MMDDYYYY
};

export default DateFormatSlashes;