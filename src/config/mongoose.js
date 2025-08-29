import Database from '../classes/Mongoose.js';

if(!process.env.MS_ACCESS_WEBAPP_DATABASE_NAME)
    throw new Error('El nombre de la base de datos no fue especificado.');
if(!process.env.MS_ACCESS_WEBAPP_NODE_ENV)
    throw new Error('El entorno del back-end no fue establecido.');

let db = null;

try {
    db = new Database(`${process.env.MS_ACCESS_WEBAPP_DATABASE_NAME}-${process.env.MS_ACCESS_WEBAPP_NODE_ENV}`);
    console.log(`Base de datos conectada: ${process.env.MS_ACCESS_WEBAPP_DATABASE_NAME}-${process.env.MS_ACCESS_WEBAPP_NODE_ENV}`);
} catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    throw new Error('No se pudo conectar a la base de datos.');
}

export default db;