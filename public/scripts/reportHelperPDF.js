var pdfmake = require('pdfmake');

var docDefinition = {
    content: [
        'Check out our nice column example:\n', // first this line
        {
            alignment: 'justify', // then two justified columns of text
            columns: [{
                    text: 'Some cool text for first column goes here.'
                },
                {
                    text: 'Some cool text for second column goes here.'
                }
            ]
        }
    ]
};

var pdf = pdfmake.createPdf(docDefinition).dow;

console.log(new Date() - now);