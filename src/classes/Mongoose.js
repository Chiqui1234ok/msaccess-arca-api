import { connect } from 'mongoose';

class Database {
    constructor(dbName) {
        this.dbName = dbName;
    }

    async connect() {
        if(!this.dbName)
            throw new Error('El nombre de la base de datos no fue especificado.');
        
        await connect(`mongodb://127.0.0.1:27017/${this.dbName}`);
    }
}

export default Database;