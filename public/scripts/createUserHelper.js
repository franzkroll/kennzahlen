/**
 * Handles filling of dropdown menus for mandate and role select menus.
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