// scroll reveal lib
ScrollReveal().reveal(".tagline1", { delay: 500 });
ScrollReveal().reveal(".tagline2", { delay: 750 });
ScrollReveal().reveal(".tagline3", { delay: 1000 });
ScrollReveal().reveal(".tagline4", { delay: 1150 });

//aos
AOS.init();

// charts

// <block:setup:1>
const labels = ["January", "February", "March", "April", "May", "June"];
const data = {
  labels: labels,
  datasets: [
    {
      label: "My First dataset",
      backgroundColor: "#ec4d37",
      borderColor: "#ec4d37",
      data: [0, 10, 5, 2, 20, 30, 45],
    },
  ],
};
// </block:setup>

// <block:config:0>
const config = {
  type: "line",
  data,
  options: {},
};

var myChart = new Chart(document.getElementById("myChart"), config);
var myChart2 = new Chart(document.getElementById("myChart2"), config);
var myChart3 = new Chart(document.getElementById("myChart3"), config);
var myChart4 = new Chart(document.getElementById("myChart4"), config);
