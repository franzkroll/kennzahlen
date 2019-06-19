// Imports
const fs = require('fs-extra');
const pdf = require('pdfkit');

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
            console.log('Read from file.');
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
        console.log('Wrote to file');
    } catch (error) {
        console.log(error);
    }
}

/**
 * TODO: Finish pdf creation
 * Generates a PDF from previously queried data from the database. PDF contains the specified measures 
 * with table and specified graph type. PDF gets saved in files folder.
 * @param {Data contains all data cells from the database} data
 * @param {Graph types in order for the different measures.} graphTypes 
 */
function generatePDF(measures, data, response) {
    console.log(data);
    return new Promise(function (resolve, reject) {
        try {
            console.log(data.length);

            // Create new document and save it to standard path
            const doc = new pdf({
                compress: false
            });
            doc.pipe(fs.createWriteStream('./files/Report.pdf'));
            doc.pipe(response)


            // Insert measure name for each measure
            for (i = 0; i < measures.length; i++) {
                doc.text(measures[i]);
                doc.moveDown();
            }

            // Add data to pdf here from every graph
            for (i = 0; i < data.length; i++) {
                // TODO: Format table correctly
                /*doc.text(data[i][1]);
                console.log(data[i].length);*/
            }

            // TODO: somehow generate graphs

            // Finalize the pdf and end the stream
            doc.end();
            // Catch errors that occur while creating the document
        } catch (error) {
            reject(error);
        }
        // Resolve if nothing went wrong
        resolve();
    });
}

String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// Export function so they can be used elsewhere
module.exports = {
    loadTextFile: loadTextFile,
    arrayToTxt: arrayToTxt,
    generatePDF: generatePDF
}