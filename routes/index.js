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
     * 
     * POST REQUESTS FOLLOW HERE
     * 
     */

    // Queries database with login data, returns homepage if login data is correct, returns error message otherwise
    app.post('/auth', function (request, response) {
        const username = request.body.username;
        const password = request.body.password;

        if (username && password) {
            // Query database for username
            console.log(connectionLogin.escape(username));
            connectionLogin.query('SELECT * FROM accounts WHERE username = ' + connectionLogin.escape(username), function (error, results) {
                if (error) console.log(error);
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
        // TODO: mandates
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

            // Query database if user has also entered a year 
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
            measureDataRequest(query, function (error) {
                if (error) {
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

    // TODO: yearly and quarterly measures
    // Handles submitted data when user created a new measure, writes info into local files and creates table
    app.post('/createMeasure', function (request, response) {
        // Temporary arrays which later get added to measureList and measureDescriptions
        loadTables('tables', function (measureList) {
            loadTables('desc', function (measureDescriptions) {
                // Saves current table and descriptions so they can be pushed into main arrays
                const desc = [];
                let table = [];

                // Just used to make code more easily readable
                let measureExists = false;
                let yearExists = false;
                let addYear = false;

                // Check if table already exists, just add year if it doesn't exist, use same descriptions if it exists
                for (i = 0; i < measureList.length; i++) {
                    if (measureList[i][0] == request.body.name) {
                        // Get already existing years in measure
                        const years = measureList[i][1].trim().split(':');
                        measureExists = true;
                        for (j = 0; j < years.length; j++) {
                            console.log(years[j]);
                            // Show error if year already exists, which means the measure already exists in the system
                            if (years[j] == request.body.year) {
                                yearExists = true;
                                console.log('Found it');
                                response.render('pages/createMeasure', {
                                    text: "Fehler! Kennzahl existiert bereits!",
                                    user: request.session.username,
                                });
                            }
                        }
                        // Add year if it doesn't exist
                        if (!yearExists && measureExists) {
                            addYear = true;
                            console.log('Measure exists, adding year to list');
                            measureList[i][1] += ':' + request.body.year;
                        }
                    }
                }

                desc.push(request.body.name);
                desc.push(request.body.mainDesc);
                table.push(request.body.name);
                table.push(request.body.year);

                let tableName = request.body.id.replace('.', '$') + '_' + request.body.name.replaceAll(' ', '_');

                // Build sql string for table creation, TODO: sql injection for every element in sql
                let sql = 'create table ' + tableName + '_' + request.body.year + ' (Monat INTEGER, ';

                // Add attribute names and descriptions, should always be same number of items
                for (let key in request.body) {
                    if (key.includes('var')) {
                        table.push(request.body[key]);
                        sql += request.body[key].replaceAll(' ', '_') + ' FLOAT,'
                    } else if (key.includes('desc')) {
                        desc.push(request.body[key]);
                    }
                }

                sql += ' constraint pk_1 primary key(Monat));';

                // Add semicolon, later needed for identification
                tableName += ';';
                table.push(tableName);
                desc[desc.length - 1] = desc[desc.length - 1] + ';';

                // Push table and description data into loaded table
                if (!addYear) {
                    measureList.push(table);
                    measureDescriptions.push(desc);
                }

                // Insert into database
                measureDataRequest(sql, function (error) {
                    if (error) {
                        //console.log(error);
                        response.render('pages/createMeasure', {
                            text: "Fehler bei der Erstellung der Kennzahl!",
                            user: request.session.username,
                        });
                    } else {
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

                        // Write new arrays to txt file
                        arrayToTxt('tables', measureList);
                        arrayToTxt('desc', measureDescriptions);

                        response.render('pages/createMeasure', {
                            text: "Kennzahl erfolgreich erstellt!",
                            user: request.session.username,
                        });
                    }
                });
            });
        });
    });

    // Handles deletion of a measure, TODO:
    app.post('/deleteMeasure', function (request, response) {
        // Get select item from user page
        loadTables('tables', function (measureList) {
            for (i = 0; i < measureList.length; i++) {
                if (measureList[i][0] === request.body.measureSelect) {
                    // Delete this entry, sort again and write to disk
                    // Delete from database
                    console.log(i);
                }
            }
        });

        // Render page again with information text
        loadTables('tables', function (measureList) {
            response.render('pages/admin/showMeasures', {
                user: request.session.username,
                measures: measureList
            });
        });
    });

    /**
     * 
     * GET REQUESTS FOLLOW HERE
     * 
     */

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
                        user: request.session.username,
                        text: ''
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

    // Load measures and send them to the user, delete is handled in post
    app.get('/showMeasures', function (request, response) {
        loadTables('tables', function (measureList) {
            if (request.session.loggedin) {
                getCurrentLoginFromDB(request, function (result) {
                    role = (result[0].role);
                    if (role === 'admin') {
                        response.render('pages/admin/showMeasures', {
                            user: request.session.username,
                            measures: measureList
                        });
                    } else {
                        response.render('pages/error/adminError');
                    }
                });
            }
        });
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


    // Replaces all occurrences in a string, no built in function
    String.prototype.replaceAll = function (search, replacement) {
        var target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };

    // Converts existing array to file and writes it into tables.txt, user for saving currently used tables in the system
    const arrayToTxt = function (name, array) {
        // Open file stream
        var file = fs.createWriteStream(name + '.txt');
        file.on('error', function (err) {
            console.log(err);
        });
        // Append each array element to file
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
        // Read file from page into text string
        text = fs.readFileSync('./' + name + '.txt').toString('utf-8');
        // Split at line breaks and put it into array
        if (text != '') {
            const textByLine = text.split("\n")
            for (i = 0; i < textByLine.length; i++) {
                array.push(textByLine[i].split(','));
            }
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

    // Code for querying database
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
        const query = 'SELECT * FROM ' + tableName + ';';

        connectionData.query(query, function (err, res) {
            if (err) return callback(null, err);
            callback(res, null);
        });
    }

    // Default data request, full query has to be inserted here
    const measureDataRequest = function (query, callback) {
        connectionData.query(query, function (err) {
            if (err) return callback(err);
            callback();
        });
    }

    // Deletes specified table from the database
    const deleteMeasureFromDB = function (tableName, callback) {
        connectionData.query('DROP TABLE ' + connectionData.escape(tableName), function (err) {
            if (err) return callback(err);
            callback();
        });
    }

    // Insert user with provided data into the user database
    const insertUserIntoDB = function (request, callback) {
        // Check password strength
        if (pwCheck(request.body.password)) {
            // Hash insert password
            bcrypt.hash(request.body.password, saltRounds, function (err, hash) {
                if (!err) {
                    // Insert the user into database, question marks provide prevention against sql attack
                    const sql = 'INSERT INTO `accounts` (`username`, `password`, `email`,`role`) VALUES (?, ?, ?, ?)';
                    connectionLogin.query(sql, [request.body.username, hash, request.body.mail, request.body.role], function (err) {
                        if (err) return callback(err);
                        callback();
                    });
                } else {
                    console.log(err);
                }
            });
            // Return error if test failed
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