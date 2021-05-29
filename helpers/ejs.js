const moment = require("moment");

module.exports = {
  showAdminOption: (loggedUser) => {
    if (loggedUser.role == "admin") {
      return `<nav class="uk-navbar-container " uk-navbar>
      <div class="uk-navbar-right uk-light">
  
          <ul class="uk-navbar-nav">
             
              <li>
                  <a href="/admin" class="uk-button uk-button-text
                  noSelect uk-text-large">Go To Admin Dashboard</a>
                  
              </li>

              <li>
        <a href="/users/logout" class="uk-button-text noSelect uk-margin-medium-right"
        uk-toggle="target: #userslogout"
          ><span class=" noSelect"></span> Logout</a
        >
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
  showUserOption: (loggedUser) => {
    if (loggedUser) {
      return `<nav class="uk-navbar-container " uk-navbar>
        <div class="uk-navbar-right uk-light">
    
            <ul class="uk-navbar-nav">
  
                <li>
          <a href="/users/logout" class="uk-button-text noSelect uk-margin-medium-right"
          uk-toggle="target: #userslogout"
            ><span class=" noSelect"></span> Logout</a
          >
        </li>
                
            </ul>
    
        </div>
    </nav>`;
    } else {
      `<nav class="uk-navbar-container " uk-navbar>
      <div class="uk-navbar-right uk-light">
  
          <ul class="uk-navbar-nav">
             
            
          <li>
          <a href="/users/login" class="uk-button-text noSelect uk-margin-medium-right"
          uk-toggle="target: #userslogout"
            ><span class=" noSelect"></span>Login/SignUp</a
          >
        </li>
              
          </ul>
  
      </div>
  </nav>`;
    }
  },
};
