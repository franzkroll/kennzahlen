const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'dbaccess',
    password : 'test',
    database : 'nodelogin'
});

//TODO create data connection

var app = express();

app.use(session({
    secret            : 'secret',
    resave            : true,
    saveUninitialized : true
}));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
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


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.setHeader('Content-Type', 'text/html');
		/*connection.query("SELECT * FROM accounts",(err, result)=>{
			if (err) {
				console.log(err); 
				response.json({"error":true});
			} else { 
				console.log(result); 
				response.json(result);
			}
		});*/
		response.sendFile(path.join(__dirname+'/chart.html'));
	} else {
		response.send('Please login to view this page!');
	}
	//response.end();
});

app.listen(3000);