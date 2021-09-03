const axios = require('axios');
const express = require('express');
const router = express.Router();

// Routes
router.get('/', (req, res) => {
    res.render('home')
})

module.exports = router;