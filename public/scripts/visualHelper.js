/** TODO: just an example for now, needs to be reworked to use sql data and display 
 *  also display correct visualization options for the currently loaded in data
 */
let currentChart;
// Get elements from document to be place graphs into them
let selectAction = document.getElementById("graph");
let chart = document.getElementById('chart').getContext('2d');

// Listens for changes in select element
selectAction.onchange = function (e) {
    if (!e) {
        let e = window.event;
    }

    // Get selected index from select element
    let svalue = this.options[this.selectedIndex].value;

    // Destroy the current chart to prevent overlapping
    if (currentChart) {
        currentChart.destroy();
    }

    // Display new graph depending on which model the user selected
    if (svalue === "line") {
        currentChart = new Chart(chart).Line(buyerData);
    } else if (svalue === "pie") {
        currentChart = new Chart(chart).Pie(pieData, pieOptions);
    } else if (svalue === "bar") {
        currentChart = new Chart(chart).Bar(barData);
    }
}

// Data for displaying current example on web page
let buyerData = {
    labels: ["Januar", "Februar", "März", "April", "Mai", "Juni"],
    datasets: [{
        fillColor: "rgba(172,194,132,0.4)",
        strokeColor: "#ACC26D",
        pointColor: "#fff",
        pointStrokeColor: "#9DB86D",
        data: [203, 156, 99, 251, 305, 247]
    }]
}

let pieData = [{
        value: 20,
        color: "#878BB6"
    },
    {
        value: 40,
        color: "#4ACAB4"
    },
    {
        value: 10,
        color: "#FF8153"
    },
    {
        value: 30,
        color: "#FFEA88"
    }
];

let pieOptions = {
    segmentShowStroke: false,
    animateScale: true
}

let barData = {
    labels: ["January", "February", "March", "April", "May", "June"],
    datasets: [{
            fillColor: "#48A497",
            strokeColor: "#48A4D1",
            data: [456, 479, 324, 569, 702, 600]
        },
        {
            fillColor: "rgba(73,188,170,0.4)",
            strokeColor: "rgba(72,174,209,0.4)",
            data: [364, 504, 605, 400, 345, 320]
        }
    ]
}