let i = 2;

window.addEventListener("load", function () {
    document.getElementById("add").addEventListener("click", function () {
        var div = document.createElement("div");

        var text = document.createElement("input");
        text.setAttribute("type", "text");
        text.setAttribute("name", "var" + i);
        text.setAttribute("placeholder", "Eigenschaft " + i);

        i++;

        div.appendChild(text);

        document.getElementById("container").appendChild(div);
    });
});