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
};
