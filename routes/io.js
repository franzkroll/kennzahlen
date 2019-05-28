// Imports
const fs = require('fs');

/**
 * Loads tables from disk txt file and converts them to an array.
 * @param {Tablename that is to be loaded, currently desc, tables or roles.} name 
 * @param {Return retrieved data from disk as array.} callback 
 */
function loadTextFile(name) {
    return new Promise(function (resolve, reject) {
        console.log(name);
        let array = [];
        let text;
        // Read file from page into text string
        try {
            text = fs.readFileSync('./' + name + '.txt').toString('utf-8');
            // Split at line breaks and put it into array
            if (text != '') {
                const textByLine = text.split("\n")
                for (i = 0; i < textByLine.length; i++) {
                    array.push(textByLine[i].split(','));
                }
            }
            resolve(array);
        } catch (error) {
            reject(err);
        }
    });
}

/**
 * Loads txt file from disk and converts it to an array. Convert to promise? But not really necessary
 * @param {Data to be loaded from disk. Currently desc, table or roles.} name 
 * @param {Array with the data that is returned.} array 
 */
const arrayToTxt = function (name, array) {
    // Open file stream
    let file = fs.createWriteStream(name + '.txt');

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
    console.log('Wrote to file');
}

// Export function so they can be used elsewhere
module.exports = {
    loadTextFile: loadTextFile,
    arrayToTxt: arrayToTxt
}