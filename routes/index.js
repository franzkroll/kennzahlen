module.exports = function (app) { // Render Homepage and display selection menus and header
    const mysql = require('mysql');

    var userLocal = {
        name: null,
        role: null
    };

    // Render login page when user first accesses the application
    app.get('/', function (request, response) {
        response.render('pages/login');
    });

    // TODO: comments, sql injection
    app.post('/auth', function (request, response) {
        var username = request.body.username;
        var password = request.body.password;

        // Create SQL-Connection for accessing user data
        var connectionLogin = mysql.createConnection({
            host: 'localhost',
            user: 'dbaccess',
            password: 'test',
            database: 'nodelogin'
        });

        if (username && password) {
            connectionLogin.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
                if (results.length > 0) {
                    user = username;
                    request.session.loggedin = true;
                    request.session.username = username;
                    userLocal.name = username;
                    // TODO: add role to mysql database, query database for role
                    userLocal.role = "Test";
                    response.render('pages/index');
                } else {
                    response.send('Incorrect Username and/or Password!');
                }
                response.end();
            });
        } else {
            response.render('pages/simple/loginError');
        }
    });

    app.get('/home', function (request, response) {
        if (request.session.loggedin) {
            response.setHeader('Content-Type', 'text/html');
            response.render('pages/index', {
                user: userLocal
            });
        } else {
            response.render('pages/simple/loginError');
        }
    });

    // Display simple About Page
    app.get('/about', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/about', {
                user: userLocal
            });
        } else {
            response.render('pages/simple/loginError');
        }
    });

    // Display visualization of data
    // TODO: better name for example
    app.get('/visual', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/graph', {
                user: userLocal
            });
        } else {
            response.render('pages/simple/loginError');
        }
    });

    // Display menu for entering data
    app.get('/submit', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/submit', {
                user: userLocal
            });
        } else {
            response.render('pages/simple/loginError');
        }
    });

    // Display menu for creating new key figures
    app.get('/create', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/create', {
                user: userLocal
            });
        } else {
            response.render('pages/simple/loginError');
        }
    });

    // Display basic managing information for a superuser or admin
    // TODO: check for admin
    app.get('/stats', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/stats', {
                user: userLocal
            });
        } else {
            response.render('pages/simple/loginError');
        }
    });

    // Logout user and delete the session object
    app.get('/logout', function (request, response, next) {
        if (request.session) {
            request.session.destroy(function (err) {
                if (err) {
                    return next(err);
                } else {
                    return response.redirect('/');
                }
            });
        }
    });

    // Return error message if requested page doesn't exist
    app.get('*', function (request, response) {
        response.render('pages/simple/error');
    });
}