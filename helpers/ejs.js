const moment = require("moment");

module.exports = {
  showAdminOption: (loggedUser) => {
    if (loggedUser.role == "admin") {
      return ``;
    } else {
      return "";
    }
  },
  formatDate: (date, format) => {
    return moment(date).format(format);
  },
  truncate: function (str, len) {
    if (str.length > len && str.length > 0) {
      let new_str = str + " ";
      new_str = str.substr(0, len);
      new_str = str.substr(0, new_str.lastIndexOf(" "));
      new_str = new_str.length > 0 ? new_str : str.substr(0, len);
      return new_str + "...";
    }
    return str;
  },
  getEntryUser: function (loggedUser, entryUser) {
    if (
      loggedUser.role === "admin" ||
      loggedUser._id.toString() == entryUser._id.toString()
    ) {
      return `<span
      ><a href="#editEntryAdmin"  uk-toggle  class="uk-button uk-button-secondary noSelect"
        >Edit</a
      ></span
    >

    <span
      ><a
        href="#deleteEntryAdmin" uk-toggle
        class="uk-button uk-button-danger noSelect uk-marign-small-right"
        >Delete</a
      ></span
    >`;
    } else {
      return ``;
    }
  },
  getBusinessEntryUser: function (loggedUser, entryUser) {
    if (loggedUser._id.toString() == entryUser._id.toString()) {
      return `<span
      ><a href="#editBusinessEntry"  uk-toggle  class="uk-button uk-button-secondary noSelect"
        >Edit</a
      ></span
    >

    <span
      ><a
        href="#deleteBusinessEntry" uk-toggle
        class="uk-button uk-button-danger noSelect uk-marign-small-right"
        >Delete</a
      ></span
    >`;
    } else {
      return ``;
    }
  },
  getReviewStatus: function (entry) {
    if (entry.reviewStatus == "inprocess") {
      return `<span
          ><a
            href="#markasreviewed" uk-toggle
            class="uk-button uk-button-primary noSelect uk-marign-small-right"
            >Mark as reviewed</a
          ></span
        >`;
    } else {
      return `<span class="uk-label uk-label-success uk-margin-large-left">Reviewed</span>`;
    }
  },
  getFooter: function (user) {
    if (user && user.role == "business") {
      return `<div
         class="uk-width-2-4@s uk-light uk-text-center@s uk-margin-small-left"
       >
         <a
           href="/docs/termsandconditions.html" target="blank"
           class="uk-button uk-button-text uk-margin-medium-right noSelect"
           
           >Terms and Conditions</a
         >
 
         <a
           href="/docs/privacypolicy.html" target="blank"
           class="uk-button-text uk-button noSelect uk-margin-medium-right"
           >Privacy Policy</a
         >
         <a
           href="/docs/termsofuse.html" target="blank"
           class="uk-button-text uk-button noSelect uk-margin-medium-right"
           >Terms Of Use</a
         >
       </div>`;
    } else {
      return `<div
        class="uk-width-2-4@s uk-light uk-text-center@s uk-margin-small-left"
      >
        <a
          href="#terms"
          class="uk-button uk-button-text uk-margin-medium-right noSelect"
          uk-toggle
          >Terms and Conditions</a
        >

        <a
          href="#privacypolicy"
          class="uk-button-text uk-button noSelect uk-margin-medium-right" uk-toggle
          >Privacy Policy</a
        >
        <a
          href="#enduser"
          class="uk-button-text uk-button noSelect uk-margin-medium-right" uk-toggle
          >End User License Agreement</a
        >
      </div>`;
    }
  },
  getBusinessOfferUser: function (loggedUser, entryuser) {
    if (loggedUser._id.toString() == entryuser._id.toString()) {
      return `
        <span
      ><a href="#editOffer"  uk-toggle  class="uk-button uk-button-secondary noSelect"
        >Edit</a
      ></span
    >

    <span
      ><a
        href="#deleteOffer" uk-toggle
        class="uk-button uk-button-danger noSelect uk-marign-small-right"
        >Delete</a
      ></span
    >
        `;
    } else {
      return ``;
    }
  },
  getAdminOfferform: function (loggedUser, entryuser) {
    if (loggedUser._id.toString() == entryuser._id.toString()) {
      return `
          <div class="uk-card uk-card-hover uk-card-default uk-margin-top">
            <div class="uk-card-body">
              <h1 class="uk-card-title uk-text-center">Add Offers</h1>
              <form action="/admincreate/createoffer/<%- entry._id %>" method="POST">
                <div class="uk-form-stacked">
                    <div class="uk-margin-small">
                        <div class="uk-form-control">
                            <input class="uk-input uk-form-large noSelect" required type="text" name="offername" 
                            placeholder="Title of offer"  value="<%= typeof offername != 'undefined' ? offername : '' %>" />
                        </div>
                        <div class="uk-form-control uk-margin-small-top">
                            <label for="desc" class="uk-text-meta"
                              >Full Description of the offer.</label
                            >
                            <textarea
                              required
                                
                              name="offerdesc"
                              class="uk-textarea"
                            ></textarea
                            >
                          </div>
                          <div class="uk-form-control">
                            <input
                              required
                              type="number"
                              name="offeramount"
                              id="offeramount"
                              placeholder="Enter offer amount in USD"
                              class="uk-input uk-form-large noSelect"
                              
                            />
                          </div>
                    </div>
                    <div class="uk-margin-medium uk-text-center">
                        <div class="uk-form-control">
                            <button
                              type="submit"
                              class="uk-button uk-button-custom noSelect"
                            >
                              Post
                            </button>
                          </div>
                    </div>
                </div>
            </form>
            </div>
          </div>`;
    } else {
      return ``;
    }
  },
  getBusinessOfferform: function (loggedUser, entryuser) {
    if (loggedUser._id.toString() == entryuser._id.toString()) {
      return `
      <div class="uk-card uk-card-hover uk-card-default uk-margin-top">
      <div class="uk-card-body">
        <h1 class="uk-card-title uk-text-center">Add Offers</h1>
        <form action="/business/createoffer/<%- entry._id %>" method="POST">
          <div class="uk-form-stacked">
              <div class="uk-margin-small">
                  <div class="uk-form-control">
                      <input class="uk-input uk-form-large noSelect" required type="text" name="offername" 
                      placeholder="Title of offer" />
                  </div>
                  <div class="uk-form-control uk-margin-small-top">
                      <label for="desc" class="uk-text-meta"
                        >Full Description of the offer.</label
                      >
                      <textarea
                        required
                          
                        name="offerdesc"
                        class="uk-textarea"
                      ></textarea
                      >
                    </div>
                    <div class="uk-form-control">
                      <input
                        required
                        type="number"
                        name="offeramount"
                        id="offeramount"
                        placeholder="Enter offer amount in USD"
                        class="uk-input uk-form-large noSelect"
                        value="<%= typeof offeramount != 'undefined' ? offeramount: '' %>"
                      />
                    </div>
              </div>
              <div class="uk-margin-medium uk-text-center">
                  <div class="uk-form-control">
                      <button
                        type="submit"
                        class="uk-button uk-button-custom noSelect"
                      >
                        Post
                      </button>
                    </div>
              </div>
          </div>
      </form>
      </div>
    </div>`;
    } else {
      return ``;
    }
  },
};
