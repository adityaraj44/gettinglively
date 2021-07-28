// import algoliasearch from "algoliasearch";

//map
if (document.querySelector("#map-canvas")) {
  var geocoder;
  var map;
  var fulladdress = document.getElementById("address");
  //   var address = "Kumhrar Chanakya Nagar, Patna";
  var address = fulladdress.innerText;

  function initialize() {
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(25.596, 85.1839);
    var myOptions = {
      zoom: 16,
      center: latlng,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      },
      navigationControl: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };
    map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
    if (geocoder) {
      geocoder.geocode(
        {
          address: address,
        },
        function (results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
              map.setCenter(results[0].geometry.location);

              var infowindow = new google.maps.InfoWindow({
                content: "<b>" + address + "</b>",
                size: new google.maps.Size(150, 50),
              });

              var marker = new google.maps.Marker({
                position: results[0].geometry.location,
                map: map,
                title: address,
                // icon: "https://img.icons8.com/color/48/000000/map-pin.png",
              });
              google.maps.event.addListener(marker, "click", function () {
                infowindow.open(map, marker);
              });
            } else {
              alert("No results found");
            }
          } else {
            alert(
              "Geocode was not successful for the following reason: " + status
            );
          }
        }
      );
    }
  }
  google.maps.event.addDomListener(window, "load", initialize);
}

// function initMap() {
//   // The location of Uluru
//   const uluru = { lat: 25.5941, lng: 85.1376 };
//   // The map, centered at Uluru
//   const map = new google.maps.Map(document.getElementById("map-canvas"), {
//     zoom: 16,
//     center: uluru,
//   });
//   // The marker, positioned at Uluru
//   const marker = new google.maps.Marker({
//     position: uluru,
//     map: map,
//   });
// }

// google.maps.event.addDomListener(window, "load", initMap);

// scroll reveal lib
if (
  document.querySelector(".tagline1") ||
  document.querySelector(".tagline2") ||
  document.querySelector(".tagline3") ||
  document.querySelector(".tagline4")
) {
  ScrollReveal().reveal(".tagline1", { delay: 500 });
  ScrollReveal().reveal(".tagline2", { delay: 750 });
  ScrollReveal().reveal(".tagline3", { delay: 1000 });
  ScrollReveal().reveal(".tagline4", { delay: 1150 });
}

//aos
AOS.init();

if (document.querySelector("#body")) {
  // text editor
  CKEDITOR.replace("body", {
    plugins:
      "wysiwygarea, toolbar, basicstyles,link,image,clipboard,colorbutton,mentions,undo",
  });
}

if (document.querySelector("#desc")) {
  CKEDITOR.replace("desc", {
    plugins:
      "wysiwygarea, toolbar, basicstyles,link,image,clipboard,colorbutton,mentions,undo",
  });
}

if (document.querySelector("#barsearch")) {
  // get current latlong

  //     const client = algoliasearch(
  //       "5XADSF6L2U",
  //       "e6d714070ce02fc5eedd1d79330eec5e"
  //     );
  //     const index = client.initIndex("dev_BARS");

  //     index
  //       .search("", {
  //         aroundLatLng: `${latitude},${longitude}`,
  //       })
  //       .then(({ hits }) => {
  //         console.log(hits);
  //       });
  //   });
  // algolia
  const search = instantsearch({
    indexName: "dev_BARS",
    searchClient: algoliasearch(
      "5XADSF6L2U",
      "50d12b33efa2a813b77e2dcfa3643286"
    ),
  });

  search.addWidgets([
    instantsearch.widgets.searchBox({
      container: "#barsearch",
    }),

    instantsearch.widgets.hits({
      container: "#hits",
      templates: {
        item: `
        <div>
        <a href="/places/entries/entry/{{entry._id}}" class="noSelect"
        ><div class="uk-card uk-card-hover uk-card-default">
          <div class="uk-card-media-top entryimg">
            <div class="uk-clearfix uk-position-absolute">
              <span
                class="
                  uk-label
                  uk-float-left
                  uk-label-danger
                  uk-text-medium
                  uk-text-bold
                "
                >{{entry.typeOfPlace}}</span
              >
              <span
                class="
                  uk-label
                  uk-float-left
                  uk-label-primary
                  uk-text-medium
                  uk-text-bold
                "
                >{{entry.bookingStatus}}</span
              >
            </div>
            <img src="{{entry.cover}}" alt="<%- entry.cover %>" />
          </div>
          <div
            class="
              uk-card-footer
              uk-card-secondary
              uk-text-left
              uk-text-default
              uk-text-bold
            "
          >
            {{entry.name}}
          </div>
        </div></a
      >
      </div>
          `,
      },
    }),
    instantsearch.widgets.pagination({
      container: "#pagination",
    }),
  ]);

  search.start();
}

