import express from 'express';
import User from '../models/User.js'
const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if(!username || !password) {
            res.status(400).send({ error: `Se debe especificar el usuario y contraseña` });
        }

        const user = await User.findOne({ username });
        const validPassword = user.verifyPassword(password);
        if(validPassword && user && user._id) {
            user.signJWT();
            await user.save();
        } else {
            res.status(400).send({ error: `La contraseña para el usuario ${username} no es correcta.` });
        }
        res.send(user.jsonwebtoken);
    } catch(error) {
        res.status(500).send({ error: error.message || 'Hay un problema en el servidor. Reportalo al administrador del sistema.' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({
            username,
            password
        });
        user.signJWT();
        await user.save();

        if(user && user._id) {
            res.send(user.jsonwebtoken);
        } else {
            throw new Error(`El usuario ${username} no pudo crearse.`);
        }
    } catch(error) {
        res.status(500).send({ error: error.message || 'Hay un problema en el servidor. Reportalo al administrador del sistema.' });
    }
})

export default router;