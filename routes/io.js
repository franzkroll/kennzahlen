/**
 * Handles writing to disk and reading from disk. 
 */

// Import
const fs = require('fs-extra');

/**
 * Loads tables from disk txt file and converts them to an array.
 * @param {Tablename that is to be loaded, currently desc, tables or roles.} name 
 * @param {Return retrieved data from disk as array.} callback 
 */
function loadTextFile(name) {
    return new Promise(function (resolve, reject) {
        let array = [];
        let text;
        const path = './files/' + name + '.txt';

        // Try to read file from page into text string
        try {
            fs.ensureFileSync(path)

            text = fs.readFileSync(path).toString('utf-8');
            // Split at line breaks and put it into array
            if (text != '') {
                const textByLine = text.split("\n")
                for (i = 0; i < textByLine.length; i++) {
                    array.push(textByLine[i].split(','));
                }
            }
            resolve(array);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Loads txt file from disk and converts it to an array. Convert to promise? But not really necessary, we don't 
 * really care if it takes longer to write the data onto the disk.
 * @param {Data to be loaded from disk. Currently desc, table or roles.} name 
 * @param {Array with the data that is returned.} array 
 */
const arrayToTxt = function (name, array) {
    // Try to write array to disk, overwrites existing file
    try {
        const path = 'files/' + name + '.txt';

        // Make sure the file exists
        fs.ensureFileSync(path)

        let file = fs.createWriteStream(path);

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
    } catch (error) {
        console.log(error);
    }
}

/**
 * Replaces all occurrences of substring in a string with another substring, makes it easier than writing Regular expressions.
 */
String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// Export function so they can be used elsewhere
module.exports = {
    loadTextFile: loadTextFile,
    arrayToTxt: arrayToTxt,
}