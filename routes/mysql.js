/**
 * Contains all mysql functions
 */

//Imports 
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const passwordValidator = require('password-validator');

// Salt rounds for password encryption
const saltRounds = 10;

// Create SQL-Connection for accessing measure data
const connectionData = mysql.createConnection({
    host: 'localhost',
    user: 'dbaccessData',
    password: 'N&HQkzW]WF2bBA*k',
    database: 'measures'
});

// Create SQL-Connection for accessing user data
const connectionLogin = mysql.createConnection({
    host: 'localhost',
    user: 'dbaccess',
    password: 'Pdgy#MW$Jud6F$_B',
    database: 'nodelogin'
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
 * Queries database for a complete measure, no sql injection prevention needed because tableName is taken from predefined list.
 * @param {Tablename that is to be queried from the database.} tableName 
 * @param {Returns error if query fails.} callback 
 */
function getMeasureFromDB(tableName) {
    return new Promise(function (resolve, reject) {
        connectionData.query('SELECT * FROM `' + tableName + '`;', function (err, res) {
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
        console.log(request.body.password + ':' + request.body.password2);
        if (request.body.password !== request.body.password2) {
            err = "pwSame";
            console.log('passwords are not the same');
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
            console.log("password check failed");
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
 * Replaces all occurrences of search with replacement in the string that it was called from.
 */
String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


/**
 * Check if entered password is a safe password, used when a new user is created.
 * @param {Password to be checked.} password 
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

// Export functions so they can be used elsewhere
module.exports = {
    checkRolePermissions: checkRolePermissions,
    getAllUsersFromDB: getAllUsersFromDB,
    getMeasureFromDB: getMeasureFromDB,
    measureDataRequest: measureDataRequest,
    deleteMeasureFromDB: deleteMeasureFromDB,
    insertUserIntoDB: insertUserIntoDB,
    deleteUserFromDB: deleteUserFromDB,
    getUserFromDB: getUserFromDB,
    addColumnToDB: addColumnToDB
}