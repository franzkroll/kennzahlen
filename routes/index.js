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

    const authHelper = function (request, response) {
        const username = request.body.username;
        const password = request.body.password;

        if (username && password) {
            // Query database for username
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
    }

    const createUserHelper = function (request, response) {
        // TODO: mandates
        insertUserIntoDB(request).then(function () {
            response.render('pages/admin/admin', {
                user: request.session.username,
                text: 'Benutzer erfolgreich erstellt.'
            });
        }).catch(function (error) {
            let responseText;
            // Show corresponding error messages if password is unsafe or user already exists, user names have to be unique
            if (error === 'pw') {
                console.log(error);
                responseText = 'Fehler bei der Erstellung des Benutzers! Passwort zu unsicher.';
            } else if (error) {
                console.log(error);
                responseText = 'Fehler bei der Erstellung des Benutzers! Benutzer bereits vorhanden.';
            }
            response.render('pages/admin/admin', {
                user: request.session.username,
                text: responseText
            });
        });
    }

    const deleteUserHelper = function (request, response) {
        const id = request.body.id;
        deleteUserFromDB(id).then(function () {
            response.render('pages/admin/admin', {
                user: request.session.username,
                text: "Benutzer erfolgreich gelöscht."
            });
        }).catch(function (error) {
            response.render('pages/admin/admin', {
                user: request.session.username,
                text: "Fehler beim Löschen des Benutzers."
            });
        })
    }

    const visualPostHelper = async (request, response) => {
        let measureList, roleList;

        try {
            measureList = await loadTextFile('tables');
            roleList = await loadTextFile('roles');
        } catch (error) {
            console.log(error);
        }

        for (i = 0; i < roleList.length; i++ && !found) {
            // If measure is found, check if saved role equals current role and admin/user
            if (request.body.measure === roleList[i][0]) {
                found = true;
                // Check roles if measure is found in access table
                checkRolePermissions(roleList[i][1], request).then(function (result) {
                    if (result) {
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

                            getMeasureFromDB(tableName).then(function (result) {
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
                            }).catch(function (error) {
                                response.render('pages/visual', {
                                    user: request.session.username,
                                    measureData: "",
                                    loadedTable: "",
                                    text: "Datensatz nicht vorhanden!",
                                    measureListData: measureList
                                });
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
                    } else {
                        response.render('pages/visual', {
                            user: request.session.username,
                            measureData: "",
                            loadedTable: "",
                            text: "Dafür besitzen Se nicht die nötigen Rechte!",
                            measureListData: measureList
                        });
                    }
                }).catch(function (error) {
                    console.log(error);
                })
            }
        }
    }

    const submitDataHelper = async (request, response) => {
        let roleList, measureList, result;

        try {
            measureList = await loadTextFile('tables');
            roleList = await loadTextFile('roles');
        } catch (error) {
            console.log(error);
        }

        // Array for storing table data
        tableData = []

        let found = false;

        // Load user role from database
        for (i = 0; i < roleList.length; i++ && !found) {
            // If measure is found, check if saved role equals current role and admin/user
            try {
                // Can only get it here because we need i
                result = await checkRolePermissions(roleList[i][1], request);
            } catch (error) {
                console.log(error);
            }

            if (request.body.measure === roleList[i][0]) {
                found = true;
                // Check roles if measure is found in access table
                if (result) {
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
                        query += parseInt((months.indexOf(date.slice(0, date.length - 4)) + 1 + year), 10) + ',';
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
                    measureDataRequest(query).then(function () {
                        response.render('pages/submit', {
                            text: "Daten erfolgreich eingetragen!",
                            user: request.session.username,
                            measureListData: measureList
                        });
                    }).catch(function (error) { // Reload page after values were inserted
                        response.render('pages/submit', {
                            user: request.session.username,
                            text: "Fehler beim Eintragen der Daten!",
                            measureListData: measureList
                        });
                    });

                } else {
                    console.log(request.body.username + ' tried accessing measure without correct rights.');
                    loadTextFile('tables', function (measureListNew) {
                        response.render('pages/submit', {
                            text: "Dafür besitzen Sie nicht die nötigen Rechte!",
                            user: request.session.username,
                            measureListData: measureListNew
                        });
                    });
                }
            }
        }

    }

    const createMeasureHelper = async (request, response) => {
        let measureDescriptions, measureList, roleList;

        try {
            measureDescriptions = await loadTextFile('desc');
            measureList = await loadTextFile('tables');
            roleList = await loadTextFile('roles');

        } catch (error) {
            console.log(error);
        }

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

        // Need to add role to list if the measure doesn't exist
        if (!measureExists) {
            roleList.push([request.body.name, request.body.role + ';']);
            console.log("created role");
        }

        desc.push(request.body.name.trim());
        desc.push(request.body.mainDesc);
        table.push(request.body.name.trim());
        table.push(request.body.year);

        // Format name correctly for mysql and add the year
        let tableName = request.body.id.replace('.', '$') + '_' + request.body.name.trim().replaceAll(' ', '_');

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

        // Make month the primary key
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
        measureDataRequest(sql).then(function () {
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

            // Sort role descriptions, so they are ordered the same
            roleList = roleList.sort(function (a, b) {
                if (a[0] < b[0]) {
                    return -1;
                }
                if (a[0] > b[0]) {
                    return 1;
                }
                return 0;
            });

            // Write new arrays to txt file
            arrayToTxt('roles', roleList);
            arrayToTxt('tables', measureList);
            arrayToTxt('desc', measureDescriptions);

            response.render('pages/createMeasure', {
                text: "Kennzahl erfolgreich erstellt!",
                user: request.session.username,
            });
        }).catch(function (error) {
            console.log(error);
            response.render('pages/createMeasure', {
                text: "Fehler bei der Erstellung der Kennzahl!",
                user: request.session.username,
            });
        })
    }

    const deleteHelper = async (request, response) => {
        let measureDescriptions, measureList, roleList;

        try {
            measureDescriptions = await loadTextFile('desc');
            measureList = await loadTextFile('tables');
            roleList = await loadTextFile('roles');
        } catch (error) {
            console.log(error);
        }

        let tableName;
        let found = false;

        for (i = 0; i < measureList.length; i++) {
            if (measureList[i][0] === request.body.measureSelect && !found) {
                found = true;

                // Get the table name from the list and format it correctly
                const foundElement = measureList[i];
                tableName = foundElement[foundElement.length - 1].slice(0, foundElement[foundElement.length - 1].length - 1);

                // Delete i-th entry from both lists, just remove year if there are multiple years in the entry
                const years = measureList[i][1].split(':');

                // If the measure only had the specified year delete it completely
                if ((years.length === 1) && (years[0] === request.body.yearSelect)) {
                    if (i > -1) {
                        roleList.splice(i, 1);
                        measureList.splice(i, 1);
                        measureDescriptions.splice(i, 1);
                    }
                } else {
                    let newYears = '';
                    // Add everything except the deleted year
                    for (j = 0; j < years.length; j++) {
                        if (years[j] != request.body.yearSelect) {
                            newYears += years[j] + ':';
                        }
                    }

                    found = true;

                    // Remove last :
                    measureList[i][1] = newYears.slice(0, newYears.length - 1);
                }

                // Sort list of measures alphabetically by measure name, TODO: move sort to own function
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


                // Sort measure descriptions, so they are ordered the same
                roleList = roleList.sort(function (a, b) {
                    if (a[0] < b[0]) {
                        return -1;
                    }
                    if (a[0] > b[0]) {
                        return 1;
                    }
                    return 0;
                });

                // Write new arrays to txt file
                arrayToTxt('roles', roleList);
                arrayToTxt('tables', measureList);
                arrayToTxt('desc', measureDescriptions);
            }
        }

        // Add the year to the tablename, vulnerable to sql injection, but in admin section, should be safe
        if (request.body.yearSelect) {
            tableName += '_' + request.body.yearSelect.trim();
        }

        // Delete entry from the database
        deleteMeasureFromDB(tableName).then(function () {
            // Render page again with information text
            loadTextFile('tables').then(function (measureList) {
                response.render('pages/admin/showMeasures', {
                    user: request.session.username,
                    measures: measureList,
                    text: 'Kennzahl erfolgreich gelöscht.'
                });
            }); //TODO: errors
        }).catch(function (error) {
            loadTextFile('tables').then(function (measureList) {
                response.render('pages/admin/showMeasures', {
                    user: request.session.username,
                    measures: measureList,
                    text: 'Fehler beim Löschen der Kennzahl.'
                });
            });
        });
    }

    // Queries database with login data, returns homepage if login data is correct, returns error message otherwise
    app.post('/auth', authHelper);

    // Post action for creating a user, renders admin index after creating and storing user in the database, displays error if that failed
    app.post('/createUser', createUserHelper);

    // Post action for deleting a user, if user exists he is deleted from the database
    app.post('/deleteUser', deleteUserHelper);

    // Loads request data from database and renders it with a new visual page 
    app.post('/visual', visualPostHelper);

    // Get submitted data from user and put it into the database for the corresponding measure
    app.post('/submit', submitDataHelper);

    // TODO: yearly and quarterly measures
    // Handles submitted data when user created a new measure, writes info into local files and creates table
    app.post('/createMeasure', createMeasureHelper);

    // Handles deletion of a measure
    app.post('/deleteMeasure', deleteHelper);

    /**
     * 
     * GET REQUESTS FOLLOW HERE
     * 
     */

    const loadHelpData = async (request, response) => {
        try {
            const measureList = await loadTextFile('tables');
            const measureDescriptions = await loadTextFile('desc');

            response.render('pages/measureHelp', {
                user: request.session.username,
                measureListData: measureList,
                measureDescriptions: measureDescriptions
            });
        } catch (error) {
            // TODO: show error to user
            console.log(error);
        }
    }

    const helpFunction = async (request, response) => {
        if (request.session.loggedin) {
            checkRolePermissions('admin', request).then(function (result) {
                if (result) {
                    response.render('pages/admin/adminHelp', {
                        user: request.session.username
                    });
                } else {
                    response.render('pages/help', {
                        user: request.session.username
                    });
                }
                // Can we even reach this?
            }).catch(function (error) {
                console.log(error);
            });
        } else {
            response.render('pages/errors/loginError');
        }
    }

    const homeFunction = function (request, response) {
        if (request.session.loggedin) {
            response.setHeader('Content-Type', 'text/html');
            response.render('pages/index', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    }

    const visualHelper = function (request, response) {
        if (request.session.loggedin) {
            loadTextFile('tables').then(function (measureList) {
                response.render('pages/visual', {
                    user: request.session.username,
                    measureData: "",
                    loadedTable: "",
                    text: "",
                    measureListData: measureList
                });
            }).catch(function (error) {
                console.log(error);
            })
        } else {
            response.render('pages/errors/loginError');
        }
    }

    const submitHelper = function (request, response) {
        if (request.session.loggedin) {
            loadTextFile('tables').then(function (measureList) {
                response.render('pages/submit', {
                    user: request.session.username,
                    text: "",
                    measureListData: measureList
                });
            }).catch(function (error) {
                console.log(error);
            })
        } else {
            response.render('pages/errors/loginError');
        }
    }

    const createHelper = function (request, response) {
        if (request.session.loggedin) {
            checkRolePermissions('user', request).then(function (result) {
                if (result) {
                    response.render('pages/createMeasure', {
                        user: request.session.username,
                        text: ''
                    });
                } else {
                    response.render('pages/errors/adminError')
                }
            }).catch(function (error) {
                console.log(error);
            })
        } else {
            response.render('pages/errors/loginError');
        }
    }


    const adminHelper = function (request, response) {
        if (request.session.loggedin) {
            checkRolePermissions('admin', request).then(function (result) {
                if (result) {
                    response.render('pages/admin/admin', {
                        user: request.session.username,
                        text: ""
                    });
                } else {
                    response.render('pages/errors/adminError');
                    console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
                }
            }).catch(function (error) {
                console.log(error);
            })
        } else {
            response.render('pages/errors/loginError');
        }
    }

    const statHelper = function (request, response) {
        if (request.session.loggedin) {
            checkRolePermissions('admin', request).then(function (result) {
                if (result) {
                    response.render('pages/stats', {
                        user: request.session.username
                    });
                } else {
                    response.render('pages/errors/adminError');
                    console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
                }
            }).catch(function (error) {
                console.log(error);
            })
        } else {
            response.render('pages/errors/loginError');
        }
    }

    // Display user creation page
    app.get('/createUser', function (request, response) {
        if (request.session.loggedin) {
            checkRolePermissions('admin', request).then(function (result) {
                if (result) {
                    response.render('pages/admin/createUser', {
                        user: request.session.username
                    });
                } else {
                    response.render('pages/errors/adminError');
                    console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
                }
            }).catch(function (error) {
                console.log(error);
            })
        } else {
            response.render('pages/errors/loginError');
        }
    })

    const showUserHelper = function (request, response) {
        if (request.session.loggedin) {
            checkRolePermissions('admin', request).then(function (result) {
                if (result) {
                    // Load user from database
                    getAllUsersFromDB().then(function (result) {
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
                    }).catch(function (error) {
                        // TODO: create page with error message
                        console.log(error);
                    });
                } else {
                    response.render('pages/errors/adminError');
                    console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
                }
            }).catch(function (error) {
                console.log(error);
            })
        } else {
            response.render('pages/errors/loginError');
        }
    }

    const showHelper = function (request, response) {
        loadTextFile('tables').then(function (measureList) {
            if (request.session.loggedin) {
                checkRolePermissions('admin', request).then(function (result) {
                    if (result) {
                        response.render('pages/admin/showMeasures', {
                            user: request.session.username,
                            measures: measureList,
                            text: ''
                        });
                    } else {
                        response.render('pages/error/adminError');
                    }
                }).catch(function (error) {
                    console.log(error);
                })
            }
        }).catch(function (error) {
            console.log(error);
        })
    }

    const logoutHelper = function (request, response) {
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
    }

    // Displays information about measures in the system and their attributes
    app.get('/measureHelp', loadHelpData);

    // Loads simple help page
    app.get('/help', helpFunction);

    // Render index selection page
    app.get('/home', homeFunction);

    // Display visualization of data
    app.get('/visual', visualHelper);

    // Display menu for entering data
    app.get('/submit', submitHelper);

    // Display menu for creating new key figures
    app.get('/createMeasure', createHelper);

    // Displays admin index page
    app.get('/admin', adminHelper);

    // Display basic managing information for a superuser or admin
    app.get('/stats', statHelper);

    // Display user creation page
    app.get('/showUser', showUserHelper);

    // Load measures and send them to the user, delete is handled in post
    app.get('/showMeasures', showHelper);

    // Logout user and delete the session object
    app.get('/logout', logoutHelper);

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

    // Return error message if requested page doesn't exist
    app.get('*', function (request, response) {
        response.render('pages/errors/error404');
    });

    /**
     * Replaces all occurrences of search with replacement in the string that it was called from.
     */
    String.prototype.replaceAll = function (search, replacement) {
        let target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };

    /**
     * Loads txt file from disk and converts it to an array.
     * @param {Data to be loaded from disk. Currently desc, table or roles.} name 
     * @param {Array with the data that is returned.} array 
     */
    const arrayToTxt = function (name, array) {
        // Open file stream
        let file = fs.createWriteStream(name + '.txt');

        file.on('error', function (err) {
            console.log(err);
        });
        // Append each array element to file
        array.forEach(function (v) {
            if (v != '') {
                file.write(v.join(',') + '\n');
            }
        });
        file.end();
        console.log('Wrote to file');
    }

    /**
     * Loads tables from disk txt file and converts them to an array.
     * @param {Tablename that is to be loaded, currently desc, tables or roles.} name 
     * @param {Return retrieved data from disk as array.} callback 
     */
    function loadTextFile(name) {
        // TODO: error checking
        return new Promise(function (resolve, reject) {
            console.log(name);
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
            resolve(array);
        });
    }

    // TODO: update javadoc and move to different file

    /**
     * Query database with specified username, check if user has the needed permissions, returns true or false in callback.
     * @param {Role that is checked.} role 
     * @param {Current Request, contains user information, we need the username.} request 
     * @param {Return true if user has the right role, false if not.} callback 
     */
    function checkRolePermissions(role, request) {
        return new Promise(function (resolve, reject) {
            let result = [];
            let allowed = false;

            // Query database for user
            connectionLogin.query('SELECT * FROM accounts WHERE username =' + connectionLogin.escape(request.session.username), function (err, res) {
                if (err) {
                    return reject(err);
                } else {
                    if (res.length) {
                        for (let i = 0; i < res.length; i++) {
                            result.push(res[i]);
                        }
                    }

                    userRoles = result[0].role.split('_');
                    measureRoles = role.split('_');

                    // Always allow admin access, don't need for loop for simple cases
                    for (i = 0; i < userRoles.length; i++) {
                        for (j = 0; j < measureRoles.length; j++) {
                            // Remove semicolon, why is it even there?
                            if (measureRoles[j].includes(";")) {
                                measureRoles[j] = measureRoles[j].slice(0, measureRoles[j].length - 1);
                            }

                            // Just split for visibility
                            if (userRoles[i] === 'admin' || (userRoles[i] === 'user' && measureRoles[j] !== 'admin')) {
                                allowed = true;
                            } else if (userRoles[i] === measureRoles[j]) {
                                allowed = true;
                            }
                        }
                    }
                    resolve(allowed);
                }
            });
        });
    }

    /**
     * Retrieve all users from the database.
     * @param {Contains all results or error if query couldn't be executed.} callback 
     */
    function getAllUsersFromDB() {
        return new Promise(function (resolve, reject) {
            let result = [];
            // Get all users from the database and put them in array
            connectionLogin.query('SELECT * FROM accounts', function (err, res) {
                if (err) return reject(err);
                if (res.length) {
                    for (i = 0; i < res.length; i++) {
                        result.push(res[i]);
                    }
                }
                resolve(result);
            });
        });
    }

    /**
     * Queries database for a complete measure, no sql injection prevention needed because tableName is taken from predefined list.
     * @param {Tablename that is to be queried from the database.} tableName 
     * @param {Returns error if query fails.} callback 
     */
    function getMeasureFromDB(tableName) {
        return new Promise(function (resolve, reject) {
            console.log('promise called');

            connectionData.query('SELECT * FROM ' + tableName + ';', function (err, res) {
                if (err) {
                    return reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    /**
     * Default query for measures database, currently used for inserting data into the database, full query has to be inserted here.
     * @param {Query hast to be passed here. TODO: maybe build query in this method} query 
     * @param {Returns error if insertion failed.} callback 
     */
    function measureDataRequest(query) {
        return new Promise(function (resolve, reject) {
            connectionData.query(query, function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    /**
     * Deletes specified table from the database.
     * @param {Table to be deleted.} tableName 
     * @param {Returns error if table couldn't be deleted.} callback 
     */
    function deleteMeasureFromDB(tableName) {
        return new Promise(function (resolve, reject) {
            connectionData.query('DROP TABLE ' + tableName, function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    /**
     * Insert user with provided data into the user database. Also executes the password check.
     * @param {Passed request, it contains all the needed information passed down from the body.} request 
     * @param {Returns error if insertion of user into the database fails.} callback 
     */
    function insertUserIntoDB(request) {
        return new Promise(function (resolve, reject) {
            // Check password strength
            if (pwCheck(request.body.password)) {
                // Hash insert password
                bcrypt.hash(request.body.password, saltRounds, function (err, hash) {
                    if (!err) {
                        // Insert the user into database, question marks provide prevention against sql attack
                        const sql = 'INSERT INTO `accounts` (`username`, `password`, `email`,`role`) VALUES (?, ?, ?, ?)';
                        connectionLogin.query(sql, [request.body.username, hash, request.body.mail, request.body.role], function (err) {
                            console.log(request.body.role);
                            if (err) return reject(err);
                            resolve();
                        });
                    } else {
                        console.log(err);
                    }
                });
                // Return error if test failed
            } else {
                err = "pw";
                console.log("password check failed");
                return reject(err);
            }
        });
    }
    /**
     * Deletes user with passed id from the accounts database.
     * @param {Passed id, used to identify the user in the database.} id 
     * @param {Returns error if deletion fails.} callback 
     */
    function deleteUserFromDB(id) {
        return new Promise(function (resolve, reject) {
            connectionLogin.query('DELETE FROM accounts where id=' + connectionLogin.escape(id), function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    /**
     * Check if entered password is a safe password, used when a new user is created.
     * @param {Password to be checked.} password 
     */
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