//  payment
if (document.querySelector("#card-container-voucher")) {
  // payment

  const appId = "sandbox-sq0idb-n_FZsMrbW0gzIkB2hKezLA";
  const locationId = "WDX1WFYN7TBWD";

  //   const appId = "sq0idp-gQwtYrVYBBKybGskRxvgVA";
  //   const locationId = "LZ6W6KA5YDE19";

  async function initializeCard(payments) {
    const card = await payments.card();
    await card.attach("#card-container");

    return card;
  }

  async function createPayment(token) {
    const body = JSON.stringify({
      locationId,
      sourceId: token,
    });

    let action = document.getElementById("payment-form").action;

    const paymentResponse = await fetch(`${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (paymentResponse.ok) {
      return paymentResponse.text();
    }

    // const errorBody = await paymentResponse.text();
    // throw new Error(errorBody);
  }

  async function tokenize(paymentMethod) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === "OK") {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }

      throw new Error(errorMessage);
    }
  }

  // status is either SUCCESS or FAILURE;
  function displayPaymentResults(status) {
    const statusContainer = document.getElementById("payment-status-container");
    if (status === "SUCCESS") {
      statusContainer.classList.remove("is-failure");
      statusContainer.classList.add("is-success");
    } else {
      statusContainer.classList.remove("is-success");
      statusContainer.classList.add("is-failure");
    }

    statusContainer.style.visibility = "visible";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.Square) {
      throw new Error("Square.js failed to load properly");
    }

    let payments;
    try {
      payments = window.Square.payments(appId, locationId);
    } catch {
      const statusContainer = document.getElementById(
        "payment-status-container"
      );
      statusContainer.className = "missing-credentials";
      statusContainer.style.visibility = "visible";
      return;
    }

    let card;
    try {
      card = await initializeCard(payments);
    } catch (e) {
      console.error("Initializing Card failed", e);
      return;
    }

    // Checkpoint 2.
    async function handlePaymentMethodSubmission(event, paymentMethod) {
      event.preventDefault();

      try {
        // disable the submit button as we await tokenization and make a payment request.
        cardButton.disabled = true;
        const token = await tokenize(paymentMethod);
        const paymentResults = await createPayment(token);
        // displayPaymentResults("SUCCESS");
        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();

        console.debug("Payment Success", paymentResults);
      } catch (e) {
        cardButton.disabled = false;
        displayPaymentResults("FAILURE");
        console.error(e.message);
        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
      }
    }

    const cardButton = document.getElementById("card-button");
    cardButton.addEventListener("click", async function (event) {
      await handlePaymentMethodSubmission(event, card);
    });
  });
}

// entry creation
// entry

//  payment for entry creation
if (document.querySelector("#card-container-entry")) {
  // payment

  const appId = "sandbox-sq0idb-n_FZsMrbW0gzIkB2hKezLA";
  const locationId = "WDX1WFYN7TBWD";

  //   const appId = "sq0idp-gQwtYrVYBBKybGskRxvgVA";
  //   const locationId = "LZ6W6KA5YDE19";

  async function initializeCard(payments) {
    const card = await payments.card();
    await card.attach("#card-container");

    return card;
  }

  async function createPayment(token) {
    const body = JSON.stringify({
      locationId,
      sourceId: token,
    });

    let action = document.getElementById("payment-form-entry").action;

    const paymentResponse = await fetch(`${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (paymentResponse.ok) {
      return paymentResponse.text();
    }

    // const errorBody = await paymentResponse.text();
    // throw new Error(errorBody);
  }

  async function tokenize(paymentMethod) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === "OK") {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }

      throw new Error(errorMessage);
    }
  }

  // status is either SUCCESS or FAILURE;
  function displayPaymentResults(status) {
    const statusContainer = document.getElementById("payment-status-container");
    if (status === "SUCCESS") {
      statusContainer.classList.remove("is-failure");
      statusContainer.classList.add("is-success");
    } else {
      statusContainer.classList.remove("is-success");
      statusContainer.classList.add("is-failure");
    }

    statusContainer.style.visibility = "visible";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.Square) {
      throw new Error("Square.js failed to load properly");
    }

    let payments;
    try {
      payments = window.Square.payments(appId, locationId);
    } catch {
      const statusContainer = document.getElementById(
        "payment-status-container"
      );
      statusContainer.className = "missing-credentials";
      statusContainer.style.visibility = "visible";
      return;
    }

    let card;
    try {
      card = await initializeCard(payments);
    } catch (e) {
      console.error("Initializing Card failed", e);
      return;
    }

    // Checkpoint 2.
    async function handlePaymentMethodSubmission(event, paymentMethod) {
      event.preventDefault();

      try {
        // disable the submit button as we await tokenization and make a payment request.
        cardButton.disabled = true;
        const token = await tokenize(paymentMethod);
        const paymentResults = await createPayment(token);
        // displayPaymentResults("SUCCESS");
        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
        window.location.href = "/business/reviewentries";

        //   displayPaymentResults("SUCCESS");

        console.debug("Payment Success", paymentResults);
      } catch (e) {
        cardButton.disabled = false;
        displayPaymentResults("FAILURE");
        console.error(e.message);
        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
        window.location.href = "/business/reviewentries";
      }
    }

    const cardButton = document.getElementById("card-button");
    cardButton.addEventListener("click", async function (event) {
      await handlePaymentMethodSubmission(event, card);
    });
  });
}

