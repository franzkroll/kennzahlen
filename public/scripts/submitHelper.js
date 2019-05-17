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

const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

selM.onclick = function () {
    var index = this.selectedIndex;
    var inputText = this.children[index].innerHTML.trim();
    let filled = false;

    // Loop through measure known to the system
    for (i = 0; i < measureArray.length; i++) {
        const measure = measureArray[i].split(',').filter(Boolean);
        if (!filled) {
            if (measure[0] === inputText) {
                filled = true;
                years = measure[1].split(':');
                selYear.innerHTML = "";
                fieldContainer.innerHTML = "";
                for (k = 0; k < years.length; k++) {
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
                    text.setAttribute("type", "text");
                    text.setAttribute("name", "var" + i);
                    text.setAttribute("placeholder", measure[i]);
                    text.setAttribute("title", "TODO: Beschreibung speichern und laden");
                    // ... and add it to the container
                    div.appendChild(text);
                    fieldContainer.appendChild(div);
                }
            }
        }
    }
}