const measureArray = measureListData.split(';');

var selM = document.getElementById('measure');
var selAttr = document.getElementById('attr');

for (i = 0; i < measureArray.length; i++) {
    const measure = measureArray[i].split(',').filter(Boolean);
    for (j = 0; j < measure.length; j++) {
        if (j === 0) {
            let opt = document.createElement('option');
            opt.appendChild(document.createTextNode(measure[0]));
            opt.value = measure[0];
            selM.appendChild(opt);
        }
    }
}

selM.onchange = function () {
    var index = this.selectedIndex;
    var inputText = this.children[index].innerHTML.trim();
    let filled = false;
    for (i = 0; i < measureArray.length; i++) {
        const measure = measureArray[i].split(',').filter(Boolean);
        if (!filled) {
            for (j = 0; j < measure.length - 2; j++) {
                if (measure[j] === inputText) {
                    selAttr.innerHTML = "";
                    filled = true;
                }
                let opt = document.createElement('option');
                opt.appendChild(document.createTextNode(measure[j + 1]));
                opt.value = measure[j + 1];
                selAttr.appendChild(opt);
            }
        }
    }
}


// Displays or removes table
function showTable() {
    var x = document.getElementById("table");
    if (x.style.display === "none") {
        x.style.display = "block";
        showTable();
    } else {
        x.style.display = "none";
    }
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

//TODO: add measure selection, split received data into tables and save them individually
// TODO: pass data to chart.js
function showTable() {
    const data = measureData.slice(2, measureData.length - 2).split(':');

    const measure = measureData.slice(2, measureData.length - 2).split('},{');
    const table = document.getElementById("dataTable");
    let rowCount = 1;

    const columnCount = measure[0].split(':').length - 1;

    for (j = 0; j < columnCount; j++) {
        let row = table.insertRow(rowCount);
        let name = data.slice(0, columnCount)[j].split(',')[1];
        rowCount++;

        if (name != undefined) {
            let cell = row.insertCell(0);
            cell.innerHTML = name.slice(1, name.length - 1).replaceAll('_', ' ');

            for (i = j; i < data.length; i += columnCount) {
                let cell = row.insertCell(-1);
                cell.innerHTML = data[i].split(',')[0].replace('}', '');
            }
        }
    }
}