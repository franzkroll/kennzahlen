const measureArray = measureListData.split(';');
const table = document.getElementById("dataTable");

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

let dataGraph = [];
let measureAttr = [];

selM.onclick = function () {
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
                    filled = true;
                    for (var i = table.rows.length - 1; i > 0; i--) {
                        table.deleteRow(i);
                    }
                    years = measure[j + 1].split(':');

                    selYear.innerHTML = "";

                    for (k = 0; k < years.length; k++) {
                        let opt = document.createElement('option');
                        opt.appendChild(document.createTextNode(years[k]));
                        opt.value = years[k];
                        selYear.appendChild(opt);
                    }
                }

                let row = table.insertRow(j + 1);

                if (j < measure.length - 3) {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(measure[j + 1]));
                    opt.value = measure[j + 1];
                    measureAttr.push(measure[j + 2]);

                    if (data) {
                        let cell = row.insertCell(-1);
                        cell.innerHTML = measure[j + 2];

                        var columnCount = measure.length - 2;

                        // Save data for graphs
                        let dataBuilder = [];
                        for (k = j + 1; k < columns.length; k += columnCount) {
                            let cell = row.insertCell(-1);
                            cell.innerHTML = columns[k].split(':')[1].match(/\d+/)[0];
                            if (k != j + 1) {
                                dataBuilder.push(columns[k].split(':')[1].match(/\d+/)[0]);
                            }
                        }
                        dataGraph.push(dataBuilder);
                    }
                }
            }
        }
    }
}

/* Graph stuff here */
let currentChart;



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