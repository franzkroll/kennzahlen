// Simple helper script for displaying elements in the help page of the system
var coll = document.getElementsByClassName("collapsible");
var i;

// Add collapsing function for every element in collapsible class
for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
}