//  payment for premier plan
if (document.querySelector("#card-container-premier")) {
  // payment

  const appId = "sandbox-sq0idb-n_FZsMrbW0gzIkB2hKezLA";
  const locationId = "WDX1WFYN7TBWD";

  //   const appId = "sq0idp-gQwtYrVYBBKybGskRxvgVA";
  //   const locationId = "LZ6W6KA5YDE19";

  async function initializeCard(payments) {
    const card = await payments.card();
    await card.attach("#card-container");

    return card;
  }

  async function createPayment(token) {
    const body = JSON.stringify({
      locationId,
      sourceId: token,
    });

    let action = document.getElementById("payment-form-premier").action;

    const paymentResponse = await fetch(`${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (paymentResponse.ok) {
      return paymentResponse.text();
    }

    // const errorBody = await paymentResponse.text();
    // throw new Error(errorBody);
  }

  async function tokenize(paymentMethod) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === "OK") {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }

      throw new Error(errorMessage);
    }
  }

  // status is either SUCCESS or FAILURE;
  function displayPaymentResults(status) {
    const statusContainer = document.getElementById("payment-status-container");
    if (status === "SUCCESS") {
      statusContainer.classList.remove("is-failure");
      statusContainer.classList.add("is-success");
    } else {
      statusContainer.classList.remove("is-success");
      statusContainer.classList.add("is-failure");
    }

    statusContainer.style.visibility = "visible";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.Square) {
      throw new Error("Square.js failed to load properly");
    }

    let payments;
    try {
      payments = window.Square.payments(appId, locationId);
    } catch {
      const statusContainer = document.getElementById(
        "payment-status-container"
      );
      statusContainer.className = "missing-credentials";
      statusContainer.style.visibility = "visible";
      return;
    }

    let card;
    try {
      card = await initializeCard(payments);
    } catch (e) {
      console.error("Initializing Card failed", e);
      return;
    }

    // Checkpoint 2.
    async function handlePaymentMethodSubmission(event, paymentMethod) {
      event.preventDefault();

      try {
        // disable the submit button as we await tokenization and make a payment request.
        cardButton.disabled = true;
        const token = await tokenize(paymentMethod);
        const paymentResults = await createPayment(token);
        // displayPaymentResults("SUCCESS");
        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
        window.location.href = "/business/managelisting";

        console.debug("Payment Success", paymentResults);
      } catch (e) {
        cardButton.disabled = false;
        displayPaymentResults("FAILURE");
        console.error(e.message);
        UIkit.notification({
          message: "Payment Failed...",
          pos: "top-right",
          status: "danger",
        });
        document.location.reload();
        window.location.href = "/business/managelisting";
      }
    }

    const cardButton = document.getElementById("card-button");
    cardButton.addEventListener("click", async function (event) {
      await handlePaymentMethodSubmission(event, card);
    });
  });
}

//  payment for advance plan
if (document.querySelector("#card-container-advance")) {
  // payment

  const appId = "sandbox-sq0idb-n_FZsMrbW0gzIkB2hKezLA";
  const locationId = "WDX1WFYN7TBWD";

  //   const appId = "sq0idp-gQwtYrVYBBKybGskRxvgVA";
  //   const locationId = "LZ6W6KA5YDE19";

  async function initializeCard(payments) {
    const card = await payments.card();
    await card.attach("#card-container");

    return card;
  }

  async function createPayment(token) {
    const body = JSON.stringify({
      locationId,
      sourceId: token,
    });

    let action = document.getElementById("payment-form-advance").action;

    const paymentResponse = await fetch(`${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (paymentResponse.ok) {
      return paymentResponse.text();
    }

    // const errorBody = await paymentResponse.text();
    // throw new Error(errorBody);
  }

  async function tokenize(paymentMethod) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === "OK") {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }

      throw new Error(errorMessage);
    }
  }

  // status is either SUCCESS or FAILURE;
  function displayPaymentResults(status) {
    const statusContainer = document.getElementById("payment-status-container");
    if (status === "SUCCESS") {
      statusContainer.classList.remove("is-failure");
      statusContainer.classList.add("is-success");
    } else {
      statusContainer.classList.remove("is-success");
      statusContainer.classList.add("is-failure");
    }

    statusContainer.style.visibility = "visible";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.Square) {
      throw new Error("Square.js failed to load properly");
    }

    let payments;
    try {
      payments = window.Square.payments(appId, locationId);
    } catch {
      const statusContainer = document.getElementById(
        "payment-status-container"
      );
      statusContainer.className = "missing-credentials";
      statusContainer.style.visibility = "visible";
      return;
    }

    let card;
    try {
      card = await initializeCard(payments);
    } catch (e) {
      console.error("Initializing Card failed", e);
      return;
    }

    // Checkpoint 2.
    async function handlePaymentMethodSubmission(event, paymentMethod) {
      event.preventDefault();

      try {
        // disable the submit button as we await tokenization and make a payment request.
        cardButton.disabled = true;
        const token = await tokenize(paymentMethod);
        const paymentResults = await createPayment(token);
        // displayPaymentResults("SUCCESS");

        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
        window.location.href = "/business/managelisting";

        console.debug("Payment Success", paymentResults);
      } catch (e) {
        cardButton.disabled = false;
        displayPaymentResults("FAILURE");
        console.error(e.message);

        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
        window.location.href = "/business/managelisting";
      }
    }

    const cardButton = document.getElementById("card-button");
    cardButton.addEventListener("click", async function (event) {
      await handlePaymentMethodSubmission(event, card);
    });
  });
}

