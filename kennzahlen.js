// Imports 
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const util = require('util');
const favicon = require('serve-favicon');
const Ddos = require('ddos')

// Overwrite default console log and write into debug.log instead..
const log_file = fs.createWriteStream(__dirname + '/debug.log', {
	flags: 'w'
});
const log_stdout = process.stdout;

// Get current time and date, add them to every printed debug
console.log = function (d) {
	const time = new Date();
	const dateString = (time.toDateString() + " / " + time.toTimeString()).split('(')
	log_file.write(dateString[0] + ': ' + util.format(d) + '\n');
	log_stdout.write(dateString[0] + ': ' + util.format(d) + '\n');
};

// start server on Port 4000 if no other port is specified
const port = process.env.PORT || 5000;

// link routes 
const routes = require('./routes/index.js');

// Application uses express for rendering and displaying pages
const app = express();

// DDos prevention, shows 429 error after too many requests
const ddos = new Ddos({
	burst: 5,
	limit: 20,
	testmode: false,
	whitelist: []
});
app.use(ddos.express)

// Set ejs as view engine for serving pages
app.set('view engine', 'ejs');

// Security function
app.use(helmet());

// Set icon for tabs etc.
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

// Reduces data, increases website reaction speed
app.use(compression());

// Path for linking stylesheet
app.use(express.static(path.resolve('./public')));

// Logout user after 30 minutes
const logoutMinutes = 30;

// Session login credentials
app.use(session({
	cookie: {
		maxAge: 60000 * logoutMinutes // Automatic logout after 30 minutes of inactivity
	},
	rolling: true,
	resave: false,
	secret: 'secret',
	saveUninitialized: false // Don't save sessions that aren't logged in.
}));

// Handles post Request for Login
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

routes(app);

// Start server on port that was previously defined
const server = app.listen(port, function () {
	console.log('Server listening on port ' + port + ' …');
});

// Logs Current Connections
setInterval(() => server.getConnections(
	(err, connections) => console.log(`${connections} connections currently open`)
), 10000);

// Activate shutDown function when SIGTERM or SIGINT is received (process is cancelled)
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

// Saves current connections to the server
let connections = [];

// Log connections in array
server.on('connection', connection => {
	connections.push(connection);
	connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

// Handles better shutdown of server
function shutDown() {
	console.log('Received kill signal, shutting down gracefully');
	server.close(() => {
		console.log('Closed out remaining connections');
		process.exit(0);
	});

	// Force shutdown when timeout is reached, 10s
	setTimeout(() => {
		console.error('Could not close connections in time, forcefully shutting down');
		process.exit(1);
	}, 10000);

	// Try to end connections to the server, destroy if timeout is reached
	connections.forEach(curr => curr.end());
	setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
}