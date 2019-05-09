let selectAction = document.getElementById("graph");
let currentChart;
let chart = document.getElementById('chart').getContext('2d');

selectAction.onchange = function (e) {
    if (!e) {
        let e = window.event;
    }

    let svalue = this.options[this.selectedIndex].value;
    if (currentChart) {
        currentChart.destroy();
    }

    if (svalue === "line") {
        currentChart = new Chart(chart).Line(buyerData);
    } else if (svalue === "pie") {
        currentChart = new Chart(chart).Pie(pieData, pieOptions);
    } else if (svalue === "bar") {
        currentChart = new Chart(chart).Bar(barData);
    }
}

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