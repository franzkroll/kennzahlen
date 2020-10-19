/**
 * Used in visual-page. Fills select with all available measures and their corresponding times.
 * After user queries the system for data and the page receives data the table is filled.
 * While filling the table the data gets automatically added to the data for graphs. By default a 
 * bar-graph is loaded. Graphs are built with chart-js. The user then has the ability to select different
 * visualization options.
 * Finally the user can add the current page to a report. All the added pages get saved in HTML5-sessionStorage.
 * The user has than the option to download the report or clear all existing data from the report, which clears
 * the sessionStorage. The number of pages is limited by the browser and how much space it gives to the sessionStorage.
 * It should be at least 5mb, which allows for a minimum of 10-15 pages.
 */

// Split data that was received into an array
const measureArray = measureListData.split(';');

// Get needed elements from html page
const table = document.getElementById("dataTable");
const selGraph = document.getElementById('graph');
const selM = document.getElementById('measure');
const selYear = document.getElementById('year');
const selMonth = document.getElementById('month');
const button = document.getElementById('button');


// Used for creating table headers with months and quarters
const months = ['Eigenschaft der Kennzahl', 'Jahr', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const quarters = ['Eigenschaft der Kennzahl', 'Jahr', '1.Quartal', '2.Quartal', '3.Quartal', '4.Quartal'];
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Saves values in double brackets from measure attributes => the percent lines to be displayed in the graph
let percentValues = [];

// Labels for the graph, needs months, quarters or years
let labels = [];

// Saves current chart so we can destroy it before creating a new one
let currentChart;

// Saves for display in graph
let dataGraph = [];

// Saves attributes of the current measure
let measureAttr = [];

// Replace all because js doesn't have it
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// Slices out a semicolon
let tableName2 = lastSelected.slice(0, lastSelected.length - 1);

// Format measure array and add to select
for (i = 0; i < measureArray.length - 1; i++) {
    const measure = measureArray[i].split(',').filter(Boolean);
    let opt = document.createElement('option');
    opt.appendChild(document.createTextNode(measure[0]));
    opt.value = measure[0];
    selM.appendChild(opt);
}

// Delete name because we don't have any data
selM.onchange = function () {
    nameField.innerHTML = '';
}

// Handle filling of table and graph data when new measure is selected 
selM.onclick = function () {
    // Get parsed name of table
    const columns = measureData.split(',');

    // Get selected measure
    var inputText = this.children[this.selectedIndex].innerHTML.trim();

    // For checking if table head was already inserted
    let insertedHead = false;

    // Stores which type the table is
    let yearHead = false;

    // Saves type of sum and sum values
    let sumArray = [];
    let sumCalc;

    let yearlyMeasure = false;
    let dailyMeasure = false;

    // Save spots we filled for later rows
    let filling = [];

    // Loop through received array data until we find the needed measure
    for (i = 0; i < measureArray.length && !insertedHead; i++) {
        // Split actual data of the measure 
        const measure = measureArray[i].split(',').filter(Boolean);
        // Only fill table if it hasn't been filled before
        for (j = 0; j < measure.length - 1; j++) {
            // If measure is found clear table and prepare select for new data
            if (measure[j] === inputText) {
                // Get tablename of the received data
                let tableName = measure[measure.length - 1];

                if (tableName.includes('_daily')) {
                    dailyMeasure = true;
                }

                // Slice out info how the yearly sum is collected
                let index = tableName.indexOf('~');
                sumCalc = tableName.slice(index + 1, tableName.length);

                // Clear chart if changed to an item without data
                if (currentChart) {
                    currentChart.destroy();
                }

                // Clear data for graphs and saved attributes
                measureAttr = [];
                dataGraph = [];

                // Clear selection of the years and table
                selYear.innerHTML = "";
                table.innerHTML = "";

                // Split years here for year table, only if it isn't yearly or quarterly measure
                years = measure[j + 1].trim().split(':');

                // Sort the years, makes the output look nicer
                years = years.sort();

                // Only show month menu if it's a daily measure
                if (!dailyMeasure) {
                    document.getElementById('month').style.visibility = 'hidden';
                } else {
                    selMonth.style.visibility = 'visible';

                    for (l = 2; l < months.length; l++) {
                        let opt = document.createElement('option');
                        opt.value = months[l];
                        opt.appendChild(document.createTextNode(months[l]));
                        selMonth.appendChild(opt);
                    }
                }

                // Returns true if quarterly or monthly or daily measure, fills year select menu with values
                if (dailyMeasure || (/^\d+$/.test(years[0]))) {
                    for (k = 0; k < years.length; k++) {
                        let opt = document.createElement('option');
                        opt.value = years[k];
                        opt.appendChild(document.createTextNode(years[k]));
                        selYear.appendChild(opt);
                    }
                } else if (years[0] === 'yearly') {
                    yearHead = true;
                    // Add first row of years here
                    let opt = document.createElement('option');
                    opt.value = years[0];
                    opt.appendChild(document.createTextNode('jährliche Erfassung'));
                    selYear.appendChild(opt);
                }

                // Automatic reselection of the year, that was last selected
                for (let i = 0; i < selYear.options.length; i++) {
                    if (selYear.options[i].value === lastYear) {
                        selYear.selectedIndex = i;
                        break;
                    }
                }

                // Add first table row
                let header = table.createTHead();
                let row = header.insertRow(0);

                // Grab yearly measures first
                if (measureData && !insertedHead && yearHead) {
                    labels = [];

                    // Split years of the measure into array
                    const yearArray = measureData.split(',');

                    let fillAlready = true;

                    // Stupid work around to fix visual bug
                    for (m = 0; m < yearArray.length; m += 2) {
                        if (yearArray[m].split(':')[1].length > 4) {
                            fillAlready = false;
                        }
                    }

                    // Cycle through years and add them to the table and graph labels
                    if (fillAlready) {

                        let cellMain = row.insertCell(0);
                        cellMain.outerHTML = "<th>Eigenschaft der Kennzahl</th>";

                        for (h = 0; h < yearArray.length - 1; h++) {
                            // Need to filter out some elements
                            if (yearArray[h].includes('Monat') && yearArray[h].split(':')[1].length === 4) {
                                let cell = row.insertCell(-1);
                                cell.outerHTML = "<th>" + yearArray[h].split(':')[1] + "</th>";
                                labels.push(yearArray[h].split(':')[1]);
                            }
                        }
                    }

                    yearlyMeasure = true;
                    insertedHead = true;

                    // Then quarterly measures
                } else if (dailyMeasure) {
                    console.log('got measure data');
                    // Correctly format the table head
                    for (p = 0; p < daysInMonth[0]; p++) {
                        labels.push(p);
                    }

                    console.log(labels);
                } else if (measureData && !insertedHead && measure[2] === 'quarterly') {
                    labels = quarters.slice(2, months.length);

                    for (l = 0; l < quarters.length; l++) {
                        let cell = row.insertCell(l);
                        cell.outerHTML = "<th>" + quarters[l] + "</th>";
                    }

                    measure.splice(2, 1);
                    insertedHead = true;

                    // And finally monthly measures
                } else {
                    labels = months.slice(2, months.length);

                    for (l = 0; l < months.length; l++) {
                        let cell = row.insertCell(l);
                        cell.outerHTML = "<th>" + months[l] + "</th>";
                    }

                    insertedHead = true;
                }
            }

            // Precaution so we don't leave the array length later on, only enter if the 
            // table head is already done and we are ready to write data into the table
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

                    // Replace marking for percent values so we don't display them
                    measure[j + 2] = measure[j + 2].replace(']]', '');
                    measure[j + 2] = measure[j + 2].replace('[[', '');
                } else {
                    percentValues.push(0);
                }

                // Append data to table if there is any to add and if we got the right data already
                if ((inputText === (tableName2.replaceAll('_', ' ')))) {
                    // Fill first column of the table with the attributes of the measure
                    let cell = row.insertCell(-1);
                    cell.innerHTML = measure[j + 2];

                    // Don't insert 0 if user sums values himself
                    if (!yearHead && sumCalc !== 'self') {
                        let cell2 = row.insertCell(-1);
                        cell2.innerHTML = 0;
                    }

                    // Counts data columns
                    var columnCount = measure.length - 2;

                    // Saves data for graphs
                    let dataBuilder = [];

                    // Count current cell we are inserting, so we don't add data into the wrong month
                    let count = 1;

                    // We have on more value with manually yearly values
                    if (sumCalc === 'self') {
                        count = 0;
                    } else {
                        count = 1;
                    }

                    // Cycle through data for measure and take column breaks into account
                    for (k = j + 1; k < columns.length; k += columnCount) {
                        // Remove everything from data that isn't a number or decimal point
                        let cellData;

                        // We only need the second part of the data for the table
                        if (columns[k].split(':')[1].slice(0, 2) === '-1') {
                            cellData = 'n.v.';
                        } else {
                            cellData = columns[k].split(':')[1].replace(/[^0-9.]/g, '');
                        }

                        // Just add a zero if we don't have the data, comparison is weird, maybe there is an easier way
                        if (count != Number((columns[k - 1].split(':')[1] / 10000).toFixed(0)) && (columns[k - 1].split(':')[1].length >= 5) || (filling.includes(count))) {
                            cellData = 'n.v.';
                            filling.push(count);
                            k -= columnCount;
                        }

                        count++

                        // Fill correct table cell with data
                        let cell = row.insertCell(-1);
                        cell.innerHTML = cellData;

                        // Substitute again for graphs
                        if (cellData === 'n.v.') {
                            cellData = 0;
                        }

                        // Add to yearly sum here, push new entry if it doesn't exist yet
                        if (typeof sumArray[j] === 'undefined') {
                            sumArray.push(parseFloat(cellData));
                        } else {
                            sumArray[j] = sumArray[j] + parseFloat(cellData);
                        }

                        // Don't add user summed values to the graph
                        if (!(sumCalc === 'self' && k === j + 1) && !yearlyMeasure) {
                            dataBuilder.push(cellData);
                        } else if (yearlyMeasure) {
                            dataBuilder.push(cellData);
                        }
                    }
                    // Push data to array for graphs
                    dataGraph.push(dataBuilder);
                }
            }
        }
    }

    // Change here to added year values
    for (l = 1; l < table.rows.length; l++) {
        if (sumArray[l - 1] === 'NaN') {
            sumArray[l - 1] = 0;
        } else if (Number(sumArray[l - 1])) {
            if (sumCalc === 'sum') {
                // Replace year value with calculated sum
                table.rows[l].cells[1].innerHTML = Number(sumArray[l - 1].toFixed(2));
            } else if (sumCalc === 'median') {
                table.rows[l].cells[1].innerHTML = Number((sumArray[l - 1] / dataGraph[0].length).toFixed(2));
            } // We don't have to do anything for self
        }
        if ((filling.length > 0) && (sumCalc === 'median')) {
            table.rows[l].cells[1].innerHTML = 'n.v.';
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
                elements: {
                    // Smooth curves a bit
                    line: {
                        tension: 0.2
                    }
                },
                // Show all tooltips of current point
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

    // Default colors for graphs, random colors are used if array doesn't have enough colors
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
            // Save percent data in own array
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
 * Converts color value from hexadecimal format to rgb format.
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

// TODO: Better report

/**
 * Helper for placing objects in session storage.
 */
Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
}

/**
 *  Helper for retrieving objects from session storage.
 */
Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}

