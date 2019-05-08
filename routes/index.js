module.exports = function (app) { // Render Homepage and display selection menus and header
    const mysql = require('mysql');

    // Render login page when user first accesses the application
    app.get('/', function (request, response) {
        response.render('pages/login');
    });

    /** Queries database with login data,
     * returns homepage if login data is correct, returns error message otherwise
     */
    app.post('/auth', function (request, response) {
        const username = request.body.username;
        const password = request.body.password;

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
                    request.session.loggedin = true;
                    request.session.username = username;
                    // TODO: add role to mysql database, query database for role
                    response.render('pages/index', {
                        user: request.session.username
                    });
                    console.log("User '" + request.session.username + "' logged in .");
                } else {
                    console.log("Failed login by '" + request.session.username + "' .");
                    response.render('pages/errors/loginFailed');
                }
                response.end();
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Render index selection page
    app.get('/home', function (request, response) {
        if (request.session.loggedin) {
            response.setHeader('Content-Type', 'text/html');
            response.render('pages/index', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Display simple About Page
    app.get('/about', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/about', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Display visualization of data
    app.get('/visual', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/graph', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Display menu for entering data
    app.get('/submit', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/submit', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Display menu for creating new key figures
    app.get('/create', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/create', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Display basic managing information for a superuser or admin
    // TODO: check for admin
    app.get('/stats', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/stats', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Logout user and delete the session object
    app.get('/logout', function (request, response, next) {
        if (request.session) {
            console.log("User '" + request.session.username + "' logged out .");
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
        response.render('pages/errors/error404');
    });
}