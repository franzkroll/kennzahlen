// Get elements from html page
const measureArray = measureData.split(';');
const descriptionArray = descriptionData.split(';');
const selM = document.getElementById('measure');
const selA = document.getElementById('attribute');

// Used for storing index of measure in lists so we don't have to search again
let saveIndex = -1;

// Fill leftmost select with items so that they are selectable
for (i = 0; i < measureArray.length - 1; i++) {
    const measure = measureArray[i].split(',').filter(Boolean);
    let opt = document.createElement('option');
    opt.appendChild(document.createTextNode(measure[0]));
    opt.value = measure[0];
    selM.appendChild(opt);
}

// Search for measure that was input by the user, when found display attributes in second select
selM.onclick = function () {
    const index = this.selectedIndex;
    const inputText = this.children[index].innerHTML.trim();

    // Somehow we can get stuck in the next for loop, need this additional condition
    let isFound = false;

    // Loop through measure known to the system
    for (i = 0; i < measureArray.length && !isFound; i++) {
        const measure = measureArray[i].split(',').filter(Boolean);

        if (measure[0] === inputText) {
            saveIndex = i;

            isFound = true;
            // Clear any existing fields
            selA.innerHTML = '';

            // Create text fields for all measure attributes
            for (i = 2; i < measure.length - 1; i++) {
                if (measure[i] !== 'quarterly') {
                    let opt = document.createElement('option');
                    opt.appendChild(document.createTextNode(measure[i]));
                    opt.value = measure[i];
                    selA.appendChild(opt);
                }
            }
        }
    }
}

// If user selects attribute add the description and the name to the two fields
selA.onclick = function () {
    // Get selected index
    const index = this.selectedIndex;
    const inputText = this.children[index].innerHTML.trim();

    // Get correct array and save at split position
    const measure = measureArray[saveIndex].split(',').filter(Boolean);
    const description = descriptionArray[saveIndex].split(',').filter(Boolean);

    // Get text fields from html
    let attr = document.getElementById('varChange');
    let desc = document.getElementById('descChange');

    const indexAttr = measure.indexOf(inputText);

    // Set fields with correct attribute
    attr.setAttribute('value', measure[indexAttr]);
    attr.setAttribute('placeholder', 'Geänderte Bezeichnung hier eingeben.')
    attr.setAttribute('title', 'Geben Sie hier die den neuen Namen für das Attribut ein.');

    desc.setAttribute('value', description[indexAttr]);
    desc.setAttribute('placeholder', 'Geänderte Beschreibung hier eingeben.');
    desc.setAttribute('title', "Geben Sie hier die gewünschte geänderte Beschreibung ein.");
}