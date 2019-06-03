// Split data that was received into an array
const measureArray = measureListData.split(';');

// Get needed elements from html page
const table = document.getElementById("dataTable");
const selGraph = document.getElementById('graph');
const selM = document.getElementById('measure');
const selYear = document.getElementById('year');
const months = ['Eigenschaft der Kennzahl', 'Jahr', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// Labels for the graph, needs months, quarters or years
let labels = [];

// Saves current chart so we can destroy it before creating a new one
let currentChart;

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

// Replace all because js doesn't have it
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

//TODO: correct display for yearly and quarterly measures

// Handle filling of table and graph data when new measure is selected 
selM.onclick = function () {
    // Get parsed name of table
    const tableName = loadedTableName.slice(4, loadedTableName.length - 5).replaceAll('_', ' ');

    const columns = measureData.split(',');

    // Get selected measure
    var index = this.selectedIndex;
    var inputText = this.children[index].innerHTML.trim();

    // True if table has already been filled
    let filled = false;

    // 
    let insertedHead = false;

    let monthHead = false;

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

                    // Clear data for graphs and saved attributes
                    measureAttr = [];
                    dataGraph = [];

                    // Clear selection of the years
                    selYear.innerHTML = "";
                    table.innerHTML = "";

                    // Split years here for year table, only if it isn't yearly or quarterly measure
                    years = measure[j + 1].trim().split(':');

                    // Test if years are really years or if it is a quarterly or yearly measure, TODO: check for quarterly
                    if (/^\d+$/.test(years[0])) {
                        monthHead = true;
                        // Put years into the select menu for tables
                        for (k = 0; k < years.length; k++) {
                            let opt = document.createElement('option');
                            opt.value = years[k];
                            opt.appendChild(document.createTextNode(years[k]));
                            selYear.appendChild(opt);
                        }
                    } else if (years[0] !== 'yearly') {
                        // Add first row of years here
                        let opt = document.createElement('option');
                        opt.value = years[0];
                        opt.appendChild(document.createTextNode(years[0]));
                        selYear.appendChild(opt);
                    } else if (year[0] !== 'quarterly') {
                        console.log("Yearly measure");
                        // Add first row of years here
                        let opt = document.createElement('option');
                        opt.value = years[0];
                        opt.appendChild(document.createTextNode('jährliche Erfassung'));
                        selYear.appendChild(opt);
                        // TODO: add table head from years of the measure
                    }

                    // Insert table header, needs month and years of data also, maybe move down, TODO: correct table and labels for yearly and quarterly measures
                    if (measureData && !insertedHead && monthHead) {
                        labels = months.slice(2, months.length);

                        let header = table.createTHead();
                        let row = header.insertRow(0);

                        insertedHead = true;

                        for (l = 0; l < months.length; l++) {
                            let cell = row.insertCell(l);
                            cell.outerHTML = "<th>" + months[l] + "</th>";
                        }
                    }
                }

                // Precaution so we don't leave the array length later on
                if (insertedHead && (j < measure.length - 3)) {
                    // Prepare new table rows for data
                    let row = table.insertRow(j + 1);

                    let opt = document.createElement('option');
                    opt.value = measure[j + 1];
                    opt.appendChild(document.createTextNode(measure[j + 1]));

                    // Save attributes of measure, location of them starts in the third array cell
                    measureAttr.push(measure[j + 2]);

                    // Append data to table if there is any to add and if we got the right data already
                    if ((inputText === (tableName.replace(/[0-9]/g, '')))) {
                        // Fill first column of the table with the attributes of the measure
                        let cell = row.insertCell(-1);
                        cell.innerHTML = measure[j + 2];

                        // Counts data columns
                        var columnCount = measure.length - 2;

                        // Saves data for graphs
                        let dataBuilder = [];
                        for (k = j + 1; k < columns.length; k += columnCount) {
                            // Remove everything from data that isn't a number or decimal point
                            let cellData = columns[k].split(':')[1].replace(/[^0-9.]/g, '');

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

// Listener for graph select, dynamically creates charts
selGraph.onchange = function (e) {
    let svalue = this.options[this.selectedIndex].value;

    // Destroy current chart before creating a new one, if we don't do that they will overlap
    if (currentChart) {
        currentChart.destroy();
    }

    // Create chart options
    if (svalue === 'bar') {
        currentChart = new Chart(document.getElementById('chart'), {
            type: 'bar',
            // Basic labels, data gets added later
            data: {
                labels: labels,
                datasets: []
            },
            options: {
                // Display title
                title: {
                    display: true
                },
                // Make chart resize to canvas
                responsive: true,
                // Make it possible to zoom and pan the chart
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'xy',
                        },
                        zoom: {
                            enabled: true,
                            mode: 'xy',
                            speed: 0.1,
                        }
                    }
                }
            }
        });
    } else if (svalue === 'line') {
        currentChart = new Chart(document.getElementById('chart'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: []
            },
            options: {
                title: {
                    display: true,
                },
                responsive: true,
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'xy',
                        },
                        zoom: {
                            enabled: true,
                            mode: 'xy',
                            speed: 0.1,
                        }
                    }
                }
            }
        });
    } else if (svalue === 'radar') {
        // Nice to have, but maybe a bit useless here, can't be zoomed/panned either
        currentChart = new Chart(document.getElementById("chart"), {
            type: 'radar',
            data: {
                labels: labels,
                datasets: []
            },
            options: {
                title: {
                    display: false,
                },
                responsive: true,
            }
        });
    }

    // Default colors for graphs, random colors are used if array is empty
    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#8c564b', '#bcbd22', '#7f7f7f', '#17becf', '#9467bd', '#d62728', '#e377c2'];

    // Add previously defined and filled arrays to the chart data
    for (i = 0; i < measureAttr.length; i++) {
        // Use random color if we run out of predefined colors
        if (colors.length < i) {
            color = getRandomColor();
        } else {
            color = colors[i];
        }
        // Create the new dataset
        const newDataSet = {
            label: measureAttr[i],
            data: dataGraph[i],
            pointRadius: 5,
            fill: false,
            borderColor: color,
            backgroundColor: color
        }
        // And append it to the chart
        currentChart.data.datasets.push(newDataSet);
    }
    // Update the chart, otherwise the data isn't visible
    currentChart.update();
}

// Function for creating random colors, used if we run out of default colors in array
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}