/**
 * Contains all the functions used in get routes.
 */

// TODO: comments

// Imports..
const IO = require('./io.js');
const SQL = require('./mysql.js');

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const homeHelper = function (request, response) {
    if (request.session.loggedin) {
        response.setHeader('Content-Type', 'text/html');
        response.render('pages/index', {
            user: request.session.username
        });
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const visualHelper = function (request, response) {
    if (request.session.loggedin) {
        IO.loadTextFile('tables').then(function (measureList) {
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

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const loadHelpData = async (request, response) => {
    try {
        const measureList = await IO.loadTextFile('tables');
        const measureDescriptions = await IO.loadTextFile('desc');

        response.render('pages/measureHelp', {
            user: request.session.username,
            measureListData: measureList,
            measureDescriptions: measureDescriptions
        });
    } catch (error) {
        console.log(error);
    }
}

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
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

/**
 * 
 * @param {*} request 
 * @param {*} response 
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

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const showHelper = function (request, response) {
    IO.loadTextFile('tables').then(function (measureList) {
        if (request.session.loggedin) {
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
            }).catch(function (error) {
                console.log(error);
            })
        }
    }).catch(function (error) {
        console.log(error);
    })
}

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const createUser = function (request, response) {
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
        }).catch(function (error) {
            console.log(error);
        });
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * 
 * @param {*} request 
 * @param {*} response 
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
 * 
 * @param {*} request 
 * @param {*} response 
 */
const submitHelper = function (request, response) {
    if (request.session.loggedin) {
        IO.loadTextFile('tables').then(function (measureList) {
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

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const createHelper = function (request, response) {
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
        }).catch(function (error) {
            console.log(error);
        })
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const adminHelper = function (request, response) {
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
        }).catch(function (error) {
            console.log(error);
        })
    } else {
        response.render('pages/errors/loginError');
    }
}

/**
 * 
 * @param {*} request 
 * @param {*} response 
 */
const statHelper = function (request, response) {
    if (request.session.loggedin) {
        SQL.checkRolePermissions('admin', request).then(function (result) {
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
    statHelper: statHelper,
    helpFunction: helpFunction
}