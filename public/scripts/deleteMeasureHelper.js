/**
 * Used in admin-section for simple display of measures in the system, so they can be deleted by the admin.
 */

// Split received data into array
const measureArray = measures.split(';');

// Get needed elements from the document
const selM = document.getElementById('measureSelect');
const selY = document.getElementById('yearSelect');

// Add measures to the select
for (i = 0; i < measureArray.length - 1; i++) {
    const measure = measureArray[i].split(',').filter(Boolean);
    let opt = document.createElement('option');
    opt.appendChild(document.createTextNode(measure[0]));
    opt.value = measure[0];
    selM.appendChild(opt);
}

// Add years if user selects an item
selM.onclick = function () {
    const index = this.selectedIndex;
    const inputText = this.children[index].innerHTML.trim();

    // Loop through measure known to the system
    for (i = 0; i < measureArray.length; i++) {
        const measure = measureArray[i].split(',').filter(Boolean);
        if (measure[0] === inputText) {
            years = measure[1].split(':');
            // Clear any existing fields
            selY.innerHTML = "";
            // Check if its yearly measure or not
            if (/^\d+$/.test(years[0])) {
                years = years.sort();

                // Cycle through years of the measure and add them to the select
                for (k = 0; k < years.length; k++) {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(years[k]));
                    opt.value = years[k];
                    selY.appendChild(opt);
                }
            } else {
                let opt = document.createElement('option');
                opt.appendChild(document.createTextNode('jährliche Erfassung'));
                opt.value = 'yearly';
                selY.appendChild(opt);
            }
        }
    }
}