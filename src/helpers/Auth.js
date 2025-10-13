import User from '../models/User.js'

export const auth = (req, res, next) => {
    try {
        let authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Token no encontrado.' });
        }
        const payload = User.verifyJWT(authHeader);
        req.user = payload;
        next();
    } catch(error) {
        return res.status(401).json({ error: 'Token inválido.' });
    }
};
