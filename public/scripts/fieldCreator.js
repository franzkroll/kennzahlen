// Used in the creation of new measures, creates a new field for an attribute every time the add field button is pressed
window.addEventListener("load", function () {
    let i = 2;
    document.getElementById("add").addEventListener("click", function () {
        // Create div and corresponding text field ... 
        var div = document.createElement("div");
        var text = document.createElement("input");
        text.setAttribute("type", "text");
        text.setAttribute("name", "var" + i);
        text.setAttribute("placeholder", "Eigenschaft " + i);
        text.setAttribute("title", "Geben Sie hier eine Beschreibung für die Eigenschaft der Kennzahl ein.");

        i++;

        // ... and add it to the container
        div.appendChild(text);
        document.getElementById("container").appendChild(div);
    });
});