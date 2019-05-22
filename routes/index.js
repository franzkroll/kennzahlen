module.exports = function (app) {
    // Imports ...
    const mysql = require('mysql');
    const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn()
    const statusMonitor = require('express-status-monitor')();
    const passwordValidator = require('password-validator');
    const fs = require('fs');
    const bcrypt = require('bcrypt');
    // Salt rounds for password encryption
    const saltRounds = 10;

    // Shows stats page
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

    /** 
     * Queries database with login data,
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
            // Show corresponding error messages if password is unsafe or user already exists, user names have to be unique
            if (err === 'pw') {
                console.log(err);
                responseText = 'Fehler bei der Erstellung des Benutzers! Passwort zu unsicher.';
            } else if (err) {
                console.log(err);
                responseText = 'Fehler bei der Erstellung des Benutzers! Benutzer bereits vorhanden.';
            } else {
                responseText = 'Benutzer erfolgreich erstellt!';
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
        loadTables('tables', function (measureList) {
            let tableName;

            // Check if inserted measure data really exists
            for (i = 0; i < measureList.length; i++) {
                if (measureList[i][0] === request.body.measure) {
                    tableName = (measureList[i][measureList[i].length - 1]).slice(0, (measureList[i][measureList[i].length - 1]).length - 1);
                }
            }

            // If user has also entered a year start query
            if (request.body.year) {
                tableName += "_" + request.body.year.trim();

                getMeasureFromDB(tableName, function (result, error) {
                    if (error) {
                        console.log(error);
                        // Show error page if data couldn't be found
                        response.render('pages/visual', {
                            user: request.session.username,
                            measureData: "",
                            loadedTable: "",
                            text: "Datensatz nicht vorhanden!",
                            measureListData: measureList
                        });
                    } else {
                        // Loaded measure data
                        const measureData = JSON.stringify(result);

                        // Render page with newly acquired data
                        response.render('pages/visual', {
                            user: request.session.username,
                            measureData: JSON.stringify(measureData),
                            loadedTable: tableName,
                            text: "Daten erfolgreich geladen!",
                            measureListData: measureList
                        });
                    }
                });
            } else {
                // Show error page if data couldn't be found
                response.render('pages/visual', {
                    user: request.session.username,
                    measureData: "",
                    loadedTable: "",
                    text: "Datensatz nicht vorhanden!",
                    measureListData: measureList
                });
            }
        });
    });

    // Get submitted data from user and put it into the database for the corresponding measure
    app.post('/submit', function (request, response) {
        // Array for storing table data
        tableData = []

        // Get measure and date
        tableData.push(request.body.measure);
        tableData.push(request.body.date);

        // Get attributes, they are already in the right order
        for (let key in request.body) {
            if (key.includes('var')) {
                tableData.push(request.body[key]);
            }
        }

        // Load table data from disk
        loadTables('tables', function (measureList) {
            // Table to write into
            let tableName;

            // Used to convert month to month number
            const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

            // Escaping year for sql injection and slicing out the year
            const date = connectionData.escape(tableData[1]).slice(1, tableData[1].length + 1);
            const year = date.slice(date.length - 4, date.length);

            // Check if entered table really exists, get concrete table name in database
            for (i = 0; i < measureList.length; i++) {
                if (measureList[i][0] === tableData[0]) {
                    tableName = (measureList[i][measureList[i].length - 1]).slice(0, (measureList[i][measureList[i].length - 1]).length - 1);
                }
            }

            // Add year to tablename
            tableName += "_" + year;

            // Build sql string
            let query = 'REPLACE INTO ' + tableName + ' () values (';

            // First case handles the year entry, second case entries with month
            if (date.length === 5) {
                query += year + ',';
            } else {
                query += parseInt((months.indexOf(date.slice(0, date.length - 5)) + 1 + year), 10) + ',';
            }

            // Put data into sql string, maybe add directly without values vector?, sql injection
            for (i = 2; i < tableData.length; i++) {
                query += connectionData.escape(tableData[i]);
                query += ',';
            }
            // Remove last comma
            query = query.slice(0, query.length - 1);
            query += ');'

            // And insert them into the database
            insertIntoTable(query, function (error) {
                if (error) {
                    console.log(error);
                    loadTables('tables', function (measureList) {
                        response.render('pages/submit', {
                            user: request.session.username,
                            text: "Fehler beim Eintragen der Daten!",
                            measureListData: measureList
                        });
                    });
                } else {
                    // Reload page after values were inserted
                    loadTables('tables', function (measureList) {
                        response.render('pages/submit', {
                            text: "Daten erfolgreich eingetragen!",
                            user: request.session.username,
                            measureListData: measureList
                        });
                    });
                }
            });
        });
    });

    app.post('/createTheme', function (request, response) {
        // TODO: load tableData with txtToArray, let user enter values
        // create new entry in txt file
        // add new table to database
    });

    // Used for testing, writes table data into table.txt, needs to be put into createMeasure
    app.get('/test', function (request, response) {
        // TODO: move to creation, just dummy data
        // needs attribute if yearly, monthly or quarterly, display options need to be changed accordingly
        // yearly measures should start with something else, only save years in database
        let measureList = [];
        let measureDescriptions = [];

        let measure1 = ['Anzahl der Anrufe', '2018', 'Gesamtanzahl aller Anrufe', 'Gesamtanzahl aller Notrufe', 'Gesamtanzahl aller Sprechwünsche', '1$2_Anzahl_der_Anrufe;'];
        let measure2 = ['Einsatzdauer des V-NEF ab Alarmierung', '2018', 'Durchschnittliche Einsatzdauer', 'Minimale Einsatzdauer', 'Maximale Einsatzdauer',
            'Einsatzdauer_des_V-NEF_ab_Alarmierung;'
        ];
        let measure5 = ['Zeitspanne von Anforderung des V-NEF bis zur Alarmierung', '2018', 'Durchschnittliche Zeitspanne', 'Minimale Zeitspanne', 'Maximale Einsatzdauer',
            'Zeitspanne_von_Anforderung_des_V-NEF_bis_zur_Alarmierung;'
        ];
        let measure3 = ['Annahmezeit', '2018', 'durchschnittliche Notrufannahmezeit', 'durchschnittliche Wartezeit sonstiger Anrufe', 'durchschnittliche Rufannahmezeit gesamt',
            'Zielerreichungsgrad 95% der Notrufe in ≤ 10 Sekunden anzunehmen', 'Zielerreichungsgrad 85% der Notrufe in ≤ 10 Sekunden anzunehmen',
            'Zielerreichungsgrad 90% der Notrufe in ≤ 10 Sekunden anzunehmen', 'durchschnittliche Annahmezeit der Sprechwünsche (Status 5)', '1$1_Annahmezeit;'
        ];
        let measure4 = ['Anzahl der Alarmierungen', '2018', 'Gesamtanzahl aller Alarmierungen', 'Feuerwehr', 'Katastrophenschutz', 'RTW', 'KTW', 'NEF', 'NAW', 'RTH', 'ITH', 'Sonstige', '2$5_Anzahl_der_Alarmierungen;'];

        measureList.push(measure1);
        measureList.push(measure2);
        measureList.push(measure3);
        measureList.push(measure4);
        measureList.push(measure5);

        // Descriptions here, also need to be created when creating new measures, just dummy data
        let description1 = ['Anzahl der Anrufe', 'Beschreibung Kennzahl', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft;']
        let description2 = ['Einsatzdauer des V-NEF ab Alarmierung', 'Beschreibung Kennzahl', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft;']
        let description3 = ['Zeitspanne von Anforderung des V-NEF bis zur Alarmierung', 'Beschreibung Kennzahl', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft;']
        let description4 = ['Annahmezeit', 'Beschreibung Kennzahl', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft;']
        let description5 = ['Anzahl der Alarmierungen', 'Beschreibung Kennzahl', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft', 'Beschreibung Eigenschaft;']

        measureDescriptions.push(description1);
        measureDescriptions.push(description2);
        measureDescriptions.push(description3);
        measureDescriptions.push(description4);
        measureDescriptions.push(description5);

        // Sort list of measures alphabetically by measure name
        measureList = measureList.sort(function (a, b) {
            if (a[0] < b[0]) {
                return -1;
            }
            if (a[0] > b[0]) {
                return 1;
            }
            return 0;
        });

        // Sort measure descriptions, so they are ordered the same
        measureDescriptions = measureDescriptions.sort(function (a, b) {
            if (a[0] < b[0]) {
                return -1;
            }
            if (a[0] > b[0]) {
                return 1;
            }
            return 0;
        });

        // Write table data
        arrayToTxt('tables', measureList, function (error) {
            if (error) console.log(error);
        });

        // Write description data of measures
        arrayToTxt('desc', measureDescriptions, function (error) {
            if (error) console.log(error);
        })

        response.render('pages/index', {
            user: request.session.username
        });
    });

    // Displays information about measures in the system and their attributes
    app.get('/measureHelp', function (request, response) {
        // Load measures and their descriptions
        loadTables('tables', function (measureList) {
            loadTables('desc', function (measureDescriptions) {
                response.render('pages/measureHelp', {
                    user: request.session.username,
                    measureListData: measureList,
                    measureDescriptions: measureDescriptions
                });
            });
        });
    });

    // Loads simple help page
    app.get('/help', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getCurrentLoginFromDB(request, function (result) {
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
            loadTables('tables', function (measureList) {
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
            loadTables('tables', function (measureList) {
                response.render('pages/submit', {
                    user: request.session.username,
                    text: "",
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
            getCurrentLoginFromDB(request, function (result) {
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
            getCurrentLoginFromDB(request, function (result) {
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
            getCurrentLoginFromDB(request, function (result) {
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
            getCurrentLoginFromDB(request, function (result) {
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

    // Display user creation page
    app.get('/createUser', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getCurrentLoginFromDB(request, function (result) {
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


    // Display user creation page
    app.get('/showUser', function (request, response) {
        if (request.session.loggedin) {
            let role;
            getCurrentLoginFromDB(request, function (result) {
                role = (result[0].role);
                if (role === 'admin') {
                    // Load user from database
                    getAllUsersFromDB(function (result, error) {
                        if (error) console.log(error);
                        role = (result[0].role);
                        let sendString = "";

                        // Convert json object to string for sending via ejs
                        for (i = 0; i < result.length; i++) {
                            sendString += result[i].id + ":" + result[i].username + ":" + result[i].role + ":" + result[i].email + ":";
                        }

                        // Render page with user data
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

    // Converts existing array to file and writes it into tables.txt, user for saving currently used tables in the system
    const arrayToTxt = function (name, array) {
        var file = fs.createWriteStream(name + '.txt');
        file.on('error', function (err) {
            console.log(err);
        });
        array.forEach(function (v) {
            file.write(v.join(', ') + '\n');
        });
        file.end();
        console.log('Wrote to file');
    }

    // Loads tables from disk txt file and converts them to an array
    const loadTables = function (name, callback) {
        let array = [];
        let text;
        text = fs.readFileSync('./' + name + '.txt').toString('utf-8');
        const textByLine = text.split("\n")
        for (i = 0; i < textByLine.length; i++) {
            array.push(textByLine[i].split(','));
        }
        callback(array);
    }

    // Get Current user from the database, use to check role
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

    // Code for querying database, TODO: maybe better?
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

    // Queries database for a complete measure, no sql injection needed because tableName is taken from predefined list
    const getMeasureFromDB = function (tableName, callback) {
        const query = 'SELECT * FROM ' + tableName;

        connectionData.query(query, function (err, res) {
            if (err) return callback(null, err);
            callback(res, null);
        });
    }

    // Inserts one row into specified table in measures database
    const insertIntoTable = function (query, callback) {
        connectionData.query(query, function (err) {
            if (err) return callback(err);
            callback(err);
        });
    }

    // Deletes user with passed i from the accounts database
    const insertUserIntoDB = function (request, callback) {
        if (pwCheck(request.body.password)) {
            bcrypt.hash(request.body.password, saltRounds, function (err, hash) {
                if (!err) {
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

        // Save attributes that don't pass in list
        const checkedPw = schema.validate(password, {
            list: true
        });

        // If list is empty its a good password
        if (checkedPw.length === 0) {
            console.log("Paswort check passed");
            return true;
        } else {
            console.log("Password check not passed: " + checkedPw);
            return false;
        }
    }
}