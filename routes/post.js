/**
 * Contains all the functions used in post routes. Called from index.js. Handles all requests 
 * after a user submitted a form, e.g. login, submitting or retrieving of data. Information is 
 * retrieved from the request element, formatted correctly and then passed along into corresponding 
 * data or as query into mysql.
 */

// Import needed functions
const bcrypt = require('bcryptjs');
const IO = require('./io.js');
const SQL = require('./mysql.js')
const mysql = require('mysql');
const winston = require('winston');
require('winston-daily-rotate-file');


// Automatic log file saving for failed login attempts
const failedLoginAttempts = new (winston.transports.DailyRotateFile)({
    filename: './logs/login-%DATE%.log',
    datePattern: 'DD-MM-YYYY',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d'
});

const logger = winston.createLogger({
    transports: [
        failedLoginAttempts
    ]
});


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
                logger.info("Failed login attempt by user " + username + "! Username is known by the system.");

                response.render('pages/errors/loginFailed');
            }
        });
        // Catch sql errors
    }).catch(function (error) {
        // Log error in console, write failed login attempt in separate log
        if (error) console.log(error);
        logger.warn("Failed login attempt by user " + username + "! Username is not known by the system.");

        response.render('pages/errors/loginFailed');
    });
}


/**
 * Called after user has input data for a new user. Tries to insert it into the database.
 * @param {Contains body with received user data.} request 
 * @param {Sends new admin page to the user, either with success or error message.} response 
 */
const createUserHelper = async (request, response) => {
    // Load roles and mandate data
    let roleList, mandateList;
    try {
        roleList = await IO.loadTextFile('roles');
        mandateList = await IO.loadTextFile('mandates');
    } catch (error) {
        console.log(error);
    }

    // Try to insert new user into the database.
    SQL.insertUserIntoDB(request).then(function () {
        response.render('pages/admin/adminIndex', {
            user: request.session.username,
            text: 'Benutzer erfolgreich erstellt.'
        });
        // Catch possible sql errors    
    }).catch(function (error) {
        let responseText;
        // Show corresponding error messages if password is unsafe or user already exists, user names have to be unique
        if (error === 'pw') {
            responseText = 'Fehler bei der Erstellung des Benutzers! Passwort zu unsicher.';
        } else if (error === 'pwSame') {
            responseText = 'Fehler bei der Erstellung des Benutzers! Passwörter stimmen nicht überein.'
        } else if (error) {
            console.log(error);
            responseText = 'Fehler bei der Erstellung des Benutzers! Benutzer bereits vorhanden.';
        }
        response.render('pages/admin/createUser', {
            user: request.session.username,
            text: responseText,
            roleList: roleList,
            mandateList: mandateList
        });
    });
}

/**
 * Called after admin tried to the delete user from the database.
 * @param {Request received from the client, contains user that is to be deleted.} request 
 * @param {Page sent back to the user, contains success or error message.} response 
 */
