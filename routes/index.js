module.exports = function (app) {
    // Imports ...
    const mysql = require('mysql');
    const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn()
    const statusMonitor = require('express-status-monitor')();
    const passwordValidator = require('password-validator');
    const fs = require('fs');
    const bcrypt = require('bcrypt');
    const saltRounds = 10;

    app.use(statusMonitor);

    app.get('/status', ensureLoggedIn, statusMonitor.pageRoute)

    // Create SQL-Connection for accessing user data
    const connectionLogin = mysql.createConnection({
        host: 'localhost',
        user: 'dbaccess',
        password: 'Pdgy#MW$Jud6F$_B',
        database: 'nodelogin'
    });

    // Create SQL-Connection for accessing measure data
    const connectionData = mysql.createConnection({
        host: 'localhost',
        user: 'dbaccessData',
        password: 'N&HQkzW]WF2bBA*k',
        database: 'measures'
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

        if (username && password) {
            // Query database for username
            connectionLogin.query('SELECT * FROM accounts WHERE username = ?', [username], function (error, results, fields) {
                if (results.length > 0) {
                    // Hash and compare with stored hash
                    bcrypt.compare(password, results[0].password, function (err, res) {
                        // Log in user if correct
                        if (res === true) {
                            request.session.loggedin = true;
                            request.session.username = username;
                            response.render('pages/index', {
                                user: request.session.username
                            });
                            console.log("User '" + request.session.username + "' logged in.");
                        } else {
                            response.render('pages/errors/loginFailed');
                        }
                    });
                } else {
                    response.render('pages/errors/loginFailed');
                }
            });
        } else {
            response.render('pages/errors/loginFailed');
        }
    });

    // Post action for creating a user, renders admin index after creating and storing user in the database, displays error if that failed
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

    // Loads request data from database and renders it with a new visual page 
    app.post('/visual', function (request, response) {
        loadTables(function (measureList) {
            let tableName;

            for (i = 0; i < measureList.length; i++) {
                if (measureList[i][0] === request.body.measure) {
                    tableName = (measureList[i][measureList[i].length - 1]).slice(0, (measureList[i][measureList[i].length - 1]).length - 1);
                }
            }
            tableName += "_" + request.body.year.trim();

            console.log(tableName);

            getMeasureFromDB(tableName, function (result, err) {
                if (err) {
                    console.log(err);
                    response.render('pages/visual', {
                        user: request.session.username,
                        measureData: "",
                        loadedTable: "",
                        text: "Datensatz nicht vorhanden!",
                        measureListData: measureList
                    });
                } else {
                    const measureData = JSON.stringify(result);

                    response.render('pages/visual', {
                        user: request.session.username,
                        measureData: JSON.stringify(measureData),
                        loadedTable: tableName,
                        text: "Daten erfolgreich geladen!",
                        measureListData: measureList
                    });
                }
            });
        });
    });

    app.post('/submit', function (request, response) {
        console.log(request.body.measure);
        console.log(request.body.month);

        for (var key in request.body) {
            console.log(key);
        }

        loadTables(function (measureList) {
            response.render('pages/submit', {
                user: request.session.username,
                measureListData: measureList
            });
        });

        // TODO: insert data into database, sql injection, check if table exists        
    });

    app.post('/createTheme', function (request, response) {
        // TODO: load tableData with txtToArray, let user enter values
        // create new entry in txt file
        // add new table to database
    });

    // Converts existing array to file and writes it into tables.txt, user for saving currently used tables in the system
    function arrayToTxt(array) {
        var file = fs.createWriteStream('tables.txt');
        file.on('error', function (err) {
            /* error handling */
        });
        array.forEach(function (v) {
            file.write(v.join(', ') + '\n');
        });
        file.end();

        console.log('Wrote to file');
    }

    // Used for testing, writes table data into table.txt, needs to be put into createMeasure
    app.get('/test', function (request, response) {
        //TODO: move to creation
        let measureList = [];
        let measure1 = ['Anzahl der Anrufe', '2018', 'Gesamtanzahl aller Anrufe', 'Gesamtanzahl aller Notrufe', 'Gesamtanzahl aller Sprechwünsche', '1$2_Anzahl_der_Anrufe;'];
        let measure2 = ['Einsatzdauer des V-NEF ab Alarmierung', '2018', 'Durchschnittliche Einsatzdauer', 'Minimale Einsatzdauer', 'Maximale Einsatzdauer', 'Einsatzdauer_des_V-NEF_ab_Alarmierung;']
        let measure3 = ['Annahmezeit', '2017:2018', 'durchschnittliche Notrufannahmezeit', 'durchschnittliche Wartezeit sonstiger Anrufe', 'Zielerreichungsgrad 95% der Notrufe in <= 10 Sekunden anzunehmen', 'Zielerreichungsgrad 85% der Notrufe in <= 10 Sekunden anzunehmen', 'Zielerreichungsgrad 90% der Notrufe in <= 10 Sekunden anzunehmen', 'durchschnittliche Annahmezeit der Sprechwünsche (Status 5)', '1.1;']

        measureList.push(measure1);
        measureList.push(measure2);
        measureList.push(measure3);


        arrayToTxt(measureList);

        response.end();
    });

    // Loads simple help page
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
            loadTables(function (measureList) {
                response.render('pages/visual', {
                    user: request.session.username,
                    measureData: "",
                    loadedTable: "",
                    text: "",
                    measureListData: measureList
                });
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Display menu for entering data
    app.get('/submit', function (request, response) {
        if (request.session.loggedin) {
            loadTables(function (measureList) {
                response.render('pages/submit', {
                    user: request.session.username,
                    measureListData: measureList
                });
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

        connectionLogin.query('SELECT * FROM accounts WHERE username =' + connectionLogin.escape(request.session.username), function (err, res) {
            if (err) return callback(err);
            if (res.length) {
                for (let i = 0; i < res.length; i++) {
                    result.push(res[i]);
                }
            }
            callback(result);
        });
    }

    const loadTables = function (callback) {
        let array = [];
        const text = fs.readFileSync("./tables.txt").toString('utf-8');
        const textByLine = text.split("\n")
        for (i = 0; i < textByLine.length; i++) {
            array.push(textByLine[i].split(','));
        }
        callback(array);
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

    const getMeasureFromDB = function (tableName, callback) {
        let result = [];

        const query = 'SELECT * FROM ' + tableName;

        connectionData.query(query, function (res, error) {
            if (error) return callback(error, null);
            if (res.length) {
                for (var i = 0; i < res.length; i++) {
                    result.push(res[i]);
                }
            }
            callback(null, res);
        });
    }


    const insertIntoTable = function (tableData, callback) {
        // TODO:
        const query = 'INSERT INTo .....';

        // https://stackoverflow.com/questions/812437/mysql-ignore-insert-error-duplicate-entry

        connectionData.query(query, function (error) {
            if (error) return callback(error);
        });
    }

    // Deletes user with passed i from the accounts database
    const insertUserIntoDB = function (request, callback) {
        if (pwCheck(request.body.password)) {
            // TODO: hash password here, check for good password
            bcrypt.hash(request.body.password, saltRounds, function (err, hash) {
                if (!err) {
                    console.log(hash);

                    // TODO: check for sql injections, but unlikely here, admin section
                    const sql = 'INSERT INTO `accounts` (`username`, `password`, `email`,`role`) VALUES (?, ?, ?, ?)';
                    connectionLogin.query(sql, [request.body.username, hash, request.body.mail, request.body.role], function (err) {
                        if (err) return callback(err);
                        callback();
                    });
                } else {
                    console.log(err);
                }
            });


        } else {
            err = "pw";
            console.log("password check failed");
            return callback(err);
        }
    }

    // Deletes user with passed i from the accounts database
    const deleteUserFromDB = function (id, callback) {
        connectionLogin.query('DELETE FROM accounts where id=' + connectionLogin.escape(id), function (err) {
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
            console.log("Paswort check passed");
            return true;
        } else {
            console.log("Password check not passed: " + checkedPw);
            return false;
        }
    }
}