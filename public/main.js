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
          <div class="uk-card-media-top">
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
if (document.querySelector("#card-container")) {
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

    const paymentResponse = await fetch(`/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (paymentResponse.ok) {
      return paymentResponse.json();
    }

    const errorBody = await paymentResponse.text();
    throw new Error(errorBody);
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
        displayPaymentResults("SUCCESS");

        console.debug("Payment Success", paymentResults);
      } catch (e) {
        cardButton.disabled = false;
        displayPaymentResults("FAILURE");
        console.error(e.message);
      }
    }

    const cardButton = document.getElementById("card-button");
    cardButton.addEventListener("click", async function (event) {
      await handlePaymentMethodSubmission(event, card);
    });
  });
}
