// scroll reveal lib
ScrollReveal().reveal(".tagline1", { delay: 500 });
ScrollReveal().reveal(".tagline2", { delay: 750 });
ScrollReveal().reveal(".tagline3", { delay: 1000 });
ScrollReveal().reveal(".tagline4", { delay: 1150 });

//aos
AOS.init();

// text editor
CKEDITOR.replace("body", {
  plugins:
    "wysiwygarea, toolbar, basicstyles,link,image,clipboard,colorbutton,mentions,undo",
});

CKEDITOR.replace("desc", {
  plugins:
    "wysiwygarea, toolbar, basicstyles,link,image,clipboard,colorbutton,mentions,undo",
});

// algolia
const search = instantsearch({
  indexName: "dev_BARS",
  searchClient: algoliasearch("5XADSF6L2U", "50d12b33efa2a813b77e2dcfa3643286"),
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
