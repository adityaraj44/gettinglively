// scroll reveal lib
ScrollReveal().reveal(".tagline1", { delay: 500 });
ScrollReveal().reveal(".tagline2", { delay: 750 });
ScrollReveal().reveal(".tagline3", { delay: 1000 });
ScrollReveal().reveal(".tagline4", { delay: 1150 });

//aos
AOS.init();

//places
$(document).ready(() => {
  var autocomplete;
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("searchinput"),
    {
      types: ["geocode"],
      componentRestrictions: {
        country: "uk",
      },
    }
  );

  google.maps.event.addEventListener(autocomplete, "place_changed", () => {
    var near_place = autocomplete.getPlace();
  });
});