const deleteUserHelper = function (request, response) {
    // Sent query to the database for deleting a user
    SQL.deleteUserFromDB(request.body.id).then(function () {
        response.render('pages/admin/adminIndex', {
            user: request.session.username,
            text: "Benutzer erfolgreich gelöscht."
        });
        // Catch possible errors, log them and sent error page to the user
    }).catch(function (error) {
        console.log(error);
        response.render('pages/admin/adminIndex', {
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
    // Load Measures and their corresponding roles from disk.
    let measureList, roleList;

    try {
        mandateList = await IO.loadTextFile('mandates');
        measureList = await IO.loadTextFile('tables');
        roleList = await IO.loadTextFile('roles');
    } catch (error) {
        console.log(error);
    }

    let result, resultMandate;

    let found = false;
    let indexSave = -1;

    for (i = 0; i < roleList.length && !found; i++) {
        // If measure is found, check if saved role equals current role and admin/user
        if (request.body.measure === roleList[i][0]) {
            found = true;
            indexSave = i;

            // Check roles if measure is found in access table
            try {
                result = await SQL.checkRolePermissions(roleList[indexSave][1], request);
                resultMandate = await SQL.checkMandatePermissions(mandateList[indexSave][1], request);
            } catch (error) {
                console.log(error);
            }

            // Only access when user has correct role and mandate
            if (result && resultMandate) {
                loadNameFromSQL(request.body.measure, request.body.year, request.body.month).then(function (result) {
                    // Render page with newly acquired data
                    response.render('pages/visual', {
                        user: request.session.username,
                        measureData: JSON.stringify(result[1]),
                        loadedTable: result[0],
                        text: 'Daten erfolgreich geladen!',
                        lastSelected: request.body.measure,
                        lastYear: request.body.year,
                        measureListData: measureList,
                        selectedMonth: request.body.month
                    });
                    // Show error if data query failed
                }).catch(function (error) {
                    console.log(error);
                    response.render('pages/visual', {
                        user: request.session.username,
                        measureData: '',
                        loadedTable: '',
                        lastSelected: '',
                        lastYear: '',
                        text: 'Datensatz nicht vorhanden!',
                        measureListData: measureList,
                        selectedMonth: ''
                    });
                });
                // Show error if user has wrong rights
            } else {
                console.log('Permission error')
                response.render('pages/visual', {
                    user: request.session.username,
                    measureData: '',
                    loadedTable: '',
                    lastSelected: '',
                    lastYear: '',
                    text: 'Dafür besitzen Se nicht die nötigen Rechte!',
                    measureListData: measureList,
                    selectedMonth: ''
                });
            }
        }
    }
}

/**
 * Handles post request after user has submitted data. Checks if user has rights to input the data and tries to input it afterwards.
 * @param {Request from the client, contains body with all necessary data for the sql request.} request 
 * @param {Sends new submit page back to the user, either with error or success text.} response 
 */
const submitDataHelper = async (request, response) => {
    let roleList, measureList, entryList, entryListNew, result, mandateList;

    // Used to convert month to month number
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    // Used to convert quarters to 1-4
    const quarters = ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal'];

    // Load table data from disk
    try {
        mandateList = await IO.loadTextFile('mandates');
        measureList = await IO.loadTextFile('tables');
        roleList = await IO.loadTextFile('roles');
        entryList = await IO.loadTextFile('entries');
        // Working copy in case the SQL query fails
        entryListNew = await IO.loadTextFile('entries');
    } catch (error) {
        console.log(error);
    }

    // Save index, because for-loop keeps running while reading from disk
    let indexSave = -1;
    let found = false;

    // Search for measure in role list, start building query if found
    for (i = 0; i < roleList.length && !found; i++) {
        if (request.body.measure === roleList[i][0]) {
            indexSave = i;
            let quarterly = false;
            let yearly = false;
            let daily = false;
            found = true;

            // If measure is found, check if saved role equals current role and admin/user
            try {
                // Can only get it here because we need i
                result = await SQL.checkRolePermissions(roleList[indexSave][1], request);
                resultMandate = await SQL.checkMandatePermissions(mandateList[indexSave][1], request);
            } catch (error) {
                console.log(error);
            }

            // Check roles if measure is found in access table
            if (result && resultMandate) {
                let tableName;

                // Check if entered table really exists, get concrete table name in database
                for (i = 0; i < measureList.length; i++) {
                    if (measureList[i][0] === request.body.measure) {
                        const entry = measureList[i];
                        tableName = (entry[entry.length - 1]).slice(0, (entry[entry.length - 1]).length - 1);
                    }
                }

                // We don't need the summation info here
                let indexCut = tableName.indexOf('~');
                tableName = tableName.slice(0, indexCut);

                let year;
                let date;

                if (tableName.includes('_daily')) {
                    date = request.body.dailyDate;
                    year = date.slice(0, 4);

                    daily = true;
                } else {
                    // Escaping year for sql injection and slicing out the year, only quarter or month left afterwards
                    date = mysql.escape(request.body.date).slice(1, request.body.date.length + 1);

                    // Get just the year
                    year = date.slice(date.length - 4, date.length);
                }

                // Build sql string
                let query = 'REPLACE INTO `' + tableName;

                // Different cases for different kinds of measures, yearly, quarterly and monthly
                if (measureList[indexSave][1] === 'yearly') {
                    // Needed for yearly measures
                    yearly = true;

                    query += '_yearly` () values (' + mysql.escape(year) + ',';
                } else if (measureList[indexSave][2] === 'quarterly') {
                    // Add year to tablename
                    query += '_' + year + '` () values (';

                    quarterly = true;

                    // First case handles the year entry, second case entries with quarter
                    if (date.length === 4) {
                        query += mysql.escape(year) + ',';
                    } else {
                        query += parseInt((quarters.indexOf(date.slice(0, date.length - 4)) + 1 + year), 10) + ',';
                    }
                } else if (daily) {
                    query += '_' + year + '` () values (';

                    query += mysql.escape(date.replaceAll('-', '')) + ',';
                } else {
                    // Add year to tablename
                    query += '_' + year + '` () values (';

                    // First case handles the year entry, second case entries with months
                    if (date.length === 4) {
                        query += mysql.escape(year) + ',';
                    } else {
                        query += parseInt((months.indexOf(date.slice(0, date.length - 4)) + 1 + year), 10) + ',';
                    }
                }


                // Get attributes, they are already in the right order
                for (let key in request.body) {
                    if (key.includes('var')) {
                        query += mysql.escape(request.body[key]);
                        query += ',';
                    }
                }

                // Finish query for sql
                query = query.slice(0, query.length - 1) + ');';

                // Month for automatic reselection
                if (!daily) {
                    month = date.slice(0, date.length - 4);
                } else {
                    month = 0;
                }

                // Contain month or quarter number if it exists, else it is -1
                let quarterNumber = -1;
                let monthNumber = -1;

                // Get indexes of month or quarters
                if (quarterly) {
                    quarterNumber = quarters.indexOf(month);
                } else if (daily) {
                    //monthNumber = date.slice();
                } else {
                    monthNumber = months.indexOf(month);
                }

                let found = false;
                let entry;

                // Find correct entry in list of entries
                for (k = 0; k < entryListNew.length; k++) {
                    if (entryListNew[k][0] === request.body.measure) {
                        found = true;
                        entry = entryListNew[k];
                    }
                }

                // Empty numbers for string if they aren't there
                if (monthNumber == '-1') {
                    monthNumber = '';
                }
                if (quarterNumber == -1) {
                    quarterNumber = '';
                }

                // Push completely new entry if the measure wasn't present before
                if (found) {
                    // If not slice out the comma and add the new number to it, also check before to make sure we don't have a duplicate entry
                    if (quarterly) {
                        if (!entry.includes(quarterNumber + year) && !entry.includes(quarterNumber + year + ';')) {
                            entry[entry.length - 1] = entry[entry.length - 1].slice(0, entry[entry.length - 1].length - 1);
                            entry.push(quarterNumber + year + ';');
                        }
                    } else if (yearly) {
                        if (!entry.includes(year) && !entry.includes(year + ';')) {
                            entry[entry.length - 1] = entry[entry.length - 1].slice(0, entry[entry.length - 1].length - 1);
                            entry.push(year + ';');
                        }
                    } else if (daily) {
                        let dateNumber = date.replaceAll('-', '');
                        if (!entry.includes(dateNumber) && !entry.includes(dateNumber + ';')) {
                            entry[entry.length - 1] = entry[entry.length - 1].slice(0, entry[entry.length - 1].length - 1);
                            entry.push(dateNumber + ';');
                        }
                    } else {
                        if (!entry.includes(monthNumber + year) && !entry.includes(monthNumber + year + ';')) {
                            entry[entry.length - 1] = entry[entry.length - 1].slice(0, entry[entry.length - 1].length - 1);
                            entry.push(monthNumber + year + ';');
                        }
                    }
                    // We should never reach this except user messes with files he shouldn't
                } else {
                    console.log('ERROR: Tried entering data for measure that doesn\'t exist.')
                }

                // Sort and write to disk if there was no sql error
                entryListNew = await sort2DArray(entryListNew);

                // And insert them into the database
                SQL.measureDataRequest(query).then(function () {
                    // Only write entries to real list and disk if sql-query was successful
                    entryList = entryListNew;
                    IO.arrayToTxt('entries', entryList);

                    response.render('pages/submit', {
                        text: "Daten erfolgreich eingetragen!",
                        user: request.session.username,
                        measure: request.body.measure,
                        lastYear: year,
                        entries: entryList,
                        lastMonth: month,
                        measureListData: measureList
                    });
                    // Catch sql errors
                }).catch(function (error) {
                    console.log(error);
                    response.render('pages/submit', {
                        user: request.session.username,
                        text: "Fehler beim Eintragen der Daten!",
                        measure: request.body.measure,
                        lastYear: year,
                        entries: entryList,
                        lastMonth: month,
                        measureListData: measureList
                    });
                });
            } else {
                // Displayed when user has insufficient rights
                console.log(request.body.username + ' tried accessing measure without correct rights.');
                response.render('pages/submit', {
                    text: "Dafür besitzen Sie nicht die nötigen Rechte!",
                    user: request.session.username,
                    measure: request.body.measure,
                    lastYear: '',
                    lastMonth: '',
                    entries: entryList,
                    measureListData: measureList
                });
            }
        }
    }
}

/**
 * Called when user tries to create a new measure. Has to check if table already exists, the new year already exists.
 * If one of the above is true, then only the lists on disk are modified. If they don't exist already a new measure 
 * is also created in the mysql database.
 * // TODO: remove id from gui, assign it automatically
 * @param {Request received from the user, hopefully contains all the necessary data to save the measure in the system.} request 
 * @param {Response page sent back to the user, contains message about success or error while creating the measure.} response 
 */
const createMeasureHelper = async (request, response) => {
    // Load all needed data from disk
    let measureDescriptions, measureList, roleList, entryList, mandateList;

    try {
        measureDescriptions = await IO.loadTextFile('desc');
        measureList = await IO.loadTextFile('tables');
        roleList = await IO.loadTextFile('roles');
        entryList = await IO.loadTextFile('entries');
        mandateList = await IO.loadTextFile('mandates');
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
    let daily = false;
    let error = false;

    // Determine which kind of measure was entered by the user
    if (request.body.cycle === 'quarterly' && request.body.year) {
        quarterly = true;
    } else if (request.body.cycle === 'monthly' && request.body.year) {
        monthly = true;
    } else if (request.body.cycle === 'daily' && request.body.year) {
        daily = true;
    } else if (request.body.cycle !== 'yearly') {
        // Something went wrong
        error = true;
        // Show error if year is missing
        response.render('pages/createMeasure', {
            text: "Fehler! Bitte geben Sie das Jahr der Erfassung ein!",
            user: request.session.username,
            roleList: roleList,
            mandateList: mandateList
        });
    }

    // Check if user enters tablename as attribute name again
    for (let key in request.body) {
        if (key.includes('var')) {
            if (request.body[key] === request.body.name) {
                error = true;
            }
        }
    }

    // Don't need all this if something went wrong before
    if (!error) {
        // Check if table already exists, just add year if it doesn't exist, use same descriptions if it exists
        for (i = 0; i < measureList.length; i++) {
            if (measureList[i][0] == request.body.name) {
                // Get already existing years in measure
                const years = measureList[i][1].trim().split(':');
                measureExists = true;
                for (j = 0; j < years.length; j++) {
                    // Show error if year already exists, which means the measure already exists in the system
                    if ((quarterly || monthly || daily) && years[j] == request.body.year) {
                        yearExists = true;
                        response.render('pages/createMeasure', {
                            text: "Fehler! Kennzahl existiert bereits!",
                            user: request.session.username,
                            roleList: roleList,
                            mandateList: mandateList
                        });
                    }
                }
                // Add year if it doesn't exist
                if ((quarterly || monthly || daily) && !yearExists && measureExists) {
                    addYear = true;
                    measureList[i][1] += ':' + request.body.year;
                }
            }
        }

        // Need to add role to list if the measure doesn't exist
        if (!measureExists) {
            roleList.push([request.body.name, request.body.role + ';']);
            // And also push to mandate list
            mandateList.push([request.body.name, request.body.mandate + ';']);
        }

        let notExists = true;

        // Trim any remaining white spaces and push to lists
        desc.push(request.body.name.trim());
        desc.push(request.body.mainDesc);
        table.push(request.body.name.trim());

        // Check if entry existed before
        for (l = 0; l < entryList.length; l++) {
            if (entryList[l].includes(request.body.name)) {
                notExists = false;
            }
        }

        // Push if it didn't exist before
        if (notExists) {
            entryList.push([request.body.name, 'dummy;']);
        }

        let sql = '';

        // Format name correctly for mysql and add the year, backticks handle sql injection escape
        let tableName = request.body.id.replace('.', '$') + '_' + request.body.name.trim().replaceAll(' ', '_');

        // Build string here with correct attributes
        if (quarterly) {
            // Create table and data for measures that are measured quarterly, they are still stored in the default format
            table.push(request.body.year);
            table.push(request.body.cycle);
            desc.push('dummy');
            sql = 'create table ' + '`' + tableName + '_' + request.body.year + '` (Monat INTEGER, ';
        } else if (monthly) {
            table.push(request.body.year);
            sql = 'create table ' + '`' + tableName + '_' + request.body.year + '` (Monat INTEGER, ';
        } else if (daily) {
            tableName += '_daily';
            table.push(request.body.year);
            sql = 'create table ' + '`' + tableName + '_' + request.body.year + '` (Tag INTEGER, ';
        } /* else {
            table.push(request.body.cycle);
            sql = 'create table ' + '`' + tableName + '_' + request.body.cycle + '` (Monat INTEGER, ';
        }*/

        // Add attribute names and descriptions, should always be same number of items
        for (let key in request.body) {
            if (key.includes('var')) {
                table.push(request.body[key]);
                sql += '`' + request.body[key].replaceAll(' ', '_') + '` FLOAT,';
            } else if (key.includes('desc')) {
                desc.push(request.body[key]);
            }
        }

        // Make month the primary key 
        if (!daily) {
            sql += ' constraint pk_1 primary key(Monat));';
        } else {
            sql += ' constraint pk_1 primary key(Tag));';
        }

        // Add semicolon, later needed for identification
        if (daily) {
            tableName += '~' + request.body.sumCalc + ';';
        } else {
            tableName += '~' + request.body.sumCalc + ';';
        }
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
                // Sort all lists by the first entry, so they are all ordered the same
                measureList = await sort2DArray(measureList);
                measureDescriptions = await sort2DArray(measureDescriptions);
                roleList = await sort2DArray(roleList);
                entryList = await sort2DArray(entryList);
                mandateList = await sort2DArray(mandateList);
            } catch (error) {
                console.log(error);
            }

            // Write new arrays to txt file
            IO.arrayToTxt('mandates', mandateList);
            IO.arrayToTxt('roles', roleList);
            IO.arrayToTxt('tables', measureList);
            IO.arrayToTxt('desc', measureDescriptions);
            IO.arrayToTxt('entries', entryList);

            response.render('pages/createMeasure', {
                text: "Kennzahl erfolgreich erstellt!",
                user: request.session.username,
                roleList: roleList,
                mandateList: mandateList
            });
            // Catch mysql errors from the database
        }).catch(function (error) {
            console.log(error);
            response.render('pages/createMeasure', {
                text: "Fehler bei der Erstellung der Kennzahl!",
                user: request.session.username,
                roleList: roleList,
                mandateList: mandateList
            });
        })
    } else {
        response.render('pages/createMeasure', {
            text: "Fehler bei der Erstellung der Kennzahl!",
            user: request.session.username,
            roleList: roleList,
            mandateList: mandateList
        });
    }
}

/**
 * Called when client tried to delete a measure from the database. Only the lists on disk are modified 
 * if only one year of the measure is deleted. If the measure only had this one year it also gets deleted 
 * from the database.
 * @param {Request received from the user, contains measure to be deleted.} request 
 * @param {Response page sent back to the user, new delete page, contains success or error message.} response 
 */
const deleteHelper = async (request, response) => {
    let measureDescriptions, measureList, roleList;

    // Try to load data about tables from disk
    try {
        measureDescriptions = await IO.loadTextFile('desc');
        measureList = await IO.loadTextFile('tables');
        roleList = await IO.loadTextFile('roles');
        entryList = await IO.loadTextFile('entries');
        mandateList = await IO.loadTextFile('mandates');
    } catch (error) {
        console.log(error);
    }

    let tableName;
    let found = false;

    // Iterate through list of measures and search for the needed one
    for (i = 0; i < measureList.length; i++ && !found) {
        if (measureList[i][0] === request.body.measureSelect) {
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
                    entryList.splice(i, 1);
                    mandateList.splice(i, 1);
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

                // Find corresponding entry in entryList, remove all values in that entry that contain the deleted year
                for (k = 0; k < entryList.length; k++) {
                    // Need to make sure it exists, otherwise we might delete some other entry
                    if (entryList[i][0] === request.body.measureSelect) {
                        let newEntryList = [];
                        // Loop through years, create new array with every value that isn't supposed to be deleted
                        for (l = 0; l < entryList[i].length; l++) {
                            if (!entryList[i][l].includes(request.body.yearSelect)) {
                                newEntryList.push(entryList[i][l]);
                            }
                        }
                        // Overwrite old values
                        entryList[i] = newEntryList;
                    } else {
                        console.log('ERROR: Measure without entries deleted.')
                    }
                }

                // Remove last :
                measureList[i][1] = newYears.slice(0, newYears.length - 1);
            }

            // Try to sort arrays, print error if it fails
            try {
                // Sort all lists so they are ordered the same, this saves time later
                measureList = await sort2DArray(measureList);
                measureDescriptions = await sort2DArray(measureDescriptions);
                roleList = await sort2DArray(roleList);
                entryList = await sort2DArray(entryList);
                mandateList = await sort2DArray(mandateList);
            } catch (error) {
                console.log(error);
            }

            // Write new arrays to txt file
            IO.arrayToTxt('mandates', mandateList);
            IO.arrayToTxt('entries', entryList);
            IO.arrayToTxt('roles', roleList);
            IO.arrayToTxt('tables', measureList);
            IO.arrayToTxt('desc', measureDescriptions);
        }
    }

    // We don't need the summation info anymore
    let indexCut = tableName.indexOf('~');
    tableName = tableName.slice(0, indexCut);

    // Add the year to the tablename, vulnerable to sql injection, but in admin section, should be safe
    if (request.body.yearSelect) {
        tableName += '_' + request.body.yearSelect.trim();
    }

    // Delete entry from the database
    SQL.deleteMeasureFromDB(tableName).then(function () {
        // Render page again with information text
        response.render('pages/admin/deleteMeasure', {
            user: request.session.username,
            measures: measureList,
            text: 'Kennzahl erfolgreich gelöscht.'
        });
        // Or catch mysql error and show user corresponding error
    }).catch(function (error) {
        console.log(error);
        response.render('pages/admin/deleteMeasure', {
            user: request.session.username,
            measures: measureList,
            text: 'Fehler beim Löschen der Kennzahl.'
        });
    });
}

/**
 * Receives post requests from changeMeasure page, collects all the necessary info and passes it to 
 * the database as request. If everything goes well the column is added to the correct table in the database.
 * @param {Request from the user page, contains all the data needed for creation of new column.} request 
 * @param {Sends back new page with success/error text.} response 
 */
const addAttributeHelper = async (request, response) => {
    let measureDescriptions, measureList;

    // Try to load data about tables from disk
    try {
        measureDescriptions = await IO.loadTextFile('desc');
        measureList = await IO.loadTextFile('tables');
    } catch (error) {
        console.log(error);
    }

    // Different helper arrays used later for storing the data
    let tableNames = [];
    let descData = [];
    let attributeData = [];
    let foundIndex = -1;
    let tableName;
    let alreadyExists = false;

    // Get stuff from request and save in corresponding arrays
    for (let key in request.body) {
        // Save found stuff for later, for now only one value in each, but could be easily converted to multiple values
        if (key.includes('var')) {
            attributeData.push(request.body[key]);
        } else if (key.includes('desc')) {
            descData.push(request.body[key] + ';');
        }
    }

    // Cycle through measures known to the system and look for entered measure
    for (i = 0; i < measureList.length; i++) {
        if (measureList[i][0] === request.body.measure) {
            // Format tablename correctly here
            tableName = measureList[i][measureList[i].length - 1].slice(0, measureList[i][measureList[i].length - 1].length - 1) + '_';
            // Store index here for later, should be the same for all
            foundIndex = i;

            for (j = 0; j < attributeData.length; j++) {
                if (measureList[i].includes(attributeData[j])) {
                    alreadyExists = true;
                }
            }

            // Split years of the measure
            const years = measureList[i][1].split(':');

            // Cycle through years of the measure and add them all to the tablename, store them in tableNames
            for (j = 0; j < years.length; j++) {
                let indexCut = tableName.indexOf('~');
                tableName = tableName.slice(0, indexCut);
                tableNames.push(tableName + '_' + years[j]);
            }
        }
    }

    // Only enter attribute if it didn't exist before
    if (!alreadyExists) {
        // Make sure we have the correct entry and start adding values
        if (measureList[foundIndex][0] === request.body.measure) {
            // Add descData to correct place in description array
            // Add new attributes to correct place in tables array
            for (j = 0; j < descData.length; j++) {
                // Remove the last semicolon so we don't get confused later
                const entry = measureDescriptions[foundIndex];
                entry[entry.length - 1] = entry[entry.length - 1].slice(0, entry[entry.length - 1].length - 1);

                // Add the new description
                measureDescriptions[foundIndex].push(descData[j]);
                // Insert it into measureList, but before the last element
                measureList[foundIndex].splice(measureList[foundIndex].length - 1, 0, attributeData[j]);
            }
        }
        // Write new arrays to txt file, sorting isn't necessary here
        IO.arrayToTxt('tables', measureList);
        IO.arrayToTxt('desc', measureDescriptions);

        // Delete entry from the database and render page again with status information
        SQL.addColumnToDB(tableNames, attributeData).then(function () {
            // Render page again with information text
            response.render('pages/changeMeasure', {
                user: request.session.username,
                text: "Neue Attribute erfolgreich hinzugefügt.",
                measureList: measureList,
                descriptionList: measureDescriptions
            });
            // Or catch mysql error and show user corresponding error
        }).catch(function (error) {
            console.log(error);
            response.render('pages/changeMeasure', {
                user: request.session.username,
                text: "Fehler beim Hinzufügen des neuen Attributs!",
                measureList: measureList,
                descriptionList: measureDescriptions
            });
        });
        // Display error message otherwise
    } else {
        response.render('pages/changeMeasure', {
            user: request.session.username,
            text: "Fehler beim Hinzufügen des neuen Attributs, Attribut existiert bereits!",
            measureList: measureList,
            descriptionList: measureDescriptions
        });
    }
}

/**
 * Changes the specified attribute of the measure. Reloads the page again.
 * TODO: check if it needs updates for daily measures? 
 * @param {Request from the user. Contains the attribute to be changed.} request 
 * @param {Response with success/failure text. Also sends new page to the user.} response 
 */
const changeAttributeHelper = async (request, response) => {
    // Try to load table data from disk
    let measureDescriptions, measureList;

    try {
        measureDescriptions = await IO.loadTextFile('desc');
        measureList = await IO.loadTextFile('tables');
    } catch (error) {
        console.log(error);
    }

    // Stores table names and name of old attribute for mysql
    let tableNames = [];
    let attributeDataOld = request.body.attribute.replaceAll(' ', '_');

    // Loop through known measures and look for measure input by the user
    for (i = 0; i < measureList.length; i++) {
        if (measureList[i][0] === request.body.measure) {
            // Look for index of attribute in list entry
            const index = measureList[i].indexOf(request.body.attribute);
            if (index !== -1) {
                // Change the existing entry
                measureList[i][index] = request.body.changeVar;
                measureDescriptions[i][index] = request.body.changeDesc;

                // Format tablename correctly here
                tableName = measureList[i][measureList[i].length - 1].slice(0, measureList[i][measureList[i].length - 1].length - 1) + '_';
                // Store index here for later, should be the same for all
                foundIndex = i;

                // Split years of the measure
                const years = measureList[i][1].split(':');

                // Cycle through years of the measure and add them all to the tablename, store them in tableNames
                for (j = 0; j < years.length; j++) {
                    let indexCut = tableName.indexOf('~');
                    if (indexCut !== -1) {
                        tableName = tableName.slice(0, indexCut);
                    }
                    tableNames.push(tableName + '_' + years[j]);
                }
            } else {
                console.log('ERROR: Couldn\'t find attribute.');
            }
        }
    }

    let attributeData = request.body.changeVar.replaceAll(' ', '_');

    // Write new arrays to txt file, sorting isn't needed here
    IO.arrayToTxt('tables', measureList);
    IO.arrayToTxt('desc', measureDescriptions);

    // Remove column from mysql database
    SQL.changeTableColumn(tableNames, attributeDataOld, attributeData).then(function () {
        response.render('pages/changeMeasure', {
            user: request.session.username,
            text: "Attribut erfolgreich geändert.",
            measureList: measureList,
            descriptionList: measureDescriptions
        });
        // Catch possible errors
    }).catch(function (error) {
        console.log(error);
        response.render('pages/changeMeasure', {
            user: request.session.username,
            text: "Fehler beim Ändern des Attributs.",
            measureList: measureList,
            descriptionList: measureDescriptions
        });
    });
}

/**
 * Deletes the specified attribute of the measure. Reloads the page again.
 * TODO: Also delete entries from entries list if we delete the last attribute of the measure. 
 * But rare edge case, should almost never happen.
 * @param {Request from the user. Contains the attribute to be deleted.} request 
 * @param {Response with success/failure text. Also sends new page to the user.} response 
 */
const deleteAttributeHelper = async (request, response) => {
    // Try to load data about tables from disk
    let measureDescriptions, measureList;
    let tableNames = [];

    try {
        measureDescriptions = await IO.loadTextFile('desc');
        measureList = await IO.loadTextFile('tables');
    } catch (error) {
        console.log(error);
    }

    // Loop through known measures and look for measure input by the user
    for (i = 0; i < measureList.length; i++) {
        if (measureList[i][0] === request.body.measure) {
            // Look for index of attribute in list entry
            const index = measureList[i].indexOf(request.body.attribute);
            if (index !== -1) {
                // Delete entry
                measureList[i].splice(index, 1);
                measureDescriptions[i].splice(index, 1);

                // Format tablename correctly here
                tableName = measureList[i][measureList[i].length - 1].slice(0, measureList[i][measureList[i].length - 1].length - 1) + '_';
                // Store index here for later, should be the same for all
                foundIndex = i;

                // Split years of the measure
                const years = measureList[i][1].split(':');

                // Cycle through years of the measure and add them all to the tablename, store them in tableNames
                for (j = 0; j < years.length; j++) {
                    let indexCut = tableName.indexOf('~');
                    if (indexCut !== -1) {
                        tableName = tableName.slice(0, indexCut);
                    }
                    tableNames.push(tableName + '_' + years[j]);
                }
                // Should never happen, but display error message if we can't find the attribute
            } else {
                console.log('ERROR: Couldn\'t find attribute.');
                response.render('pages/changeMeasure', {
                    user: request.session.username,
                    text: "Fehler beim Löschen des Attributs. Attribut konnte nicht gefunden werden.",
                    measureList: measureList,
                    descriptionList: measureDescriptions
                });
            }
        }
    }

    let attributeData = request.body.attribute.replaceAll(' ', '_');

    // Write new arrays to txt file, sorting isn't needed here
    IO.arrayToTxt('tables', measureList);
    IO.arrayToTxt('desc', measureDescriptions);

    // Remove column from mysql database
    SQL.deleteColumnFromDB(tableNames, attributeData).then(function () {
        response.render('pages/changeMeasure', {
            user: request.session.username,
            text: "Attribut erfolgreich gelöscht.",
            measureList: measureList,
            descriptionList: measureDescriptions
        });
        // Catch possible errors
    }).catch(function (error) {
        console.log(error);
        response.render('pages/changeMeasure', {
            user: request.session.username,
            text: "Fehler beim Löschen des Attributs.",
            measureList: measureList,
            descriptionList: measureDescriptions
        });
    });
}

/**
 * Adds a new year to an already existing measure.
 * @param {Contains data about existing measure and the new year to add.} request 
 * @param {Sends back new page with response message.} response 
 */
const addYearHelper = async (request, response) => {
    // Load data lists from disk
    let measureList, measureDescriptions;

    try {
        measureDescriptions = await IO.loadTextFile('desc');
        measureList = await IO.loadTextFile('tables');
    } catch (error) {
        console.log(error);
    }

    let error = false;
    let tableName = '';
    let oldYear = '';

    // Find existing measure in measure list
    for (i = 0; i < measureList.length; i++) {
        if (measureList[i][0] === request.body.measure) {
            // Can't add year to yearly measures
            if (measureList[i][1] === 'yearly') {
                error = true;
                response.render('pages/changeMeasure', {
                    user: request.session.username,
                    text: "Fehler, jährlich-erfasste Kennzahl!",
                    measureList: measureList,
                    descriptionList: measureDescriptions
                });
                // Check if year already exists
            } else if (measureList[i][1].includes(request.body.year)) {
                error = true;
                response.render('pages/changeMeasure', {
                    user: request.session.username,
                    text: "Fehler, Jahr existiert bereits!",
                    measureList: measureList,
                    descriptionList: measureDescriptions
                });
            } else {
                // Add year to table list
                measureList[i][1] += ':' + request.body.year;

                oldYear = measureList[i][1].split(':')[0];

                // Need to get mysql tablename
                tableName = measureList[i][measureList[i].length - 1];

                // Write new array to txt file, sorting isn't needed here
                IO.arrayToTxt('tables', measureList);
            }
        }
    }

    // If measure isn't a yearly measure and the year doesn't exist already we can try to create the table in database
    if (!error) {
        SQL.copyTableWithNewYear(tableName, oldYear, request.body.year).then(function () {
            response.render('pages/changeMeasure', {
                user: request.session.username,
                text: "Jahr erfolgreich hinzugefügt.",
                measureList: measureList,
                descriptionList: measureDescriptions
            });
            // Catch errors while creating table
        }).catch(function (error) {
            console.log(error);
            response.render('pages/changeMeasure', {
                user: request.session.username,
                text: "Fehler beim Hinzufügen des neuen Jahrs!",
                measureList: measureList,
                descriptionList: measureDescriptions
            });
        });
    }
}

/**
 * Takes entered user data for new password, checks if old password is correct. If both new passwords are the same and fulfill 
 * password criteria call sql function for changing password. Maybe there is an easier way to code the error message / page renders.
 * TODO: https://codereview.stackexchange.com/questions/223409/better-code-for-error-handling-in-nodejs-and-express 
 */
const changePasswordHelper = function (request, response) {
    // Check if old password is correct
    SQL.getUserFromDB(request.session.username).then(function (results) {
        // Hash and compare with stored hash
        bcrypt.compare(request.body.oldPw, results[0].password, function (error, result) {
            // Log possible error
            if (error) console.log(error);
            if (result === true) {
                // Check if new passwords are both the same
                if (request.body.newPw === request.body.newPw2) {
                    // Call mysql function
                    SQL.changeUserPassword(request.session.username, request.body.newPw).then(function () {
                        response.render('pages/changePassword', {
                            user: request.session.username,
                            text: 'Passwort erfolgreich geändert.'
                        });
                    }).catch(function (error) {
                        console.log(error);
                        if (error == 'pw') {
                            response.render('pages/changePassword', {
                                user: request.session.username,
                                text: 'Neues Passwort zu unsicher.'
                            });
                        } else {
                            // Render error page
                            response.render('pages/changePassword', {
                                user: request.session.username,
                                text: 'Fehler beim Ändern des Passworts.'
                            });
                        }
                    });
                } else {
                    // Render error page
                    response.render('pages/changePassword', {
                        user: request.session.username,
                        text: 'Neue Passwörter stimmen nicht überein!'
                    });
                }
            } else {
                // Render error page
                response.render('pages/changePassword', {
                    user: request.session.username,
                    text: 'Altes Passwort stimmt nicht überein!'
                });
            }
        });
        // Catch sql errorsFehler beim Ändern des Passworts
    }).catch(function (error) {
        if (error) console.log(error);
        response.render('pages/errors/loginFailed');
    });
}

/**
 * Receives name and year, converts it to corresponding name in sql database and queries
 * the database for this measure, converts it to a string and passes it upwards. All errors
 * are also passed upwards.
 * @param {Name of the measure that we want the data of.} name 
 * @param {Year of the measure that we want the data of.} year 
 */
function loadNameFromSQL(name, year, month) {
    return new Promise(function (resolve, reject) {
        // Load file with table names for checking
        IO.loadTextFile('tables').then(function (measureList) {
            let tableName;

            // Check if inserted measure data really exists
            for (i = 0; i < measureList.length; i++) {
                if (measureList[i][0] === name) {
                    tableName = (measureList[i][measureList[i].length - 1]).slice(0, (measureList[i][measureList[i].length - 1]).length - 1);
                }
            }

            // Slice out the info for building the yearly column
            let indexCut = tableName.indexOf('~');
            tableName = tableName.slice(0, indexCut);

            // If user has entered a year we can add it and query the database
            if (year) {
                tableName = tableName + "_" + year.trim();
                SQL.getMeasureFromDB(tableName, month).then(function (result) {
                    resolve([tableName, result]);
                }).catch(function (error) {
                    reject(error);
                });
            }

            // Catch errors while loading and pass them upwards
        }).catch(function (error) {
            reject(error);
        });
    });
}

/**
 * Sorts a two-dimensional array by the value of the first entry in every array.
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

// Export all functions
module.exports = {
    authHelper: authHelper,
    createUserHelper: createUserHelper,
    deleteUserHelper: deleteUserHelper,
    visualPostHelper: visualPostHelper,
    submitDataHelper: submitDataHelper,
    createMeasureHelper: createMeasureHelper,
    deleteHelper: deleteHelper,
    addAttributeHelper: addAttributeHelper,
    changeAttributeHelper: changeAttributeHelper,
    deleteAttributeHelper: deleteAttributeHelper,
    changePasswordHelper: changePasswordHelper,
    addYearHelper: addYearHelper
}
