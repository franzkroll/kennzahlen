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

// TODO: Color background only works in Chromium

// Needed for converting month number to text
const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const quarters = ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal'];

// Search for measure that was input by the user, when found display attributes
selM.onclick = function () {
    const index = this.selectedIndex;
    const inputText = this.children[index].innerHTML.trim();

    // Somehow we can get stuck in the next for loop, need this additional condition
    let isFound = false;

    // Loop through measure known to the system
    for (i = 0; i < measureArray.length && !isFound; i++) {
        const measure = measureArray[i].split(',').filter(Boolean);

        if (measure[0] === inputText) {
            // Clear any existing fields
            selYear.innerHTML = "";
            fieldContainer.innerHTML = "";

            years = measure[1].split(':');

            // Checks if it is a yearly measure or not
            if (/^\d+$/.test(years[0])) {
                for (k = 0; k < years.length; k++) {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(years[k]));
                    if (entryListSplit[i].includes(years[k])) {
                        opt.style.backgroundColor = '#90EE90';
                    }
                    opt.value = years[k];
                    selYear.appendChild(opt);

                    // Add quarters to dropdown menu
                    if (measure[2] === 'quarterly') {
                        for (l = 0; l < quarters.length; l++) {
                            let opt = document.createElement('option');
                            opt.appendChild(document.createTextNode(quarters[l] + ' ' + years[k]));
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
                            if (entryListSplit[i].includes(l + years[k])) {
                                opt.style.backgroundColor = '#90EE90';
                            }
                            opt.value = months[l] + years[k];
                            selYear.appendChild(opt);
                        }
                    }
                }
            } else {
                const currentYear = new Date().getFullYear();
                for (l = currentYear - 10; l <= currentYear + 10; l++) {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(l));
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
                    var div = document.createElement("div");
                    var text = document.createElement("input");
                    text.setAttribute("type", "number");
                    text.setAttribute("step", "0.01");
                    text.setAttribute("name", "var" + (i - 2));
                    text.setAttribute("id", "id" + (i - 2));
                    text.setAttribute("placeholder", measure[i]);
                    text.setAttribute("required", "required");
                    text.setAttribute("title", "Geben Sie hier den Wert für die Eigenschaft der Kennzahl ein. Falls der Wert nicht vorhanden ist geben Sie bitte -1 ein.");
                    // ... and add it to the container
                    div.appendChild(text);
                    fieldContainer.appendChild(div);
                }
            }
        }
    }
}

// Automatically reselect last item that was entered
for (let i, j = 0; i = selM.options[j]; j++) {
    if (i.value === lastMeasure) {
        selM.selectedIndex = j;
        selM.onclick();
        break;
    }
}

// Automatically reselect last item that was entered, maybe we should also select the month
for (let i, j = 0; i = selYear.options[j]; j++) {
    const date = lastMonth + lastYear;

    if (i.value == date) {
        selYear.selectedIndex = j;
        break;
    }
}