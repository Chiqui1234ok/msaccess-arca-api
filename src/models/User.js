import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    jsonwebtoken: {
        type: String,
        required: true
    }
});

// Hook para encriptar antes de guardar
UserSchema.pre('save', async function (next) {
    if(
        !process.env.MS_ACCESS_WEBAPP_PASSWORD_SALT_ROUNDS ||
        isNaN(parseInt(process.env.MS_ACCESS_WEBAPP_PASSWORD_SALT_ROUNDS))
    ) {
        throw new Error('Se debe configurar la cantidad de "rounds" para crear un hash.');
    }

    const saltRounds = parseInt(process.env.MS_ACCESS_WEBAPP_PASSWORD_SALT_ROUNDS);

    // Si no se modificó la contraseña, next()
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Método para comparar contraseñas
UserSchema.methods.verifyPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

UserSchema.methods.signJWT = function () {
    if(!process.env.MS_ACCESS_WEBAPP_JWT_SECRET) {
        throw new Error('Se requiere configurar la clave secreta para firmar un token válido.');
    }

    const payload = {
        id: this._id,
        username: this.username
    };

    // return jwt.sign(payload, process.env.MS_ACCESS_WEBAPP_JWT_SECRET,
    // {
    //     expiresIn: process.env.MS_ACCESS_WEBAPP_JWT_EXPIRATION
    // });
    this.jsonwebtoken = jwt.sign(
        payload,
        process.env.MS_ACCESS_WEBAPP_JWT_SECRET,
        {
            expiresIn: process.env.MS_ACCESS_WEBAPP_JWT_EXPIRATION
        }
    );
};

// Método para verificar y decodificar payload desde un token
UserSchema.statics.verifyJWT = function (token) {
    try {
        // Separa el "Bearer" del token
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new Error( {error: 'Formato de autorización inválido' } );
        }

        const token = parts[1];
        return jwt.verify(token, process.env.MS_ACCESS_WEBAPP_JWT_SECRET);
    } catch (err) {
        return null;
    }
};

const User = model('user', UserSchema);
export default User;