import express from 'express';
const router = express.Router();

// Placeholder route for the index
router.get('/', (req, res) => {
    res.send('Welcome to the MS Access Arca API');
});

export default router;