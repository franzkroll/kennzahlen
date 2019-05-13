// TODO: move to different file
var sel = document.getElementById('userDelete');
const table = document.getElementById("userTable");
const arRes = result.split(':');
const columns = 4;
let rowCount = 1;
let cellCount = 0;

for (i = 0; i < arRes.length - 1; i += columns) {
    let row = table.insertRow(rowCount);
    rowCount++;
    for (j = 0; j < columns; j++) {
        let cell = row.insertCell(j);
        cell.innerHTML = arRes[i + j];
    }

    //fill select
    var opt = document.createElement('option');
    opt.appendChild(document.createTextNode('ID ' + arRes[i]));
    opt.value = arRes[i];
    sel.appendChild(opt);
}