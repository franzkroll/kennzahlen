const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

var uname = null;

var connectionLogin = mysql.createConnection({
	host: 'localhost',
	user: 'dbaccess',
	password: 'test',
	database: 'nodelogin'
});

var app = express();

app.set('view engine', 'ejs');

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
	response.render('pages/login');
});

app.post('/auth', function (request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connectionLogin.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
			if (results.length > 0) {
				user = username;
				request.session.loggedin = true;
				request.session.username = username;
				uname = username;
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

app.get('/home', function (request, response) {
	if (request.session.loggedin) {
		response.setHeader('Content-Type', 'text/html');
		response.render('pages/index', {
			user: uname
		});
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});

app.get('/about', function (request, response) {
	response.render('pages/about');
});

app.get('/example', function (request, response) {
	response.render('pages/graph');
});

app.get('/submit', function (request, response) {
	response.render('pages/submit');
});

app.get('/create', function (request, response) {
	response.render('pages/create');
})

app.listen(4000);