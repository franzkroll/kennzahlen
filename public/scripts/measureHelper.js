// Get needed items from document
const selM = document.getElementById('measure');
const main = document.getElementById('mainDesc');
const col = document.getElementById('add');
var coll = document.getElementsByClassName('collapsible');

// Split received data into arrays
const measureArray = measureListData.split(';');
const descriptions = measureDescriptions.split(';');

// Fill select with measures
for (i = 0; i < measureArray.length - 1; i++) {
    const measure = measureArray[i].split(',').filter(Boolean);
    let opt = document.createElement('option');
    opt.appendChild(document.createTextNode(measure[0]));
    opt.value = measure[0];
    selM.appendChild(opt);
}

// Search for measure that was input by the user, when found display attributes
selM.onclick = function () {
    const index = this.selectedIndex;
    const inputText = this.children[index].innerHTML.trim();

    // Loop through measure known to the system
    for (i = 0; i < measureArray.length; i++) {
        const measure = measureArray[i].split(',').filter(Boolean);
        if (measure[0] === inputText) {
            // Clear if new is selected 
            col.innerHTML = '';
            // Split description array further into descriptions for selected measure
            const currentDescription = descriptions[i].split(',').filter(Boolean);
            // Add main description
            mainDesc.innerHTML = currentDescription[1];

            let length = measure.length;

            // Add text here for measure description
            for (j = 2; j < length - 1; j++) {
                if (measure[j] != 'quarterly') {
                    // Add Button collapsible for every attribute
                    const button = document.createElement('button');
                    measure[j] = measure[j].replace(']]', '');
                    measure[j] = measure[j].replace('[[', '');
                    button.innerHTML = measure[j];
                    button.setAttribute('class', 'collapsible');
                    col.appendChild(button);
                    // Add content from description array
                    const text = document.createElement('p');
                    text.innerHTML = currentDescription[j];
                    text.setAttribute('class', 'content');
                    col.appendChild(text);
                }
            }
        }
    }

    // Add function to collapsible fields
    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener('click', function () {
            this.classList.toggle('active');
            var content = this.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        });
    }
}