// Automatically reselect last item that was entered, this in turn loads the table already
// TODO: Something is wrong with the for-loop
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

console.log(lastYear);



/**
 * Helper method for storing objects in session storage.
 */
Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
}

/**
 * Helper method for retrieving objects from session storage.
 */
Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}

/**
 * Adds current html page with exceptions, to image. Image gets saved in session storage.
 */
document.getElementById('report').onclick = function () {
    html2canvas(document.body, {
        // Scale image for better quality
        scale: 5,
        dpi: 300,
        onrendered: function (canvas) {
            // Convert image to dataURL
            const image = canvas.toDataURL("image/png");
            // Save dataURL in session storage
            try {
                window.sessionStorage.setObject(new Date().getTime(), image);
                document.getElementById('status').innerHTML = "Aktuelle Kennzahl erfolgreich hinzugefügt!"
            } catch (error) {
                console.log(error);
                document.getElementById('status').innerHTML = "Fehler beim Hinzufügen der Kennzahl!"
            }
        }
    });
}

/**
 * Creates new pdf document from all previously stored measure in the session storage
 * TODO: jspdf is broken
 */
document.getElementById('download').onclick = function () {
    // Create new document
    let doc = new jsPDF('p', 'mm', 'a4');
    doc.internal.scaleFactor = 1.5;

    // Set image width to a4
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Get all images from local storage and add them to the pdf
    for (let key in sessionStorage) {
        if (!isNaN(key)) {
            const image = window.sessionStorage.getObject(key);
            doc.addImage(image, 'PNG', 0, 0, width * 0.9, height * 0.65, '', 'SLOW');
            doc.addPage();
        }
    }

    // Remove last blank page
    doc.deletePage(doc.internal.getNumberOfPages());

    // Used for creating unique random filename
    var array = new Uint32Array(1);
    window.crypto.getRandomValues(array);

    // And download it
    document.getElementById('status').innerHTML = "Download wird vorbereitet."
    doc.save('Report_' + userName + '_' + array[0] + '.pdf');
}

/**
 * Clears all previously stored data from the local storage.
 */
document.getElementById('delete').onclick = function () {
    document.getElementById('status').innerHTML = "Bestehender Report gelöscht."
    window.sessionStorage.clear();
}