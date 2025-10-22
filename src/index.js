import 'dotenv/config'
// Import express
import express from 'express';
// Import database
import db from './config/mongoose.js';
import morgan from './config/morgan.js';
// Import routes
import documents from './routes/documents.js';
import index from './routes/index.js';
import iva from './routes/iva.js';
import pdf from './routes/pdf.js'
import pos from './routes/pos.js';
import tributes from './routes/tributes.js';
import user from './routes/user.js'
import voucher from './routes/voucher.js';
import { __invoice } from "./config/paths.js";

// Start application
if(!process.env.MS_ACCESS_WEBAPP_PORT)
  throw new Error('El puerto del back-end no está definido.');
const port = parseInt(process.env.MS_ACCESS_WEBAPP_PORT);
const app = express();

// Connect with database
await db.connect();

// Call morgan for logging
app.use(morgan);

// Support for json
app.use(express.json());

// Make "public" folder accessible
app.use(express.static(__invoice));

// Routes
app.use('/arca/documents', documents);
app.use('/', index);
app.use('/arca/iva', iva);
app.use('/arca/pdf', pdf);
app.use('/arca/pos', pos);
app.use('/arca/tributes', tributes);
app.use('/user', user);
app.use('/arca/voucher', voucher);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});