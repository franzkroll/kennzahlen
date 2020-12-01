/**
 * Handles all routing. Takes all possible route arguments and passes them to the corresponding handlers 
 * in get.js and post.js. Also handles status-monitor under /status.
 */

module.exports = function (app) {
    require('dotenv').config();

    // Set baseurl
    const base = process.env.BASEURL;

    // Import statusMonitor
    const statusMonitor = require('express-status-monitor')({ path: base + '/status', socketPath: base + '/socket.io' });

    // Load in helper functions, which contain the functions for the routes
    const PostHelpers = require('./post.js');
    const GetHelpers = require('./get.js');

    // Shows stats page
    app.use(statusMonitor);
    app.get(base + '/status', statusMonitor);

    /**
     * 
     * GET ROUTES
     * 
     */
    // redirect to baseurl or render login page
    app.get('/', function (request, response) {
        if (base) {
            response.redirect(base + '/')
        } else {
            response.render('pages/login');
        };
    });

    // Render login page when user first accesses the application
    app.get(base + '/', function (request, response) {
        response.render('pages/login');
    });

    // Display simple About Page
    app.get(base + '/about', function (request, response) {
        if (request.session.loggedin) {
            response.render('pages/about', {
                user: request.session.username
            });
        } else {
            response.render('pages/errors/loginError');
        }
    });

    // Render index selection page
    app.get(base + '/home', GetHelpers.homeHelper);

    // Display user creation page
    app.get(base + '/createUser', GetHelpers.createUser);

    // Displays information about measures in the system and their attributes
    app.get(base + '/measureHelp', GetHelpers.loadHelpData);

    // Loads simple help page
    app.get(base + '/help', GetHelpers.helpFunction);

    // Display visualization of data
    app.get(base + '/visual', GetHelpers.visualHelper);

    // Display menu for entering data
    app.get(base + '/submit', GetHelpers.submitHelper);

    // Display menu for creating new key figures
    app.get(base + '/createMeasure', GetHelpers.createHelper);

    // Displays admin index page
    app.get(base + '/admin', GetHelpers.adminHelper);

    // Display user creation page
    app.get(base + '/showUser', GetHelpers.showUserHelper);

    // Load measures and send them to the user, delete is handled in post
    app.get(base + '/showMeasures', GetHelpers.showHelper);

    // Logout user and delete the session object
    app.get(base + '/logout', GetHelpers.logoutHelper);

    // So every user can change his password individually
    app.get(base + '/changePassword', GetHelpers.changePasswordHelper);

    // Display measure and options to add a new attribute to them
    app.get(base + '/changeMeasure', GetHelpers.changeHelper);

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
    app.post(base + '/auth', PostHelpers.authHelper);

    // Post action for creating a user, renders admin index after creating and storing user in the database, displays error if that failed
    app.post(base + '/createUser', PostHelpers.createUserHelper);

    // Post action for deleting a user, if user exists he is deleted from the database
    app.post(base + '/deleteUser', PostHelpers.deleteUserHelper);

    // Post action for deleting a measure
    app.post(base + '/deleteMeasure', PostHelpers.deleteHelper);

    // Loads request data from database and renders it with a new visual page 
    app.post(base + '/visual', PostHelpers.visualPostHelper);

    // Get submitted data from user and put it into the database for the corresponding measure
    app.post(base + '/submit', PostHelpers.submitDataHelper);

    // Handles submitted data when user created a new measure, writes info into local files and creates table
    app.post(base + '/createMeasure', PostHelpers.createMeasureHelper);

    // Handles insertion of new attribute into existing measure
    app.post(base + '/addAttr', PostHelpers.addAttributeHelper);

    // Handles deletion of existing attribute from existing measure
    app.post(base + '/deleteAttr', PostHelpers.deleteAttributeHelper);

    // Handles changing of existing attribute from existing measure
    app.post(base + '/changeAttr', PostHelpers.changeAttributeHelper);

    // Handles adding of a new year to a measure
    app.post(base + '/addYear', PostHelpers.addYearHelper);

    // Handles insertion of new password
    app.post(base + '/changePassword', PostHelpers.changePasswordHelper);
}