//  payment for promoted plan
if (document.querySelector("#card-container-promoted")) {
  // payment

  const appId = "sandbox-sq0idb-n_FZsMrbW0gzIkB2hKezLA";
  const locationId = "WDX1WFYN7TBWD";

  //   const appId = "sq0idp-gQwtYrVYBBKybGskRxvgVA";
  //   const locationId = "LZ6W6KA5YDE19";

  async function initializeCard(payments) {
    const card = await payments.card();
    await card.attach("#card-container");

    return card;
  }

  async function createPayment(token) {
    const body = JSON.stringify({
      locationId,
      sourceId: token,
    });

    let action = document.getElementById("payment-form-promoted").action;

    const paymentResponse = await fetch(`${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (paymentResponse.ok) {
      return paymentResponse.text();
    }

    // const errorBody = await paymentResponse.text();
    // throw new Error(errorBody);
  }

  async function tokenize(paymentMethod) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === "OK") {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }

      throw new Error(errorMessage);
    }
  }

  // status is either SUCCESS or FAILURE;
  function displayPaymentResults(status) {
    const statusContainer = document.getElementById("payment-status-container");
    if (status === "SUCCESS") {
      statusContainer.classList.remove("is-failure");
      statusContainer.classList.add("is-success");
    } else {
      statusContainer.classList.remove("is-success");
      statusContainer.classList.add("is-failure");
    }

    statusContainer.style.visibility = "visible";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.Square) {
      throw new Error("Square.js failed to load properly");
    }

    let payments;
    try {
      payments = window.Square.payments(appId, locationId);
    } catch {
      const statusContainer = document.getElementById(
        "payment-status-container"
      );
      statusContainer.className = "missing-credentials";
      statusContainer.style.visibility = "visible";
      return;
    }

    let card;
    try {
      card = await initializeCard(payments);
    } catch (e) {
      console.error("Initializing Card failed", e);
      return;
    }

    // Checkpoint 2.
    async function handlePaymentMethodSubmission(event, paymentMethod) {
      event.preventDefault();

      try {
        // disable the submit button as we await tokenization and make a payment request.
        cardButton.disabled = true;
        const token = await tokenize(paymentMethod);
        const paymentResults = await createPayment(token);
        // displayPaymentResults("SUCCESS");

        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
        window.location.href = "/business/managelisting";

        console.debug("Payment Success", paymentResults);
      } catch (e) {
        cardButton.disabled = false;
        displayPaymentResults("FAILURE");
        console.error(e.message);

        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
        window.location.href = "/business/managelisting";
      }
    }

    const cardButton = document.getElementById("card-button");
    cardButton.addEventListener("click", async function (event) {
      await handlePaymentMethodSubmission(event, card);
    });
  });
}

// payment for offer

if (document.querySelector("#card-container-offer")) {
  // payment

  const appId = "sandbox-sq0idb-n_FZsMrbW0gzIkB2hKezLA";
  const locationId = "WDX1WFYN7TBWD";

  //   const appId = "sq0idp-gQwtYrVYBBKybGskRxvgVA";
  //   const locationId = "LZ6W6KA5YDE19";

  async function initializeCard(payments) {
    const card = await payments.card();
    await card.attach("#card-container");

    return card;
  }

  async function createPayment(token) {
    const body = JSON.stringify({
      locationId,
      sourceId: token,
    });

    let action = document.getElementById("payment-form-offer").action;

    const paymentResponse = await fetch(`${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (paymentResponse.ok) {
      return paymentResponse.text();
    }

    // const errorBody = await paymentResponse.text();
    // throw new Error(errorBody);
  }

  async function tokenize(paymentMethod) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === "OK") {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }

      throw new Error(errorMessage);
    }
  }

  // status is either SUCCESS or FAILURE;
  function displayPaymentResults(status) {
    const statusContainer = document.getElementById("payment-status-container");
    if (status === "SUCCESS") {
      statusContainer.classList.remove("is-failure");
      statusContainer.classList.add("is-success");
    } else {
      statusContainer.classList.remove("is-success");
      statusContainer.classList.add("is-failure");
    }

    statusContainer.style.visibility = "visible";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.Square) {
      throw new Error("Square.js failed to load properly");
    }

    let payments;
    try {
      payments = window.Square.payments(appId, locationId);
    } catch {
      const statusContainer = document.getElementById(
        "payment-status-container"
      );
      statusContainer.className = "missing-credentials";
      statusContainer.style.visibility = "visible";
      return;
    }

    let card;
    try {
      card = await initializeCard(payments);
    } catch (e) {
      console.error("Initializing Card failed", e);
      return;
    }

    // Checkpoint 2.
    async function handlePaymentMethodSubmission(event, paymentMethod) {
      event.preventDefault();

      try {
        // disable the submit button as we await tokenization and make a payment request.
        cardButton.disabled = true;
        const token = await tokenize(paymentMethod);
        const paymentResults = await createPayment(token);
        // displayPaymentResults("SUCCESS");

        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
        window.location.href = "/business/entries/pendingpayment";

        console.debug("Payment Success", paymentResults);
      } catch (e) {
        cardButton.disabled = false;
        displayPaymentResults("FAILURE");
        console.error(e.message);

        UIkit.notification({
          message: "Payment Successfull...",
          pos: "top-right",
          status: "success",
        });
        document.location.reload();
        window.location.href = "/business/entries/pendingpayment";
      }
    }

    const cardButton = document.getElementById("card-button");
    cardButton.addEventListener("click", async function (event) {
      await handlePaymentMethodSubmission(event, card);
    });
  });
}
