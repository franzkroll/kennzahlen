// Split received data back into array
measureList = measureList.split(';');

// Grab elements from the document
const selM = document.getElementById('measure0');
let selY = document.getElementById('year0');

// Cycle through measure array and add them to first div
for (i = 0; i < measureList.length - 1; i++) {
    const measure = measureList[i].split(',').filter(Boolean);
    let opt = document.createElement('option');
    opt.appendChild(document.createTextNode(measure[0]));
    opt.value = measure[0];
    selM.appendChild(opt);
}

// And add event listener to the first element
selM.addEventListener('click', eventFunc, false);

// Handles adding of new selection fields if needed, just clones the original and adds it again
window.addEventListener('load', function () {
    let i = 0;
    // Clone 
    document.getElementById('addBtn').addEventListener('click', function () {
        // Get original elements
        let original = document.getElementById('measure' + i);
        let originalY = document.getElementById('year' + i);

        i++;

        // Clone them and add them to the correct div
        let clone = original.cloneNode(true);
        clone.id = 'measure' + i;
        clone.addEventListener('click', eventFunc, false);
        document.getElementById('addDiv').appendChild(clone);

        let cloneY = originalY.cloneNode(true);
        cloneY.id = 'year' + i;
        document.getElementById('addDiv').appendChild(cloneY);
    });
});

function eventFunc() {
    // Get corresponding year select for current measure select
    selY = document.getElementById('year' + this.id.slice(this.id.length - 1, this.id.length));

    // Get the selected item from current measure
    const inputText = this.children[this.selectedIndex].innerHTML.trim();

    // Loop through measure known to the system
    for (i = 0; i < measureList.length; i++) {
        const measure = measureList[i].split(',').filter(Boolean);
        if (measure[0] === inputText) {
            years = measure[1].split(':');
            // Clear any existing fields
            selY.innerHTML = "";
            // Check if its yearly measure or not
            if (/^\d+$/.test(years[0])) {
                // Cycle through years of the measure and add them to the select
                for (k = 0; k < years.length; k++) {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(years[k]));
                    opt.value = years[k];
                    selY.appendChild(opt);
                }
                // Don't add years if its a yearly measure
            } else {
                let opt = document.createElement('option');
                opt.appendChild(document.createTextNode('jährliche Erfassung'));
                opt.value = 'yearly';
                selY.appendChild(opt);
            }
        }
    }
}