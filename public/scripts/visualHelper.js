// Split data that was received into an array
const measureArray = measureListData.split(';');

// Get needed elements from html page
const table = document.getElementById("dataTable");
const selGraph = document.getElementById('graph');
const selM = document.getElementById('measure');
const selYear = document.getElementById('year');
const button = document.getElementById('button');

let percentValues = [];

// Used for creating table headers with months and quarters
const months = ['Eigenschaft der Kennzahl', 'Jahr', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const quarters = ['Eigenschaft der Kennzahl', 'Jahr', '1.Quartal', '2.Quartal', '3.Quartal', '4.Quartal'];

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


// Handle filling of table and graph data when new measure is selected 
selM.onclick = function () {
    // Get parsed name of table
    const tableName = loadedTableName.slice(4, loadedTableName.length - 5).replaceAll('_', ' ');

    const columns = measureData.split(',');

    // Get selected measure
    var inputText = this.children[this.selectedIndex].innerHTML.trim();

    // True if table has already been filled
    let filled = false;

    // For checking if table head was already inserted
    let insertedHead = false;

    // Stores which type the table is
    let monthHead = false;
    let yearHead = false;
    let quarterHead = false;

    // TODO: cleaner way
    let sumArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let sumCalc;

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

                    let tableName = measure[measure.length - 1];
                    let index = tableName.indexOf('~');
                    sumCalc = tableName.slice(index + 1, tableName.length);

                    // Clear chart if changed to an item without data
                    if (currentChart) {
                        currentChart.destroy();
                    }

                    //Clear rows of the table except the first row
                    for (i = table.rows.length - 1; i > 0; i--) {
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

                    // Returns true if quarterly or monthly measure
                    if (/^\d+$/.test(years[0])) {

                        // Put years into the select menu for tables
                        for (k = 0; k < years.length; k++) {
                            let opt = document.createElement('option');
                            opt.value = years[k];
                            opt.appendChild(document.createTextNode(years[k]));
                            selYear.appendChild(opt);
                        }

                        if (measure[2] === 'quarterly') {
                            quarterHead = true;
                        } else {
                            monthHead = true;
                        }
                        // Returns true if yearly measure
                    } else if (years[0] === 'yearly') {
                        yearHead = true;
                        // Add first row of years here
                        let opt = document.createElement('option');
                        opt.value = years[0];
                        opt.appendChild(document.createTextNode('jährliche Erfassung'));
                        selYear.appendChild(opt);
                    }

                    // Insert table header for months
                    if (measureData && !insertedHead && monthHead) {
                        labels = months.slice(2, months.length);

                        let header = table.createTHead();
                        let row = header.insertRow(0);

                        insertedHead = true;

                        for (l = 0; l < months.length; l++) {
                            let cell = row.insertCell(l);
                            cell.outerHTML = "<th>" + months[l] + "</th>";
                        }
                        // Insert correct years from data into table head
                    } else if (measureData && !insertedHead && yearHead) {
                        labels = [];
                        let header = table.createTHead();
                        let row = header.insertRow(0);

                        let cellCount = 1;

                        let deleteAgain = false;

                        let cellMain = row.insertCell(0);
                        cellMain.outerHTML = "<th>Eigenschaft der Kennzahl</th>";

                        const yearArray = measureData.split(',');

                        for (h = 0; h < yearArray.length - 1; h++) {
                            if (yearArray[h].includes('Monat')) {
                                let cell = row.insertCell(cellCount);
                                cell.outerHTML = "<th>" + yearArray[h].split(':')[1] + "</th>";
                                cellCount++;
                                labels.push(yearArray[h].split(':')[1]);
                            }

                            // Something went wrong if we are adding anything else than a simple year here
                            if (yearArray[h].split(':')[1].length === 5) {
                                deleteAgain = true;
                                labels = [];
                            }
                        }

                        if (deleteAgain) {
                            table.innerHTML = "";
                        } else {
                            insertedHead = true;
                        }
                        // Insert quarters here into table head
                    } else if (measureData && !insertedHead && quarterHead) {
                        labels = quarters.slice(2, months.length);

                        let header = table.createTHead();
                        let row = header.insertRow(0);

                        for (l = 0; l < quarters.length; l++) {
                            let cell = row.insertCell(l);
                            cell.outerHTML = "<th>" + quarters[l] + "</th>";
                        }

                        measure.splice(2, 1);
                        insertedHead = true;
                    }
                }

                // TODO: fill corresponding cell, not just in order

                // Precaution so we don't leave the array length later on
                if (insertedHead && (j < measure.length - 3)) {
                    // Prepare new table rows for data
                    let row = table.insertRow(j + 1);

                    let opt = document.createElement('option');
                    opt.value = measure[j + 1];
                    opt.appendChild(document.createTextNode(measure[j + 1]));

                    // Save attributes of measure, location of them starts in the third array cell
                    measureAttr.push(measure[j + 2]);

                    // Look for percent entry syntax
                    if (measure[j + 2].includes('[[')) {
                        // And slice out the percent value
                        const percentEntry = measure[j + 2];

                        // Add graph data for complete graph at percent value
                        const percentValue = percentEntry.slice(percentEntry.indexOf('[[') + 2, percentEntry.indexOf(']]') - 1);
                        percentValues.push(percentValue);

                        measure[j + 2] = measure[j + 2].replace(']]', '');
                        measure[j + 2] = measure[j + 2].replace('[[', '');
                    } else {
                        percentValues.push(0);
                    }

                    // TODO: why is the 'y' here? needs fix, otherwise no measure can't contain ' y'
                    // Append data to table if there is any to add and if we got the right data already
                    if ((inputText === (tableName.replace(/[0-9]/g, '').replace(' y', '')))) {
                        // Fill first column of the table with the attributes of the measure
                        let cell = row.insertCell(-1);
                        cell.innerHTML = measure[j + 2];

                        // Counts data columns
                        var columnCount = measure.length - 2;

                        // Saves data for graphs
                        let dataBuilder = [];

                        for (k = j + 1; k < columns.length; k += columnCount) {
                            // Remove everything from data that isn't a number or decimal point
                            let cellData;

                            // We only need the second part of the data for the table
                            if (columns[k].split(':')[1].slice(0, 2) === '-1') {
                                cellData = 'n/a';
                            } else {
                                cellData = columns[k].split(':')[1].replace(/[^0-9.]/g, '');
                            }

                            // Fill correct table cell with data
                            let cell = row.insertCell(-1);
                            cell.innerHTML = cellData;

                            // Just add a zero if we don't have the data
                            if (cellData === 'n/a') {
                                cellData = 0;
                            }

                            // Add to year sum here
                            if (k !== j + 1) {
                                sumArray[j] = sumArray[j] + parseInt(cellData);
                            }

                            // Push data to arrays for graph visualization
                            if (k != j + 1) {
                                dataBuilder.push(cellData);
                                // Special case for yearly measures, in monthly and quarterly measures the year is left out
                            } else if (yearHead) {
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
    // Change here to added year values
    for (l = 1; l < table.rows.length; l++) {
        if (sumCalc === 'sum') {
            table.rows[l].cells[1].innerHTML = sumArray[l - 1];
        } else if (sumCalc === 'median') {
            table.rows[l].cells[1].innerHTML = (sumArray[l - 1] / dataGraph[0].length).toFixed(2);
        } // We don't have to do anything for self
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
                elements: {
                    // Smooth curves a bit
                    line: {
                        tension: 0.2
                    }
                },
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                hover: {
                    mode: 'index',
                    intersect: false
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
        // Nice to have, but maybe a bit useless here, can't be zoomed/panned either, maybe add more options later here
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
                elements: {
                    // Smooth curves a bit
                    line: {
                        tension: 0.15
                    }
                },
                fill: true
            }
        });
    } else if (svalue === 'horizontalBar') {
        currentChart = new Chart(document.getElementById('chart'), {
            type: 'horizontalBar',
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
    } else if (svalue === 'mixed') {
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
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                hover: {
                    mode: 'index',
                    intersect: false
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

        let newDataSet;

        // Remove [] => correct format
        measureAttr[i] = measureAttr[i].replace(']]', '');
        measureAttr[i] = measureAttr[i].replace('[[', '');

        // Create the new dataset
        if (svalue === 'mixed') {
            // Normal line data set
            newDataSet = {
                label: measureAttr[i],
                data: dataGraph[i],
                pointRadius: 5,
                fill: false,
                type: 'line',
                borderColor: color,
                backgroundColor: color
            }
            // Second dataset for bars with lighter colors
            const bgColor = hexToRgb(color);
            const newDataSetBar = {
                label: measureAttr[i],
                data: dataGraph[i],
                pointRadius: 5,
                fill: true,
                type: 'bar',
                backgroundColor: 'rgba(' + bgColor.r + ',' + bgColor.g + ',' + bgColor.b + ',0.2)'
            }
            currentChart.data.datasets.push(newDataSetBar);
        } else if (svalue === 'radar') {
            // Convert to RGB
            const bgColor = hexToRgb(color);
            newDataSet = {
                label: measureAttr[i],
                data: dataGraph[i],
                pointRadius: 5,
                fill: false,
                borderColor: color,
                // Somehow this needs a string, maybe there's an easier way?
                backgroundColor: 'rgba(' + bgColor.r + ',' + bgColor.g + ',' + bgColor.b + ',0.3)',
                fill: true
            }
        } else {
            let percentData = [];

            for (k = 0; k < dataGraph[i].length; k++) {
                percentData.push(percentValues[i]);
            }

            // Normal data set
            newDataSet = {
                label: measureAttr[i],
                data: dataGraph[i],
                pointRadius: 5,
                fill: false,
                borderColor: color,
                backgroundColor: color
            }

            // Add second data set if we want to display percent line
            if (svalue !== 'bar' && svalue !== 'horizontalBar' && percentData[0] != 0) {
                const bgColor = hexToRgb(color);
                compareLine = {
                    label: measureAttr[i] + ' Soll',
                    data: percentData,
                    pointRadius: 0,
                    fill: false,
                    borderColor: 'rgba(' + bgColor.r + ',' + bgColor.g + ',' + bgColor.b + ',0.6)',
                    backgroundColor: 'rgba(' + bgColor.r + ',' + bgColor.g + ',' + bgColor.b + ',0.6)',
                }
                currentChart.data.datasets.push(compareLine);
            }
        }
        // And append it to the chart
        currentChart.data.datasets.push(newDataSet);
    }
    // Update the chart, otherwise the data isn't visible
    currentChart.update();
}

/**
 * Converts value from hexadecimal format to rgb format.
 * @param {Color in hexadecimal format.} hex 
 */
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Generates a random hexadecimal color.
 */
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Automatically reselect last item that was entered, this in turn loads the table already
for (let i, j = 0; i = selM.options[j]; j++) {
    if (i.value === lastSelected.slice(0, lastSelected.length - 1)) {
        selM.selectedIndex = j;
        selM.onclick();

        // Default graph is bar graph
        selGraph.selectedIndex = 0;
        selGraph.onchange();

        break;
    }
}