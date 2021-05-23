module.exports = {
  showAdminOption: (loggedUser) => {
    if (loggedUser.role == "admin") {
      return `<nav class="uk-navbar-container " uk-navbar>
      <div class="uk-navbar-center uk-light">
  
          <ul class="uk-navbar-nav">
             
              <li>
                  <a href="/admin" class="uk-button uk-button-text
                  noSelect uk-text-large">Go To Admin Dashboard</a>
                  
              </li>
              
          </ul>
  
      </div>
  </nav>`;
    } else {
      return "";
    }
  },
  formatDate: (date, format) => {
    return moment(date).format(format);
  },
};
