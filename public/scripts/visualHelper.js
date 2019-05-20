const measureArray = measureListData.split(';');
const table = document.getElementById("dataTable");

let currentChart;

const tName = loadedTableName;

var selGraph = document.getElementById('graph');
var selM = document.getElementById('measure');

var selYear = document.getElementById('year');

// Format measure array and add to select
for (i = 0; i < measureArray.length - 1; i++) {
    const measure = measureArray[i].split(',').filter(Boolean);
    let opt = document.createElement('option');
    opt.appendChild(document.createTextNode(measure[0]));
    opt.value = measure[0];
    selM.appendChild(opt);
}

// Saves for display in graph
let dataGraph = [];
// Saves attributes of the current measure
let measureAttr = [];

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// TODO: better way, to many loop
selM.onclick = function () {
    // Get parsed name of table
    const tableName = tName.slice(5, tName.length - 5).replaceAll('_', ' ');
    const columns = measureData.split(',');

    var index = this.selectedIndex;
    var inputText = this.children[index].innerHTML.trim();

    // True if table has already been filled
    let filled = false;

    // Loop through received array data
    for (i = 0; i < measureArray.length; i++) {
        // Split actual data of the measure 
        const measure = measureArray[i].split(',').filter(Boolean);
        // Only fill table if it hasn't been filled before
        if (!filled) {
            for (j = 0; j < measure.length - 1; j++) {
                // If measure is found clear table and prepare select for new data
                if (measure[j] === inputText) {
                    filled = true;

                    // Clear chart if changed to an item without data
                    if (currentChart) {
                        currentChart.destroy();
                    }

                    //Clear rows of the table except the first row
                    for (var i = table.rows.length - 1; i > 0; i--) {
                        table.deleteRow(i);
                    }

                    // Clear selection of the years
                    selYear.innerHTML = "";

                    // Split years here for year table
                    years = measure[j + 1].split(':');

                    // Put years into the select menu for tables
                    for (k = 0; k < years.length; k++) {
                        let opt = document.createElement('option');
                        opt.value = years[k];
                        opt.appendChild(document.createTextNode(years[k]));
                        selYear.appendChild(opt);
                    }
                }

                // Prepare new table row for data
                let row = table.insertRow(j + 1);

                // Precaution so we don't leave the array length later on
                if (j < measure.length - 3) {
                    // Filter 
                    let opt = document.createElement('option');
                    opt.value = measure[j + 1];
                    opt.appendChild(document.createTextNode(measure[j + 1]));
                    // Save attributes of measure, location of them starts in the third array cell
                    measureAttr.push(measure[j + 2]);

                    // Append data to table if there is any to add and if we got the right data already
                    if (measureData && (inputText === tableName)) {
                        // Fill first column of the table with the attributes of the measure
                        let cell = row.insertCell(-1);
                        cell.innerHTML = measure[j + 2];

                        // Counts data columns
                        var columnCount = measure.length - 2;

                        // Saves data for graphs
                        let dataBuilder = [];
                        for (k = j + 1; k < columns.length; k += columnCount) {
                            // Remove everything from data that isn't a number
                            let cellData = columns[k].split(':')[1].match(/\d+/)[0];

                            // Fill correct table cell with data
                            let cell = row.insertCell(-1);
                            cell.innerHTML = cellData;
                            if (k != j + 1) {
                                dataBuilder.push(cellData);
                            }
                        }

                        // Push data to array for graphs
                        dataGraph.push(dataBuilder);
                    }
                }
            }
        }
    }
}

/* Graph stuff here */
selGraph.onchange = function (e) {
    let svalue = this.options[this.selectedIndex].value;

    if (currentChart) {
        currentChart.destroy();
    }

    for (i = 0; i < dataGraph.length; i++) {
        console.log(dataGraph[i]);
    }

    if (svalue === "bar") {
        currentChart = new Chart(document.getElementById("chart"), {
            type: 'bar',
            data: {
                labels: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
                datasets: [{
                    data: dataGraph[0],
                    label: measureAttr[0],
                    backgroundColor: "#3e95cd",
                    fill: false
                }, {
                    data: dataGraph[1],
                    label: measureAttr[1],
                    backgroundColor: "#8e5ea2",
                    fill: false
                }, {
                    data: dataGraph[2],
                    label: measureAttr[2],
                    backgroundColor: "#3cba9f",
                    fill: false
                }]
            },
            options: {
                title: {
                    display: true,
                }
            }
        });
    } else if (svalue === "line") {
        currentChart = new Chart(document.getElementById("chart"), {
            type: 'line',
            data: {
                labels: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
                datasets: [{
                    data: dataGraph[0],
                    label: measureAttr[0],
                    borderColor: "#3e95cd",
                    fill: false
                }, {
                    data: dataGraph[1],
                    label: measureAttr[1],
                    borderColor: "#8e5ea2",
                    fill: false
                }, {
                    data: dataGraph[2],
                    label: measureAttr[2],
                    borderColor: "#3cba9f",
                    fill: false
                }]
            },
            options: {
                title: {
                    display: true,
                }
            }
        });
    }
    // TODO: needs to loop through, but how?
}