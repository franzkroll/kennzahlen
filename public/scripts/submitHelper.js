/**
 * Used in submit-page. Listens for changes in selects and adds all attributes for submitting of
 * values of the selected measure. If a year or month or quarter already has values it is coloured green.
 * After reloading of the page after submitting the last entered measure and timeframe get selected again.
 */

// Get elements from html page
const measureArray = measureData.split(';');
const selM = document.getElementById('measure');
const selYear = document.getElementById('duration');
const fieldContainer = document.getElementById("container");
const entryListSplit = entryList.split(';');


// Fill leftmost select with items so that they are selectable
for (i = 0; i < measureArray.length - 1; i++) {
    const measure = measureArray[i].split(',').filter(Boolean);
    let opt = document.createElement('option');
    opt.appendChild(document.createTextNode(measure[0]));
    opt.value = measure[0];
    selM.appendChild(opt);
}

// Hide elements until needed
document.getElementById('duration').style.display = 'none';
document.getElementById('dailyDate').style.display = 'none';
document.getElementById('dailyDateLabel').style.display = 'none';

// Needed for converting month number to text
const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const quarters = ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal'];

/**
 * Determines the current date and sets the range for the datepicker (+/- 3 years).
 */
function setDatePickerValues() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy + '-' + mm + '-' + dd;
    const futureToday = (yyyy + 3) + '-' + mm + '-' + dd;
    const pastToday = (yyyy - 3) + '-' + mm + '-' + dd;

    const dailyDate = document.getElementById('dailyDate');

    dailyDate.setAttribute('value', today);
    dailyDate.setAttribute('min', pastToday);
    dailyDate.setAttribute('max', futureToday);
}


// Only makes the needed elements for picking an interval visible
function switchView(isPicker) {
    if (isPicker) {
        document.getElementById('duration').style.display = 'none';
        document.getElementById('dailyDate').style.display = 'inline-block';
        document.getElementById('dailyDateLabel').style.display = 'inline-block';
    } else {
        document.getElementById('duration').style.display = 'inline-block';
        document.getElementById('dailyDate').style.display = 'none';
        document.getElementById('dailyDateLabel').style.display = 'none';
    }
}

// Search for measure that was input by the user, when found display attributes
selM.onchange = function () {
    const index = this.selectedIndex;
    const inputText = this.children[index].innerHTML.trim();

    // Somehow we can get stuck in the next for loop, need this additional condition
    let isFound = false;
    // Save sumCalc element because we need to color the years when the summation is done automatically
    let sumCalc = '';

    // Loop through measure known to the system
    for (i = 0; i < measureArray.length && !isFound; i++) {
        const measure = measureArray[i].split(',').filter(Boolean);

        if (measure[0] === inputText) {
            // Slice out the calc element
            sumCalc = measure[measure.length - 1];
            sumCalc = sumCalc.slice(sumCalc.indexOf('~') + 1, sumCalc.length);

            isFound = true;

            // Clear any existing fields
            selYear.innerHTML = "";
            fieldContainer.innerHTML = "";

            years = measure[1].split(':');

            // Check for daily measure
            if (measure[measure.length - 1].includes('_daily')) {
                // Hide the normal menu
                switchView(true);

                // Update date picker with current values
                setDatePickerValues();

                // Enter values for correct date, how do we sort the mysql entries here?
                // Checks if it is a yearly measure or not            
            } else if (/^\d+$/.test(years[0])) {
                // Hide the date picker
                switchView(false);

                years = years.sort();

                for (k = 0; k < years.length; k++) {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(years[k]));
                    // Color existing entries green, also automatic summed elements
                    if (entryListSplit[i].includes(',' + years[k]) || sumCalc !== 'self') {
                        opt.style.backgroundColor = '#90EE90';
                    }
                    opt.value = years[k];

                    if (sumCalc === 'self') {
                        selYear.appendChild(opt);
                    }

                    // Add quarters to dropdown menu
                    if (measure[2] === 'quarterly') {
                        for (l = 0; l < quarters.length; l++) {
                            let opt = document.createElement('option');
                            opt.appendChild(document.createTextNode(quarters[l] + ' ' + years[k]));
                            // Color existing entries green
                            if (entryListSplit[i].includes(l + years[k])) {
                                opt.style.backgroundColor = '#90EE90';
                            }
                            opt.value = quarters[l] + years[k];
                            selYear.appendChild(opt);
                        }
                        // Add months to dropdown menu
                    } else {
                        for (l = 0; l < months.length; l++) {
                            let opt = document.createElement('option');
                            opt.appendChild(document.createTextNode(months[l] + ' ' + years[k]));
                            // Color existing entries green
                            if (entryListSplit[i].includes(l + years[k])) {
                                opt.style.backgroundColor = '#90EE90';
                            }
                            opt.value = months[l] + years[k];
                            selYear.appendChild(opt);
                        }
                    }
                }
            } else {
                // Hide the date picker           
                switchView(false);

                const currentYear = new Date().getFullYear();

                for (l = currentYear - 15; l <= currentYear + 15; l++) {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(l));
                    // Color existing entries green
                    if (entryListSplit[i].includes(l)) {
                        opt.style.backgroundColor = '#90EE90';
                    }
                    opt.value = l;
                    selYear.appendChild(opt);
                }
            }

            // Create text fields for all measure attributes
            for (i = 2; i < measure.length - 1; i++) {
                // console.log('creating attributes');

                if (measure[i] !== 'quarterly') {
                    measure[i] = measure[i].replace(']]', '');
                    measure[i] = measure[i].replace('[[', '');

                    var div = document.createElement("div");
                    var text = document.createElement("input");
                    text.setAttribute("type", "number");
                    text.setAttribute("step", "0.01");
                    text.setAttribute("name", "var" + (i - 2));
                    text.setAttribute("id", "id" + (i - 2));
                    text.setAttribute("placeholder", measure[i]);
                    text.setAttribute("title", "Geben Sie hier den Wert für die Eigenschaft der Kennzahl ein. Falls der Wert nicht vorhanden ist, geben Sie bitte -1 ein.");
                    text.required = true;
                    // ... and add it to the container
                    div.appendChild(text);
                    fieldContainer.appendChild(div);
                }
            }
        }
    }
}

//selM.selectedIndex = 0;
try {
    selM.onchange();
} catch (e) {
    console.log('No measures exist!')
}

// Automatically reselect last item that was entered
for (let i, j = 0; i = selM.options[j]; j++) {
    if (i.value === lastMeasure) {
        selM.selectedIndex = j;
        selM.onchange();
        break;
    }
}

// Automatically reselect last item that was entered
for (let i, j = 0; i = selYear.options[j]; j++) {
    const date = lastMonth + lastYear;

    if (i.value == date) {
        selYear.selectedIndex = j + 1;
        break;
    }
}
