const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const User = require("../models/User");
const Offer = require("../models/Offer");
const Voucher = require("../models/Voucher");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// offers page
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const offerbyuser = await Voucher.find({ user: req.user.id })
      .populate("user")
      .populate("offer")
      .populate("post")
      .lean();

    res.render("offers", {
      layout: "layouts/layout",
      offerbyuser,
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

// get change password
router.get(
  "/changepassword",
  ensureAuthenticated,

  async (req, res) => {
    try {
      const loggedUser = await User.findById({ _id: req.user.id }).lean();
      if (loggedUser) {
        res.render("changePassword", {
          layout: "layouts/layout",
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/404");
    }
  }
);

router.post(
  "/changepassword/:id",
  ensureAuthenticated,

  async (req, res) => {
    try {
      const userDetail = await User.findById({ _id: req.params.id });
      const { passwordold, passwordnew } = req.body;
      if (!userDetail) {
        req.flash(
          "error_msg",
          "Cannot change password. Security issue detected!"
        );
        req.session.save(() => {
          res.redirect("/dashboard/changepassword");
        });
      }

      if (passwordold === passwordnew) {
        req.flash(
          "error_msg",
          "Your new password matches the old one. Please use another password."
        );
        req.session.save(() => {
          res.redirect("/dashboard/changepassword");
        });
      } else {
        bcrypt.compare(passwordold, userDetail.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            userDetail.password = passwordnew;
            userDetail.save();
            //   mail
            var smtpTransport = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: process.env.ID,
                pass: process.env.PASS,
              },
            });
            var mailOptions = {
              to: userDetail.email,
              from: "Getting Lively",
              subject: "Your password has been changed",
              text:
                "Hello,\n\n" +
                "This is a confirmation that the password for your account " +
                userDetail.email +
                " has just been changed.\n",
            };
            smtpTransport
              .sendMail(mailOptions)

              .catch((err) => console.log(err));
            req.flash("success_msg", "Password changed successfully.");
            req.session.save(() => {
              res.redirect("/dashboard");
            });
          } else {
            req.flash("error_msg", "You have entered wrong password.");
            req.session.save(() => {
              res.redirect("/dashboard/changepassword");
            });
          }
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/404");
    }
  }
);

module.exports = router;
