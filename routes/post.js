/**
 * Contains all the functions used in post routes.
 */

//TODO: comments

// Import needed functions
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const IO = require('./io.js');
const SQL = require('./mysql.js')

// Create SQL-Connection for accessing user data
const connectionLogin = mysql.createConnection({
    host: 'localhost',
    user: 'dbaccess',
    password: 'Pdgy#MW$Jud6F$_B',
    database: 'nodelogin'
});

/**
 * 
 * @param {*} request 
 * @param {*} response 
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

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const createUserHelper = function (request, response) {
    SQL.insertUserIntoDB(request).then(function () {
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

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const deleteUserHelper = function (request, response) {
    const id = request.body.id;
    SQL.deleteUserFromDB(id).then(function () {
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

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const visualPostHelper = async (request, response) => {
    let measureList, roleList;

    try {
        measureList = await IO.loadTextFile('tables');
        roleList = await IO.loadTextFile('roles');
    } catch (error) {
        console.log(error);
    }

    for (i = 0; i < roleList.length; i++ && !found) {
        // If measure is found, check if saved role equals current role and admin/user
        if (request.body.measure === roleList[i][0]) {
            found = true;
            // Check roles if measure is found in access table
            SQL.checkRolePermissions(roleList[i][1], request).then(function (result) {
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

                        SQL.getMeasureFromDB(tableName).then(function (result) {
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

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const submitDataHelper = async (request, response) => {
    let roleList, measureList, result;

    try {
        measureList = await IO.loadTextFile('tables');
        roleList = await IO.loadTextFile('roles');
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
            result = await SQL.checkRolePermissions(roleList[i][1], request);
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
                const date = mysql.escape(tableData[1]).slice(1, tableData[1].length + 1);
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
                    query += mysql.escape(tableData[i]);
                    query += ',';
                }

                // Remove last comma
                query = query.slice(0, query.length - 1);
                query += ');'

                // And insert them into the database
                SQL.measureDataRequest(query).then(function () {
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
                IO.loadTextFile('tables', function (measureListNew) {
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

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const createMeasureHelper = async (request, response) => {
    let measureDescriptions, measureList, roleList;

    try {
        measureDescriptions = await IO.loadTextFile('desc');
        measureList = await IO.loadTextFile('tables');
        roleList = await IO.loadTextFile('roles');

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
    SQL.measureDataRequest(sql).then(function () {
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
        IO.arrayToTxt('roles', roleList);
        IO.arrayToTxt('tables', measureList);
        IO.arrayToTxt('desc', measureDescriptions);

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

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const deleteHelper = async (request, response) => {
    let measureDescriptions, measureList, roleList;

    try {
        measureDescriptions = await IO.loadTextFile('desc');
        measureList = await IO.loadTextFile('tables');
        roleList = await IO.loadTextFile('roles');
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
            IO.arrayToTxt('roles', roleList);
            IO.arrayToTxt('tables', measureList);
            IO.arrayToTxt('desc', measureDescriptions);
        }
    }

    // Add the year to the tablename, vulnerable to sql injection, but in admin section, should be safe
    if (request.body.yearSelect) {
        tableName += '_' + request.body.yearSelect.trim();
    }

    // Delete entry from the database
    SQL.deleteMeasureFromDB(tableName).then(function () {
        // Render page again with information text
        IO.loadTextFile('tables').then(function (measureList) {
            response.render('pages/admin/showMeasures', {
                user: request.session.username,
                measures: measureList,
                text: 'Kennzahl erfolgreich gelöscht.'
            });
        }).catch(function (error) {
            console.log(error);
        });
    }).catch(function (error) {
        IO.loadTextFile('tables').then(function (measureList) {
            response.render('pages/admin/showMeasures', {
                user: request.session.username,
                measures: measureList,
                text: 'Fehler beim Löschen der Kennzahl.'
            });
        }).catch(function (error) {
            console.log(error);
        });
    });
}

/**
 * Replaces all occurrences of search with replacement in the string that it was called from.
 */
String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// Export all functions
module.exports = {
    authHelper: authHelper,
    createUserHelper: createUserHelper,
    deleteUserHelper: deleteUserHelper,
    visualPostHelper: visualPostHelper,
    submitDataHelper: submitDataHelper,
    createMeasureHelper: createMeasureHelper,
    deleteHelper: deleteHelper
}