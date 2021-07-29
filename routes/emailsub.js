const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const User = require("../models/User");

router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;
    await User.findOne({
      email: email,
    }).then((user) => {
      if (user) {
        if (user.emailUpdates === "out" && email === req.user.email) {
          user.emailUpdates = "in";
          user.save((err) => {
            req.flash("success_msg", "Email subscribed to our newsletter!");
            req.session.save(() => {
              res.redirect("/home");
            });
          });
        } else {
          req.flash("warning_msg", "Already subscribed");
          req.session.save(() => {
            res.redirect("/home");
          });
        }
      } else {
        req.flash("error_msg", "Please use your email only!");
        req.session.save(() => {
          res.redirect("/home");
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

module.exports = router;
