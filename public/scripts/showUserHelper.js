// Get elements from the document
var sel = document.getElementById('userDelete');
const table = document.getElementById("userTable");
// Basic table attributes
const columns = 5;
let rowCount = 1;
let cellCount = 0;
// Contains sql data that was loaded in the server and sent to the view
const arRes = result.split(':');

// Loop through the data string and create a new row every 4 entries (size of a user entry)
for (i = 0; i < arRes.length - 1; i += columns) {
    let row = table.insertRow(rowCount);
    rowCount++;

    // Loop through single user data and add corresponding cells to the table
    for (j = 0; j < columns; j++) {
        let cell = row.insertCell(j);
        cell.innerHTML = arRes[i + j];
    }

    // Fill the select with user IDs for the user deletion section
    var opt = document.createElement('option');
    opt.appendChild(document.createTextNode('ID ' + arRes[i]));
    opt.value = arRes[i];
    sel.appendChild(opt);
}