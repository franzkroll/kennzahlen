/**
 * Contains all the functions used in get routes.
 */

// Imports..
const IO = require('./io.js');
const SQL = require('./mysql.js');

/**
 * Display index page after logging in.
 * @param {Used for checking for a successful log in} request 
 * @param {Sends back index page to the user} response 
 */
const homeHelper = function (request, response) {
    // Make sure that the user is logged in
    if (request.session.loggedin) {
        // Show index page
        response.render('pages/index', {
            user: request.session.username
        });
        // Show error page if not
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Display page for loading data of measures. Loads list with tables and shows them to the user.
 * @param {Used for checking login status of the user.} request 
 * @param {Renders page back to the user.} response 
 */
const visualHelper = function (request, response) {
    // Check if user is logged in
    if (request.session.loggedin) {
        // Load file with tables and sent them to the client
        IO.loadTextFile('tables').then(function (measureList) {
            response.render('pages/visual', {
                user: request.session.username,
                measureData: '',
                loadedTable: '',
                text: '',
                lastSelected: '',
                measureListData: measureList
            });
            // Catch errors while loading from disk
        }).catch(function (error) {
            console.log(error);
        })
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Loads descriptions for measure in the system when the user calls the corresponding function from the index page.
 * @param {Used for checking login status of the user.} request 
 * @param {Renders page back to the user.} response 
 */
const loadHelpData = async (request, response) => {
    // Make it only accessible to logged in users
    if (request.session.loggedin) {
        // Load tables from disc and show them to the user with new page
        try {
            const measureList = await IO.loadTextFile('tables');
            const measureDescriptions = await IO.loadTextFile('desc');

            response.render('pages/measureHelp', {
                user: request.session.username,
                measureListData: measureList,
                measureDescriptions: measureDescriptions
            });
            // Log file errors
        } catch (error) {
            console.log(error);
        }
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Logs out user if a session exists.
 * @param {Used to check if a session exists.} request 
 * @param {Used for redirecting user to the home page.} response 
 */
const logoutHelper = function (request, response) {
    if (request.session) {
        // Log event in log file
        console.log("User '" + request.session.username + "' logged out.");
        // Try to destroy session element and redirect user to /
        request.session.destroy(function (err) {
            if (err) {
                console.log(error);
            } else {
                return response.redirect('/');
            }
        });
    }
}

/**
 * Loads all user from the database and sends them to the client
 * @param {Used for checking login status of the user.} request 
 * @param {Renders page back to the user.} response 
 */
const showUserHelper = function (request, response) {
    if (request.session.loggedin) {
        SQL.checkRolePermissions('admin', request).then(function (result) {
            if (result) {
                // Load user from database
                SQL.getAllUsersFromDB().then(function (result) {
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
                    console.log(error);
                });
                // Display error page if user had insufficient rights
            } else {
                response.render('pages/errors/adminError');
                console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
            }
            // Mysql errors are caught here.
        }).catch(function (error) {
            console.log(error);
        })
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Used in admin sections, shows measures to the admin. Admin has the possibility to delete measures.
 * @param {Used for checking login status.} request 
 * @param {Send back template page and user data.} response 
 */
const showHelper = function (request, response) {
    // Check if user is logged in
    if (request.session.loggedin) {
        // Load file with tables and check if logged in user is admin.
        IO.loadTextFile('tables').then(function (measureList) {
            SQL.checkRolePermissions('admin', request).then(function (result) {
                if (result) {
                    response.render('pages/admin/showMeasures', {
                        user: request.session.username,
                        measures: measureList,
                        text: ''
                    });
                } else {
                    response.render('pages/error/adminError');
                }
                // Log mysql errors here
            }).catch(function (error) {
                console.log(error);
            })
            // Log file IO errors here
        }).catch(function (error) {
            console.log(error);
        })
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Renders page for creating new users in the admin section.
 * @param {Used for login and role check.} request 
 * @param {Sends back error with success or failure message.} response 
 */
const createUser = function (request, response) {
    // Check if user is logged in and is admin
    if (request.session.loggedin) {
        SQL.checkRolePermissions('admin', request).then(function (result) {
            if (result) {
                response.render('pages/admin/createUser', {
                    user: request.session.username
                });
            } else {
                response.render('pages/errors/adminError');
                console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
            }
            // SQL errors are printed here
        }).catch(function (error) {
            console.log(error);
        });
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Loads help section that explains section of the program. Admin sees more info than a normal user.
 * @param {Used for login and role check.} request 
 * @param {Sends back correct help page for the user.} response 
 */
const helpFunction = async (request, response) => {
    if (request.session.loggedin) {
        SQL.checkRolePermissions('admin', request).then(function (result) {
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

/**
 * Loads table data, sends it to the client. There all elements are created for submitting new data.
 * @param {Used for login and role check.} request 
 * @param {Sends back submit page with table info.} response 
 */
const submitHelper = async (request, response) => {
    let entryList;
    try {
        entryList = await IO.loadTextFile('entries');
    } catch (error) {
        console.log(error);
    }

    if (request.session.loggedin) {
        IO.loadTextFile('tables').then(function (measureList) {
            response.render('pages/submit', {
                user: request.session.username,
                text: '',
                measure: '',
                lastYear: '',
                entries: entryList,
                lastMonth: '',
                measureListData: measureList
            });
            // Catch file IO errors
        }).catch(function (error) {
            console.log(error);
        })
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Renders page for creating new measures to the user.
 * @param {Used for login and role check.} request 
 * @param {Sends back createUser page.} response 
 */
const createHelper = function (request, response) {
    // Check if user is logged in and has rights to create new measures
    if (request.session.loggedin) {
        SQL.checkRolePermissions('user', request).then(function (result) {
            if (result) {
                response.render('pages/createMeasure', {
                    user: request.session.username,
                    text: ''
                });
            } else {
                response.render('pages/errors/adminError')
            }
            // Catch sql errors here and print them
        }).catch(function (error) {
            console.log(error);
        })
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Renders admin index page to the client.
 * @param {Used for login and role check.} request 
 * @param {Sends back createUser page.} response 
 */
const adminHelper = function (request, response) {
    // Check if user is logged in and is admin
    if (request.session.loggedin) {
        SQL.checkRolePermissions('admin', request).then(function (result) {
            if (result) {
                response.render('pages/admin/admin', {
                    user: request.session.username,
                    text: ""
                });
            } else {
                response.render('pages/errors/adminError');
                console.log(request.session.username + " tried accessing admin functionalities. Denying access.");
            }
            // Print sql errors here
        }).catch(function (error) {
            console.log(error);
        })
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Loads list of measures and sends it to the user, together with reportCreator page. User can select 
 * values and create a report with the selected data.
 * @param {Received request, just used for checking if a user is logged in.} request 
 * @param {Contains new page with needed data, username and list of measures.} response 
 */
const reportHelper = function (request, response) {
    if (request.session.loggedin) {
        // Load list with measures and send it to the user
        IO.loadTextFile('tables').then(function (measureList) {
            response.render('pages/reportCreator', {
                user: request.session.username,
                text: "",
                measureList: measureList
            }); // Catch errors while loading from disk
        }).catch(function (error) {
            console.log(error);
        });
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * Loads page for changing a measure, which means adding an attribute to an existing measure.
 * @param {Request from the user, used for checking if user is logged in.} request 
 * @param {Response sent back, renders new page with measure data.} response 
 */
const changeHelper = function (request, response) {
    if (request.session.loggedin) {
        IO.loadTextFile('tables').then(function (measureList) {
            response.render('pages/changeMeasure', {
                user: request.session.username,
                text: "",
                measureList: measureList
            }); // Catch errors while loading from disk
        }).catch(function (error) {
            console.log(error);
        });
    }
}

// Export all functions
module.exports = {
    homeHelper: homeHelper,
    visualHelper: visualHelper,
    loadHelpData: loadHelpData,
    logoutHelper: logoutHelper,
    showHelper: showHelper,
    showUserHelper: showUserHelper,
    createUser: createUser,
    helpFunction: helpFunction,
    submitHelper: submitHelper,
    createHelper: createHelper,
    adminHelper: adminHelper,
    helpFunction: helpFunction,
    reportHelper: reportHelper,
    changeHelper: changeHelper
}