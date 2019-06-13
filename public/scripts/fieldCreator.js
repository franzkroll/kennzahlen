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
        text2.setAttribute('required', 'required');
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