const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const serverStatus = require('express-server-status');
const helmet = require('helmet');

const port = 5000;

var userLocal = {
	name: null,
	role: null
};

// Create SQL-Connection for accessing user data
var connectionLogin = mysql.createConnection({
	host: 'localhost',
	user: 'dbaccess',
	password: 'test',
	database: 'nodelogin'
});

// Application uses express for rendering and displaying pages
var app = express();

// Set ejs as view engine
app.set('view engine', 'ejs');

app.use(helmet());

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

// Render login page when user first accesses the application
app.get('/', function (request, response) {
	response.render('pages/login');
});

/**
 * Redirects user to landing page if login was successful. Returns error message otherwise.
 */
// TODO: prevent sql injection
app.post('/auth', function (request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connectionLogin.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
			if (results.length > 0) {
				user = username;
				request.session.loggedin = true;
				request.session.username = username;
				userLocal.name = username;
				// TODO: add role to mysql database, query database for role
				userLocal.role = "Test";
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

// Render Homepage and display selection menus and header
app.get('/home', function (request, response) {
	if (request.session.loggedin) {
		response.setHeader('Content-Type', 'text/html');
		response.render('pages/index', {
			user: userLocal
		});
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});

// Display simple About Page
app.get('/about', function (request, response) {
	response.render('pages/about', {
		user: userLocal
	});
});

// Display visualization of data
// TODO: better name for example
app.get('/example', function (request, response) {
	response.render('pages/graph', {
		user: userLocal
	});
});

// Display menu for entering data
app.get('/submit', function (request, response) {
	response.render('pages/submit', {
		user: userLocal
	});
});

// Display menu for creating new Kennzahlen
app.get('/create', function (request, response) {
	response.render('pages/create', {
		user: userLocal
	});
});

// Display basic managign informations for a superuser or admin
app.get('/stats', function (request, response) {
	response.render('pages/stats', {
		user: userLocal
	});
});

// Return error message if requested page doesn't exist
app.get('*', function (request, response) {
	response.status(404).send("Seite konnte nicht gefunden werden.");
});

// Start server on port that was previously defined
app.listen(port);