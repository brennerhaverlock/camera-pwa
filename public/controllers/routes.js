const express = require('express');
const router = express.Router();

// Routes
router.get('/', (req, res) => {
    res.render('home')
})

router.get('/show-photos', (req, res) => {
    res.render('show-photos')
})

module.exports = router;