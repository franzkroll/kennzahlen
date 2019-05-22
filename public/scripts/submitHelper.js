// Get elements from html page
const measureArray = measureData.split(';');
const selM = document.getElementById('measure');
const selYear = document.getElementById('duration');
const fieldContainer = document.getElementById("container");

// Fill leftmost select with items so that they are selectable
for (i = 0; i < measureArray.length - 1; i++) {
    const measure = measureArray[i].split(',').filter(Boolean);
    let opt = document.createElement('option');
    opt.appendChild(document.createTextNode(measure[0]));
    opt.value = measure[0];
    selM.appendChild(opt);
}

// Needed for converting month number to text
const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// TODO: Display already submitted values when month is selected

// Search for measure that was input by the user, when found display attributes
selM.onclick = function () {
    const index = this.selectedIndex;
    const inputText = this.children[index].innerHTML.trim();

    // Loop through measure known to the system
    for (i = 0; i < measureArray.length; i++) {
        const measure = measureArray[i].split(',').filter(Boolean);
        if (measure[0] === inputText) {
            years = measure[1].split(':');
            // Clear any existing fields
            selYear.innerHTML = "";
            fieldContainer.innerHTML = "";
            // Cycle through years of the measure
            for (k = 0; k < years.length; k++) {
                let opt = document.createElement('option');
                opt.appendChild(document.createTextNode(years[k]));
                opt.value = years[k];
                selYear.appendChild(opt);

                // Adds selection for months
                for (l = 0; l < months.length; l++) {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(months[l] + ' ' + years[k]));
                    opt.value = months[l] + years[k];
                    selYear.appendChild(opt);
                }
            }


            // Create text fields for all measure attributes
            for (i = 2; i < measure.length - 1; i++) {
                var div = document.createElement("div");
                var text = document.createElement("input");
                text.setAttribute("type", "number");
                text.setAttribute("step", "0.01");
                text.setAttribute("name", "var" + (i - 2));
                text.setAttribute("id", "id" + (i - 2));
                text.setAttribute("placeholder", measure[i]);
                text.setAttribute("required", "required");
                text.setAttribute("title", "Geben Sie hier den Wert für die Eigenschaft der Kennzahl ein."); // TODO: maybe load custom description
                // ... and add it to the container
                div.appendChild(text);
                fieldContainer.appendChild(div);
            }
        }
    }
}