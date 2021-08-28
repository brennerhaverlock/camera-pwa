const axios = require('axios');
const express = require('express');
const router = express.Router();

const openWeatherApiKey = '067032376010c13019b8fa3b20785eed'

// Routes
router.get('/', (req, res) => {
    res.render('home')
})

module.exports = router;