require('dotenv').config()
const port = 3000;
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');

// Initialize App
const app = express()

// Set handlebars config
app.engine('handlebars', handlebars());

// Set app to use handlebars engine
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'public/views'))
// app.set('views', './public/views')

// Use Body Parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set up express static folderc
app.use(express.static('public'));

// Routes
app.use(require("./public/controllers/routes"));

// Start server
app.listen(port, () => {
    console.log(`Camera App listening on ${port}`);
});

module.exports = app;