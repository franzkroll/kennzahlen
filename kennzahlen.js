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
const Ddos = require('ddos');
const https = require('https');
require('dotenv').config();
const winston = require('winston');
require('winston-daily-rotate-file');

// Load https certificates, just self signed ones, should be okay with internal use
const options = {
	key: fs.readFileSync('cert/server.key'),
	cert: fs.readFileSync('cert/server.cert')
};

// Automatic log file saving with winston, logs are saved for 14 days
const defaultLog = new(winston.transports.DailyRotateFile)({
	filename: './logs/kennzahlen-%DATE%.log',
	datePattern: 'DD-MM-YYYY',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d'
});

const logger = winston.createLogger({
	transports: [
		defaultLog
	]
});

// Get current time and date, add them to every printed debug
console.log = function (d) {
	const time = new Date();
	const dateString = (time.toDateString() + " / " + time.toTimeString()).split('(');
	console.info(dateString[0] + ': ' + util.format(d));
	logger.info(dateString[0] + ': ' + util.format(d) + '\n');
};

// Start server on Port 8080 if no other port is specified
const port = process.env.PORT || process.env.SERVER_PORT;
// Start server on localhost if no other ip is specified
const ip = process.env.IP || process.env.SERVER_IP;

// link routes 
const routes = require('./routes/index.js');

// Application uses express for rendering and displaying pages
const app = express();

// DDos prevention, shows 429 error after too many requests, maybe lower threshold a bit?
const ddos = new Ddos({
	burst: 7,
	limit: 25,
	testmode: false,
	whitelist: []
});

// DDos prevention
app.use(ddos.express);

// Set ejs as view engine for serving pages
app.set('view engine', 'ejs');

// Prevention against multiple attacks
app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.referrerPolicy({
	policy: 'same-origin'
}));

// Set icon for tabs etc.
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

// Reduces data, increases website reaction speed
app.use(compression());

// Path for linking stylesheet and script helpers for pages
app.use(process.env.BASEURL ,express.static(path.resolve('./public')));

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
	saveUninitialized: false
}));

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

routes(app);

// Start server on port that was previously defined
const server = https.createServer(options, app).listen(port, ip, function () {
	console.log('Server listening on https://' + ip + ':' + port + ' …');
});

// Logs Current Connections
setInterval(() => server.getConnections(
	(err, connections) => console.log(`${connections} connections currently open`)
), 50000);

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