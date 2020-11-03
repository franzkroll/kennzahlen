/**
 * Contains all mysql functions. All calls to these functions are from post-handlers.
 * Information gets passed to these functions from which the queries are built. Also handles most
 * of the prevention of sql-injections.
 */

// Imports 
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const passwordValidator = require('password-validator');
const IO = require('./io.js');
require('dotenv').config();

// Salt rounds for password encryption
const saltRounds = 10;

// Create SQL-Connection for accessing measure data
const connectionData = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_MEASURE_USER,
    password: process.env.DB_MEASURE_PASSWORD,
    database: process.env.DB_MEASURE_DATABASE,
    port: process.env.MYSQL_PORT
});

// Create SQL-Connection for accessing user data
const connectionLogin = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_LOGIN_USER,
    password: process.env.DB_LOGIN_PASSWORD,
    database: process.env.DB_LOGIN_DATABASE,
    port: process.env.MYSQL_PORT
});

/**
 * Retrieve all users from the database.
 * @param {Contains all results or error if query couldn't be executed.} callback 
 */
function getUserFromDB(username) {
    return new Promise(function (resolve, reject) {
        let result = [];
        // Get all users from the database and put them in array
        connectionLogin.query('SELECT * FROM accounts WHERE username = ?;', username, function (err, res) {
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
        connectionLogin.query('SELECT * FROM accounts WHERE username = ?;', request.session.username, function (err, res) {
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
 * Queries database for the logged in user. Checks if the passed mandate equals the user mandate. Also returns true if user mandate
 * is '*'. This means the user has access to all mandates.
 * @param {Needed mandate to access this function.} mandate 
 * @param {Request from the user, used for easy access to username.} request 
 */
function checkMandatePermissions(mandate, request) {
    return new Promise(function (resolve, reject) {
        let result = [];
        let allowed = false;

        // Query database for user
        connectionLogin.query('SELECT * FROM accounts WHERE username = ?;', request.session.username, function (err, res) {
            if (err) {
                return reject(err);
            } else {
                if (res.length) {
                    for (let i = 0; i < res.length; i++) {
                        result.push(res[i]);
                    }
                }

                userRoles = result[0].mandate.split('_');
                measureRoles = mandate.split('_');

                // Always allow admin access, don't need for loop for simple cases
                for (i = 0; i < userRoles.length; i++) {
                    for (j = 0; j < measureRoles.length; j++) {
                        // Remove semicolon, why is it even there?
                        if (measureRoles[j].includes(";")) {
                            measureRoles[j] = measureRoles[j].slice(0, measureRoles[j].length - 1);
                        }

                        // Just split for visibility
                        if (userRoles[i] === measureRoles[j] || userRoles[i] === '*') {
                            allowed = true;
                        }
                    }
                }
                resolve(allowed);
            }
        });
    });
}

// Need it to match the month string with it's corresponding number
const monthNumbers = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/**
 * Queries database for a complete measure, no sql injection prevention needed because tableName is taken from predefined list.
 * @param {Tablename that is to be queried from the database.} tableName 
 * @param {Month of the measure that we want the data of.} month
 * @param {Returns error if query fails.} callback 
 */
function getMeasureFromDB(tableName, month) {
    let query;

    // Check which query we have to build, 
    if (month.length > 1) {
        console.log('found daily measure: ' + month);
        console.log(monthNumbers.indexOf(month));

        let monthNumber = monthNumbers.indexOf(month);
        // Have to add a zero to match naming scheme in sql
        if (monthNumber <= 9) {
            monthNumber = '0' + monthNumber;
        }

        query = 'SELECT * FROM `' + tableName + '` where Tag like \'2020' + monthNumber + '%\';';
    } else {
        query = 'SELECT * FROM `' + tableName + '`;';
    } // TODO: error case, user selects no month with daily measure

    console.log(query);

    return new Promise(function (resolve, reject) {
        connectionData.query(query, function (err, res) {
            if (err) {
                return reject(err);
            } else {
                console.log(res);
                resolve(res);
            }
        });
    });
}

/**
 * Default query for measures database, currently used for inserting data into the database, full query has to be inserted here.
 * @param {Query hast to be passed here. (Maybe build query in this method.} query 
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
 * Deletes specified table from the database. No sql injection needed because tableName ist checked against a list.
 * @param {Table to be deleted.} tableName 
 * @param {Returns error if table couldn't be deleted.} callback 
 */
function deleteMeasureFromDB(tableName) {
    return new Promise(function (resolve, reject) {
        connectionData.query('DROP TABLE `' + tableName + '`', function (err) {
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
        if (request.body.password !== request.body.password2) {
            err = "pwSame";
            reject(err);
        } else if (pwCheck(request.body.password)) {
            // Hash insert password
            bcrypt.hash(request.body.password, saltRounds, function (err, hash) {
                if (!err) {
                    // Insert the user into database
                    const sql = 'INSERT INTO `accounts` (`username`, `password`, `email`,`role`,`mandate`) VALUES (?, ?, ?, ?, ?)';
                    connectionLogin.query(sql, [request.body.username, hash, request.body.mail, request.body.role, request.body.mandate], function (err) {
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
            reject(err);
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
        connectionLogin.query('DELETE FROM accounts where id = ?', id, function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

/**
 * Adds new column(s) to already existing table in database.
 * @param {All the tables to which to columns are supposed to be added.} tableData 
 * @param {New attributes (=columns) that we want to add to the previously passed tables.} attributeData 
 */
function addColumnToDB(tableData, attributeData) {
    return new Promise(function (resolve, reject) {
        // Replace whitespaces before insertion into database
        for (i = 0; i < attributeData.length; i++) {
            attributeData[i] = attributeData[i].replaceAll(' ', '_');
        }

        // Cycle through possible table names and add the attribute to them, needs to be modified 
        // with second loop if we later want to add multiple attributes at once
        for (i = 0; i < tableData.length; i++) {
            // Build query here because it doesn't work otherwise
            const query = 'ALTER TABLE ' + mysql.escapeId(tableData[i]) + ' ADD ' + mysql.escapeId(attributeData[0]) + ' FLOAT DEFAULT NULL;'
            // Query database with prebuilt query
            connectionData.query(query, function (err) {
                if (err) return reject(err);
            });
        }

        // Resolve if we got no errors before
        resolve();
    });
}


/**
 * Changes column name of specified table.
 * @param {Tables with column to be changed.} tableData 
 * @param {Old name of attribute (=column).} attributeDataOld 
 * @param {New name of column.} attributeData 
 */
function changeTableColumn(tableData, attributeDataOld, attributeData) {
    return new Promise(function (resolve, reject) {
        // Cycle through possible table names and add the attribute to them, needs to be modified 
        // with second loop if we later want to add multiple attributes at once
        for (i = 0; i < tableData.length; i++) {
            // Build query here because it doesn't work otherwise
            const query = 'ALTER TABLE ' + mysql.escapeId(tableData[i]) + ' CHANGE COLUMN ' + mysql.escapeId(attributeDataOld) + ' ' + mysql.escapeId(attributeData) +
                'FLOAT;';
            // Query database with prebuilt query
            connectionData.query(query, function (err) {
                if (err) return reject(err);
            });
        }
        resolve();
    });
}

/**
 * Delete column from already existing table.
 * @param {All the tables from which columns are supposed to be deleted.} tableData 
 * @param {Attributes (=columns) that are supposed to be deleted from the database.} attributeData 
 */
function deleteColumnFromDB(tableData, attributeData) {
    return new Promise(function (resolve, reject) {
        // Cycle through possible table names and add the attribute to them
        for (i = 0; i < tableData.length; i++) {
            // Build query here because it doesn't work otherwise
            const query = 'ALTER TABLE ' + mysql.escapeId(tableData[i]) + ' DROP ' + mysql.escapeId(attributeData) + ';'

            // Query database with prebuilt query
            connectionData.query(query, function (err) {
                if (err) return reject(err);
            });
        }
        resolve();
    });
}

/**
 * Creates new table from existing table for new year.
 * @param {Name of the table.} tableName 
 * @param {Already existing year in the database.} oldYear 
 * @param {New year to be created in database.} year 
 */
function copyTableWithNewYear(tableName, oldYear, year) {
    return new Promise(function (resolve, reject) {
        // Slice out unneeded information, create old name and new name
        let index = tableName.indexOf('~');
        tableName = tableName.slice(0, index) + '_' + oldYear;

        const tableNameNew = tableName.slice(0, index) + '_' + year;

        // Build query
        query = 'CREATE TABLE ' + mysql.escapeId(tableNameNew) + ' LIKE ' + mysql.escapeId(tableName) + ';';

        // Try to execute query
        connectionData.query(query, function (err) {
            if (err) return reject(err);
        });

        resolve();
    });
}

/**
 * Changes password of specified user in the database. Also checks if password is safe.
 * @param {User that wants to change his password.} username 
 * @param {New password for specified user.} password 
 */
function changeUserPassword(username, password) {
    return new Promise(function (resolve, reject) {
        // Check if password is a good password
        if (pwCheck(password)) {
            // Hash inserted password
            bcrypt.hash(password, saltRounds, function (err, hash) {
                if (err) {
                    reject(err);
                } else {
                    // Insert the user into database
                    const sql = 'UPDATE accounts SET password =' + mysql.escape(hash) + ' WHERE username =' + mysql.escape(username) + ';';
                    connectionLogin.query(sql, function (err) {
                        if (err) return reject(err);
                        resolve();
                    });
                }
            });
            // Return error if test failed
        } else {
            err = "pw";
            reject(err);
        }
    });
}

/**
 * Check if entered password is a safe password, used when a new user is created.
 * @param password Password which is to be checked.
 */
function pwCheck(password) {
    const schema = new passwordValidator();

    // List with forbidden passwords
    const dumbPasswords = ['Passw0rt', 'Passwort123', 'passwort', 'password', 'kennzahlen', 'Kennzahlen'];

    schema
        .is().min(8) // Minimum length 8
        .is().max(100) // Maximum length 100
        .has().uppercase() // Must have uppercase letters
        .has().lowercase() // Must have lowercase letters
        .has().digits() // Must have digits
        .has().not().spaces() // Should not have spaces
        .is().not().oneOf(dumbPasswords); // Blacklist these values

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

// Export functions so they can be used in importing module
module.exports = {
    checkRolePermissions: checkRolePermissions,
    checkMandatePermissions: checkMandatePermissions,
    getAllUsersFromDB: getAllUsersFromDB,
    getMeasureFromDB: getMeasureFromDB,
    measureDataRequest: measureDataRequest,
    deleteMeasureFromDB: deleteMeasureFromDB,
    insertUserIntoDB: insertUserIntoDB,
    deleteUserFromDB: deleteUserFromDB,
    getUserFromDB: getUserFromDB,
    addColumnToDB: addColumnToDB,
    deleteColumnFromDB: deleteColumnFromDB,
    changeTableColumn: changeTableColumn,
    changeUserPassword: changeUserPassword,
    copyTableWithNewYear: copyTableWithNewYear
}
