const User = require("../models/User");

module.exports = {
  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    res.redirect("/users/login");
  },

  ensureGuest: (req, res, next) => {
    if (req.isAuthenticated()) {
      res.redirect("/home");
    } else {
      return next();
    }
  },

  ensureAdmin: (req, res, next) => {
    if (req.user.role === "admin") {
      return next();
    } else {
      res.redirect("/home");
    }
  },
  ensureBusiness: (req, res, next) => {
    if (req.user.role === "business") {
      return next();
    } else {
      res.redirect("/home");
    }
  },
};
