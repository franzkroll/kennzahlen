module.exports = function (app) {
    //TODO: globally check for sql injection

    const mysql = require('mysql');

    // TODO: move to server?
    const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn()
    const statusMonitor = require('express-status-monitor')();
    const passwordValidator = require('password-validator');

    app.use(statusMonitor);

    app.get('/status', ensureLoggedIn, statusMonitor.pageRoute)

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

    // Handle creation of new users, TODO: move callback down
    app.post('/createUser', function (request, response) {
        let responseText;
        insertUserIntoDB(request, function (err) {
            if (err === "pw") {
                console.log(err);
                responseText = "Fehler bei der Erstellung des Benutzers! Passwort zu unsicher.";
            } else if (err) {
                console.log(err);
                responseText = "Fehler bei der Erstellung des Benutzers! Benutzer bereits vorhanden.";
            } else {
                responseText = "Benutzer erfolgreich erstellt!";
            };
            response.render('pages/admin/admin', {
                user: request.session.username,
                text: responseText
            });
        });
    });

    // Post action for deleting a user, if user exists he is deleted from the database
    app.post('/deleteUser', function (request, response) {
        const id = request.body.id;
        deleteUserFromDB(id, function (err) {
            console.log(err);
            response.render('pages/admin/admin', {
                user: request.session.username,
                text: "Benutzer erfolgreich gelöscht."
            });
        });
    });

    // 
    app.post('/submit', function (request, response) {
        //TODO: get data and store in existing table in db, give user response that values were inserted
    });

    app.post('/createTheme', function (request, response) {
        //TODO: get data and create new table in db, give user response that theme was created
    });

    // Render index selection page
    app.get('/test', function (request, response) {
        if (request.session.loggedin) {
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const myPlaintextPassword = 'admin';

            bcrypt.hash(myPlaintextPassword, saltRounds, function (err, hash) {
                bcrypt.compare(myPlaintextPassword, hash, function (err, res) {
                    console.log(res);
                    console.log(hash);
                });
            });
        }
        response.end();
    });

    app.get('/help', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getCurrentLoginFromDB(request, function (result, err) {
                role = (result[0].role);
                if (role === 'admin') {
                    response.render('pages/admin/adminHelp', {
                        user: request.session.username
                    });
                } else {
                    response.render('pages/help', {
                        user: request.session.username
                    });
                }
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
            response.render('pages/visual', {
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
    app.get('/createMeasure', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getCurrentLoginFromDB(request, function (result, err) {
                role = (result[0].role);
                if (!(role === 'submit')) {
                    response.render('pages/createMeasure', {
                        user: request.session.username
                    });
                } else {
                    response.render('pages/errors/adminError')
                }
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Display menu for adding a measure to an existing theme
    app.get('/addAttribute', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getCurrentLoginFromDB(request, function (result, err) {
                role = (result[0].role);
                if (!(role === 'submit')) {
                    response.render('pages/addAttribute', {
                        user: request.session.username
                    });
                } else {
                    response.render('pages/errors/adminError')
                }
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Displays admin index page
    app.get('/admin', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getCurrentLoginFromDB(request, function (result, err) {
                role = (result[0].role);
                if (role === 'admin') {
                    response.render('pages/admin/admin', {
                        user: request.session.username,
                        text: ""
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
            let role;
            getCurrentLoginFromDB(request, function (result, err) {
                role = (result[0].role);
                if (role === 'admin') {
                    response.render('pages/stats', {
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
    });

    // Display user creation page, TODO: only for admins
    app.get('/createUser', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getCurrentLoginFromDB(request, function (result, err) {
                role = (result[0].role);
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
    app.get('/showUser', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getCurrentLoginFromDB(request, function (result, err) {
                role = (result[0].role);
                if (role === 'admin') {
                    getAllUsersFromDB(function (result, err) {
                        role = (result[0].role);
                        let sendString = "";

                        // Convert json object to string for sending via ejs
                        for (i = 0; i < result.length; i++) {
                            sendString += result[i].id + ":" + result[i].username + ":" + result[i].role + ":" + result[i].email + ":";
                        }

                        response.render('pages/admin/showUser', {
                            user: request.session.username,
                            result: sendString
                        });
                    });
                } else {
                    response.render('pages/errors/adminError');
                    console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
                }
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

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
    const getCurrentLoginFromDB = function (request, callback) {
        let result = [];

        connectionLogin.query('SELECT * FROM accounts WHERE username = ?;', [request.session.username], function (err, res) {
            if (err) return callback(err);
            if (res.length) {
                for (let i = 0; i < res.length; i++) {
                    result.push(res[i]);
                }
            }
            callback(result);
        });
    }

    /** Code for querying database, TODO: maybe better? */
    const getAllUsersFromDB = function (callback) {
        let result = [];

        connectionLogin.query('SELECT * FROM accounts', function (err, res) {
            if (err) return callback(err);
            if (res.length) {
                for (var i = 0; i < res.length; i++) {
                    result.push(res[i]);
                }
            }
            callback(result);
        });
    }


    // Deletes user with passed i from the accounts database
    const insertUserIntoDB = function (request, callback) {
        if (pwCheck(request.body.password)) {
            console.log("password check passed");
            const sql = 'INSERT INTO `accounts` (`username`, `password`, `email`,`role`) VALUES (?, ?, ?, ?)';
            // TODO: hash password here, check for good password
            connectionLogin.query(sql, [request.body.username, request.body.password, request.body.mail, request.body.role], function (err) {
                if (err) return callback(err);
                callback();
            });
        } else {
            err = "pw";
            console.log("password check failed");
            return callback(err);
        }
    }

    // Deletes user with passed i from the accounts database
    const deleteUserFromDB = function (id, callback) {
        connectionLogin.query('DELETE FROM accounts where id=?', [id], function (err) {
            if (err) return callback(err);
            callback();
        });
    }

    // Check if entered password is a safe password, used when a new user is created
    function pwCheck(password) {
        const schema = new passwordValidator();

        schema
            .is().min(8) // Minimum length 8
            .is().max(100) // Maximum length 100
            .has().uppercase() // Must have uppercase letters
            .has().lowercase() // Must have lowercase letters
            .has().digits() // Must have digits
            .has().not().spaces() // Should not have spaces
            .is().not().oneOf(['Passw0rt', 'Passwort123', 'passwort', 'password']); // Blacklist these values

        const checkedPw = schema.validate(password, {
            list: true
        });

        if (checkedPw.length === 0) {
            console.log("Paswort safe");
            return true;
        } else {
            console.log("Password unsafe: " + checkedPw);
            return false;
        }
    }
}