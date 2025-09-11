import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const __root = path.resolve(__dirname, "../");
export const __invoice = path.resolve(__root, "public", "invoice");