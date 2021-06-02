// scroll reveal lib
ScrollReveal().reveal(".tagline1", { delay: 500 });
ScrollReveal().reveal(".tagline2", { delay: 750 });
ScrollReveal().reveal(".tagline3", { delay: 1000 });
ScrollReveal().reveal(".tagline4", { delay: 1150 });

//aos
AOS.init();

// text editor
// CKEDITOR.replace("body", {
//   plugins:
//     "wysiwygarea, toolbar, basicstyles,link,image,clipboard,colorbutton,mentions,undo",
// });
tinymce.init({
  selector: "#body",
  plugins:
    "a11ychecker advcode casechange formatpainter linkchecker autolink lists checklist media mediaembed pageembed permanentpen powerpaste table advtable tinycomments tinymcespellchecker",
  toolbar:
    "a11ycheck addcomment showcomments casechange checklist code formatpainter pageembed permanentpen table",
  toolbar_mode: "floating",
  tinycomments_mode: "embedded",
  tinycomments_author: "Author name",
});

tinymce.init({
  selector: "#desc",
  plugins:
    "a11ychecker advcode casechange formatpainter linkchecker autolink lists checklist media mediaembed pageembed permanentpen powerpaste table advtable tinycomments tinymcespellchecker",
  toolbar:
    "a11ycheck addcomment showcomments casechange checklist code formatpainter pageembed permanentpen table",
  toolbar_mode: "floating",
  tinycomments_mode: "embedded",
  tinycomments_author: "Author name",
});

// CKEDITOR.replace("desc", {
//   plugins:
//     "wysiwygarea, toolbar, basicstyles,link,image,clipboard,colorbutton,mentions,undo",
// });

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
