const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const serverStatus = require('express-server-status');
const helmet = require('helmet');
const path = require('path');

const port = 4000;

var routes = require('./routes/index.js');

// Application uses express for rendering and displaying pages
var app = express();

// Set ejs as view engine
app.set('view engine', 'ejs');

app.use(helmet());

// Path for linking stylesheet
app.use(express.static(path.resolve('./public')));

// session login credentials
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

// Display simple server status
app.use('/stats', serverStatus(app));

routes(app);

// Start server on port that was previously defined
app.listen(port, function () {
	console.log('Server listening on port ' + port + ' …');
});