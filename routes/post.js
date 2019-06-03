/**
 * Contains all the functions used in post routes.
 */

// Import needed functions
const bcrypt = require('bcrypt');
const IO = require('./io.js');
const SQL = require('./mysql.js')
const mysql = require('mysql');

/**
 * Called while logging in, queries database for user password, hashes the input password and compares 
 * it with the queried password. Also contains error handling for things that can go wrong.
 * @param {The request received from the client. Should contain body with username and password.} request 
 * @param {Response sent to the client, either error page or rendering of index page if login was successful.} response 
 */
const authHelper = function (request, response) {
    // Grab username and password from body
    const username = request.body.username;
    const password = request.body.password;

    // Query database for username
    SQL.getUserFromDB(username).then(function (results) {
        // Hash and compare with stored hash
        bcrypt.compare(password, results[0].password, function (err, res) {
            // Log possible error
            if (err) console.log(err);
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
        // Catch sql errors
    }).catch(function (error) {
        if (error) console.log(error);
        response.render('pages/errors/loginFailed');
    });
}

/**
 * Called after user has input data for a new user. Tries to insert it into the database.
 * @param {Contains body with received user data.} request 
 * @param {Sends new admin page to the user, either with success or error message.} response 
 */
const createUserHelper = function (request, response) {
    // Try to insert new user into the database.
    SQL.insertUserIntoDB(request).then(function () {
        response.render('pages/admin/admin', {
            user: request.session.username,
            text: 'Benutzer erfolgreich erstellt.'
        });
        // Catch possible sql errors    
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
 * Called after admin tried to the delete user from the database.
 * @param {*} request 
 * @param {*} response 
 */
const deleteUserHelper = function (request, response) {
    // Sent query to the database for deleting a user
    SQL.deleteUserFromDB(request.body.id).then(function () {
        response.render('pages/admin/admin', {
            user: request.session.username,
            text: "Benutzer erfolgreich gelöscht."
        });
        // Catch possible errors, log them and sent error page to the user
    }).catch(function (error) {
        console.log(error);
        response.render('pages/admin/admin', {
            user: request.session.username,
            text: "Fehler beim Löschen des Benutzers."
        });
    })
}

/**
 * Checks for role permissions after user has queried server for data of measures from sql. 
 * Formats it correctly and sends it back to the user with a new page.
 * @param {Contains requested measure and year.} request 
 * @param {Sends measure data back to the user together with a new page.} response 
 */
const visualPostHelper = async (request, response) => {
    let measureList, roleList;

    let found = false;

    // Load Measures and their corresponding roles from disk.
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

                    // (Error handling should be simplified here)

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
                            // Show error if data query failed
                        }).catch(function (error) {
                            response.render('pages/visual', {
                                user: request.session.username,
                                measureData: "",
                                loadedTable: "",
                                text: "Datensatz nicht vorhanden!",
                                measureListData: measureList
                            });
                        });
                    }
                    // Show error page if rights check failed.
                } else {
                    response.render('pages/visual', {
                        user: request.session.username,
                        measureData: "",
                        loadedTable: "",
                        text: "Dafür besitzen Se nicht die nötigen Rechte!",
                        measureListData: measureList
                    });
                }
                // Show error page if rights check failed.
            }).catch(function (error) {
                console.log(error);
            })
        }
    }
}

