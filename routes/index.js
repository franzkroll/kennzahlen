/**
 * Handles all routing. Takes all possible route arguments and passes them to the corresponding handlers 
 * in get.js and post.js. Also handles status-monitor under /status.
 */

module.exports = function (app) {
    // Import
    const statusMonitor = require('express-status-monitor')();

    // Load in helper functions, which contain the functions for the routes
    const PostHelpers = require('./post.js');
    const GetHelpers = require('./get.js');

    // Shows stats page
    app.use(statusMonitor);
    app.get('/status', statusMonitor);

    /**
     * 
     * GET ROUTES
     * 
     */

    // Render login page when user first accesses the application
    app.get('/', function (request, response) {
        response.render('pages/login');
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

    // Render index selection page
    app.get('/home', GetHelpers.homeHelper);

    // Display user creation page
    app.get('/createUser', GetHelpers.createUser);

    // Displays information about measures in the system and their attributes
    app.get('/measureHelp', GetHelpers.loadHelpData);

    // Loads simple help page
    app.get('/help', GetHelpers.helpFunction);

    // Display visualization of data
    app.get('/visual', GetHelpers.visualHelper);

    // Display menu for entering data
    app.get('/submit', GetHelpers.submitHelper);

    // Display menu for creating new key figures
    app.get('/createMeasure', GetHelpers.createHelper);

    // Displays admin index page
    app.get('/admin', GetHelpers.adminHelper);

    // Display user creation page
    app.get('/showUser', GetHelpers.showUserHelper);

    // Load measures and send them to the user, delete is handled in post
    app.get('/showMeasures', GetHelpers.showHelper);

    // Logout user and delete the session object
    app.get('/logout', GetHelpers.logoutHelper);

    // So every user can change his password individually
    app.get('/changePassword', GetHelpers.changePasswordHelper);

    // Display measure and options to add a new attribute to them
    app.get('/changeMeasure', GetHelpers.changeHelper);

    // Return error message if requested page doesn't exist
    app.get('*', function (request, response) {
        response.render('pages/errors/error404');
    });

    /**
     * 
     * POST ROUTES
     * 
     */

    // Queries database with login data, returns homepage if login data is correct, returns error message otherwise
    app.post('/auth', PostHelpers.authHelper);

    // Post action for creating a user, renders admin index after creating and storing user in the database, displays error if that failed
    app.post('/createUser', PostHelpers.createUserHelper);

    // Post action for deleting a user, if user exists he is deleted from the database
    app.post('/deleteUser', PostHelpers.deleteUserHelper);

    // Post action for deleting a measure
    app.post('/deleteMeasure', PostHelpers.deleteHelper);

    // Loads request data from database and renders it with a new visual page 
    app.post('/visual', PostHelpers.visualPostHelper);

    // Get submitted data from user and put it into the database for the corresponding measure
    app.post('/submit', PostHelpers.submitDataHelper);

    // Handles submitted data when user created a new measure, writes info into local files and creates table
    app.post('/createMeasure', PostHelpers.createMeasureHelper);

    // Handles insertion of new attribute into existing measure
    app.post('/addAttr', PostHelpers.addAttributeHelper);

    // Handles deletion of existing attribute from existing measure
    app.post('/deleteAttr', PostHelpers.deleteAttributeHelper);

    // Handles changing of existing attribute from existing measure
    app.post('/changeAttr', PostHelpers.changeAttributeHelper);

    // Handles insertion of new password
    app.post('/changePassword', PostHelpers.changePasswordHelper);
}