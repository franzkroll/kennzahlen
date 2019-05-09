module.exports = function (app) { // Render Homepage and display selection menus and header
    //TODO: globally check for sql injection

    const mysql = require('mysql');

    const connectionLogin = mysql.createConnection({
        host: 'localhost',
        user: 'dbaccess',
        password: 'Pdgy#MW$Jud6F$_B',
        database: 'nodelogin'
    });

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

        if (username && password) {
            // TODO: hash password before query
            connectionLogin.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
                if (results.length > 0) {
                    request.session.loggedin = true;
                    request.session.username = username;
                    response.render('pages/index', {
                        user: request.session.username
                    });
                    console.log("User '" + request.session.username + "' logged in.");
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
    app.get('/createTheme', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/createTheme', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Display menu for adding a measure to an existing theme
    app.get('/addMeasure', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/addMeasure', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Displays admin index page
    app.get('/admin', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getInformationFromLoginDB(request, function (result, err) {
                role = (result[0].role);
                if (role === 'admin') {
                    response.render('pages/admin/admin', {
                        user: request.session.username
                    });
                } else {
                    response.render('pages/errors/adminError');
                    console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
                }
            });
        } else {
            response.render('pages/errors/loginError');
        }
    })

    // Display basic managing information for a superuser or admin
    app.get('/stats', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/stats', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Display user creation page, TODO: only for admins
    app.get('/createUser', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getInformationFromLoginDB(request, function (result, err) {
                role = (result[0].role);
                console.log(role);
                if (role === 'admin') {
                    response.render('pages/admin/createUser', {
                        user: request.session.username
                    });
                } else {
                    response.render('pages/errors/adminError');
                    console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
                }
            });
        } else {
            response.render('pages/errors/loginError');
        }
    })


    // Display user creation page, TODO: only for admins
    app.get('/showUsers', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getInformationFromLoginDB(request, function (result, err) {
                role = (result[0].role);
                console.log(role);
                if (role === 'admin') {
                    response.render('pages/admin/showUsers', {
                        user: request.session.username
                    });
                } else {
                    response.render('pages/errors/adminError');
                    console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
                }
            });
        } else {
            response.render('pages/errors/loginError');
        }
    })

    // Handle creation of new users
    app.post('/createUser', function (request, response) {
        if (request) {
            console.log('New user request: \n' + request.body);
            const sql = 'INSERT INTO `accounts` (`username`, `password`, `email`,`role`) VALUES (?, ?, ?, ?)';
            // TODO: hash password here
            connectionLogin.query(sql, [request.body.username, request.body.password, request.body.mail, request.body.role], function (err, result) {
                if (err) throw err;
                console.log("User successfully created and inserted into database.");
            });
        }
        response.render('pages/admin/admin', {
            user: request.session.username
        });
    })

    // Logout user and delete the session object
    app.get('/logout', function (request, response, next) {
        if (request.session) {
            console.log("User '" + request.session.username + "' logged out.");
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

    /** Code for querying database, TODO: maybe better? */
    var getInformationFromLoginDB = function (request, callback) {
        var result = [];

        console.log(request.session.username);
        connectionLogin.query('SELECT * FROM accounts WHERE username = ?;', [request.session.username], function (err, res, fields) {
            if (err) return callback(err);
            if (res.length) {
                for (var i = 0; i < res.length; i++) {
                    result.push(res[i]);
                }
            }
            callback(result);
        });
    }
}