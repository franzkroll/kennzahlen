/**
 * Duplicates text fields when user wants to add more than one attribute to a new measure.
 */

// Used in the creation of new measures, creates a new field for an attribute every time the add field button is pressed
window.addEventListener('load', function () {
    let i = 2;
    document.getElementById('add').addEventListener('click', function () {
        // Create div and corresponding text field ... 
        var div = document.createElement('div');
        var text = document.createElement('input');
        text.setAttribute('type', 'text');
        text.setAttribute('name', 'var' + i);
        text.setAttribute('required', 'required');
        text.setAttribute('placeholder', 'Eigenschaft ' + i);
        text.setAttribute('title', 'Geben Sie hier einen Namen für die Eigenschaft der Kennzahl ein.');

        // ... and add it to the container
        div.appendChild(text);
        document.getElementById('container').appendChild(div);

        // Do the same for the description of the measure
        var div2 = document.createElement('div');
        var text2 = document.createElement('input');
        text2.setAttribute('type', 'text');
        text2.setAttribute('name', 'desc' + i);
        text2.setAttribute('value', 'Keine Beschreibung vorhanden');
        text2.setAttribute('placeholder', 'Beschreibung von Eigenschaft ' + i);
        text2.setAttribute('title', 'Geben Sie hier eine Beschreibung für die Eigenschaft der Kennzahl ein.');

        // ... and add it to the container
        div2.appendChild(text2);
        document.getElementById('container').appendChild(div2);

        // Increment i for every added field, so every field has unique name
        i++;
    });

    document.getElementById('delete').addEventListener('click', function () {
        // Remove last added elements
        var forms = document.getElementById('container');
        if (i > 2) {
            for (j = 0; j < 2; j++) {
                forms.removeChild(forms.lastChild);
            }
            i--;
        }
    });
});

// Automatically select correct adding method when user selects yearly measure
let cycle = document.getElementById('cycle');

// Automatically select manual for yearly measures, because we don't need automatic summation for yearly measures
cycle.onclick = function () {
    const index = this.selectedIndex;
    const inputText = this.children[index].innerHTML.trim();

    if (inputText === 'jährlich') {
        document.getElementById('self').checked = true;
    }
}

/**
 * Filling of dropdown menus for role and mandate.
 */
// Get elements from document
const mandateSelect = document.getElementById('mandates');
const roleSelect = document.getElementById('roles');

roleList = roleList.split(';');
mandateList = mandateList.split(';');

let mandateSaver = [];
let roleSaver = [];

// Grab roles and mandates from passed lists
for (i = 0; i < roleList.length - 1; i++) {
    const role = roleList[i].split(',').filter(Boolean);
    const mandate = mandateList[i].split(',').filter(Boolean);

    let opt = document.createElement('option');


    if (!mandateSaver.includes(mandate[1])) {

        // Add mandate to list
        opt.appendChild(document.createTextNode(mandate[1]));
        opt.value = mandate[1];
        mandateSelect.appendChild(opt);

        mandateSaver.push(mandate[1]);

    }

    if (!roleSaver.includes(role[1])) {
        // Add role to list
        opt = document.createElement('option');
        opt.appendChild(document.createTextNode(role[1]));
        opt.value = role[1];
        roleSelect.appendChild(opt);

        roleSaver.push(role[1]);
    }
}

// Add user and admin to role dropdown, * to mandate dropdown, maybe there is a more elegant way
let opt = document.createElement('option');
opt.appendChild(document.createTextNode('admin'));
opt.value = 'admin';
roleSelect.appendChild(opt);

opt = document.createElement('option');
opt.appendChild(document.createTextNode('user'));
opt.value = 'user';
roleSelect.appendChild(opt);

opt = document.createElement('option');
opt.appendChild(document.createTextNode('*'));
opt.value = '*';
mandateSelect.appendChild(opt);