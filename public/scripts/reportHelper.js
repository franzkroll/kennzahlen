// Split received data back into array
measureList = measureList.split(';');

// Grab elements from the document
const selM = document.getElementById('measure');
const selY = document.getElementById('year');

// Handles adding of new selection fields if needed, just clones the original and adds it again
window.addEventListener('load', function () {
    let i = 0;
    document.getElementById('addBtn').addEventListener('click', function () {
        let original = document.getElementById('clone' + i);
        let clone = original.cloneNode(true); // "deep" clone
        clone.id = "clone" + ++i; // there can only be one element with an ID
        // TODO: clone.onclick = duplicate; // event handlers are not cloned
        document.getElementById('addDiv').appendChild(clone);
    });
});

// Cycle through all arrays and add them to the selection menus
for (i = 0; i < measureList.length - 1; i++) {
    const measure = measureList[i].split(',').filter(Boolean);
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
            } else {
                let opt = document.createElement('option');
                opt.appendChild(document.createTextNode('jährliche Erfassung'));
                opt.value = 'yearly';
                selY.appendChild(opt);
            }
        }
    }
}