/**
 * Handles post request after user has submitted data. Checks if user has rights to input the data and tries to input it afterwards.
 * @param {Request from the client, contains body with all necessary data for the sql request.} request 
 * @param {Sends new submit page back to the user, either with error or success text.} response 
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
        if (request.body.measure === roleList[i][0]) {
            // If measure is found, check if saved role equals current role and admin/user
            try {
                // Can only get it here because we need i
                result = await SQL.checkRolePermissions(roleList[i][1], request);
            } catch (error) {
                console.log(error);
            }

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
                    // Catch sql errors
                }).catch(function (error) {
                    console.log(error);
                    response.render('pages/submit', {
                        user: request.session.username,
                        text: "Fehler beim Eintragen der Daten!",
                        measureListData: measureList
                    });
                });
            } else {
                // Displayed when user has insufficient rights
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
 * Called when user tries to create a new measure. Has to check if table already exists, the new year already exists.
 * If one of the above is true, then only the lists on disk are modified. If they don't exist already a new measure 
 * is also created in the mysql database.
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
    let monthly = false;
    let quarterly = false;

    if (request.body.year) {
        monthly = true;
    }

    if (request.body.cycle === "quarterly") {
        quarterly = true;
    }

    // Check if table already exists, just add year if it doesn't exist, use same descriptions if it exists
    for (i = 0; i < measureList.length; i++) {
        if (measureList[i][0] == request.body.name) {
            // Get already existing years in measure
            const years = measureList[i][1].trim().split(':');
            measureExists = true;
            for (j = 0; j < years.length; j++) {
                // Show error if year already exists, which means the measure already exists in the system
                if ((quarterly || monthly) && years[j] == request.body.year) {
                    yearExists = true;
                    response.render('pages/createMeasure', {
                        text: "Fehler! Kennzahl existiert bereits!",
                        user: request.session.username,
                    });
                }
            }
            // Add year if it doesn't exist
            if ((quarterly || monthly) && !yearExists && measureExists) {
                addYear = true;
                measureList[i][1] += ':' + request.body.year;
            }
        }
    }

    // Need to add role to list if the measure doesn't exist
    if (!measureExists) {
        roleList.push([request.body.name, request.body.role + ';']);
    }

    desc.push(request.body.name.trim());
    desc.push(request.body.mainDesc);
    table.push(request.body.name.trim());

    let sql;

    // Format name correctly for mysql and add the year
    let tableName = request.body.id.replace('.', '$') + '_' + request.body.name.trim().replaceAll(' ', '_');

    if (quarterly) {
        // Create table and data for measures that are measured quarterly, they are still stored in the default format
        table.push(request.body.year);
        table.push(request.body.cycle);
        desc.push('dummy');
        sql = 'create table ' + tableName + '_' + request.body.year + ' (Monat INTEGER, ';
    } else if (monthly) {
        table.push(request.body.year);
        // Build sql string for table creation, TODO: prevent sql injection
        sql = 'create table ' + tableName + '_' + request.body.year + ' (Monat INTEGER, ';
        // Create table without year for measures that are measured once a year
    } else {
        // Build sql string for table creation, TODO: prevent sql injection
        table.push(request.body.cycle);
        sql = 'create table ' + tableName + '_' + request.body.cycle + ' (Monat INTEGER, ';
    }

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
    SQL.measureDataRequest(sql).then(async () => {
        try {
            // Sort list of measures alphabetically by measure name
            measureList = await sort2DArray(measureList);
            // Sort measure descriptions, so they are ordered the same
            measureDescriptions = await sort2DArray(measureDescriptions);
            // Sort measure descriptions, so they are ordered the same
            roleList = await sort2DArray(roleList);
        } catch (error) {
            console.log(error);
        }

        // Write new arrays to txt file
        IO.arrayToTxt('roles', roleList);
        IO.arrayToTxt('tables', measureList);
        IO.arrayToTxt('desc', measureDescriptions);

        response.render('pages/createMeasure', {
            text: "Kennzahl erfolgreich erstellt!",
            user: request.session.username,
        });
        // Catch mysql errors from the database
    }).catch(function (error) {
        console.log(error);
        response.render('pages/createMeasure', {
            text: "Fehler bei der Erstellung der Kennzahl!",
            user: request.session.username,
        });
    })
}

/**
 * Called when client tried to delete a measure from the database. Only the lists on disk are modified 
 * if only one year of the measure is deleted. If the measure only had this one year it also gets deleted 
 * from the database.
 * @param {*} request 
 * @param {*} response 
 */
const deleteHelper = async (request, response) => {
    let measureDescriptions, measureList, roleList;

    // Try to load data about tables from disk
    try {
        measureDescriptions = await IO.loadTextFile('desc');
        measureList = await IO.loadTextFile('tables');
        roleList = await IO.loadTextFile('roles');
    } catch (error) {
        console.log(error);
    }

    let tableName;
    let found = false;

    // Iterate through list of measures and search for the needed one
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

            // Try to sort arrays, print error if it fails
            try {
                // Sort list of measures alphabetically by measure name
                measureList = await sort2DArray(measureList);
                // Sort measure descriptions, so they are ordered the same
                measureDescriptions = await sort2DArray(measureDescriptions);
                // Sort measure descriptions, so they are ordered the same
                roleList = await sort2DArray(roleList);
            } catch (error) {
                console.log(error);
            }

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

    // Load new measureList from disk 
    let measureListNew;


    // Load table from disk again so we don't make any errors when displaying it
    try {
        measureListNew = await IO.loadTextFile('tables');
    } catch (error) {
        console.log(error);
    }

    // Delete entry from the database
    SQL.deleteMeasureFromDB(tableName).then(function () {
        // Render page again with information text
        response.render('pages/admin/showMeasures', {
            user: request.session.username,
            measures: measureListNew,
            text: 'Kennzahl erfolgreich gelöscht.'
        });
        // Or catch mysql error and show user corresponding error
    }).catch(function (error) {
        console.log(error);
        response.render('pages/admin/showMeasures', {
            user: request.session.username,
            measures: measureListNew,
            text: 'Fehler beim Löschen der Kennzahl.'
        });
    });
}

/**
 * Sorts a two-dimensional array by the value of the first entry in every array
 * @param {Array to be sorted.} array 
 */
const sort2DArray = function (array) {
    return new Promise(function (resolve, reject) {
        try {
            array = array.sort(function (a, b) {
                if (a[0] < b[0]) {
                    return -1;
                }
                if (a[0] > b[0]) {
                    return 1;
                }
                return 0;
            });
            resolve(array);
        } catch (error) {
            reject(error);
        }
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