const measureArray = measureListData.split(';');
const table = document.getElementById("dataTable");


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


String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};



selM.onchange = function () {
    const data = measureData;
    const columns = data.split(',');

    var index = this.selectedIndex;
    var inputText = this.children[index].innerHTML.trim();
    let filled = false;
    for (i = 0; i < measureArray.length; i++) {
        const measure = measureArray[i].split(',').filter(Boolean);
        if (!filled) {
            for (j = 0; j < measure.length - 1; j++) {
                if (measure[j] === inputText) {
                    selAttr.innerHTML = "";
                    filled = true;
                    for (var i = table.rows.length - 1; i > 0; i--) {
                        table.deleteRow(i);
                    }
                    console.log("deleting");
                }

                let row = table.insertRow(j + 1);


                if (j < measure.length - 2) {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(measure[j + 1]));
                    opt.value = measure[j + 1];
                    selAttr.appendChild(opt);

                    let cell = row.insertCell(0);
                    cell.innerHTML = measure[j + 1];

                    var columnCount = measure.length - 1;

                    for (k = j + 1; k < columns.length; k += columnCount) {
                        let cell = row.insertCell(0);
                        cell.innerHTML = columns[k].split(':')[1].match(/\d+/)[0];
                    }
                }
            }
        }
    }
}