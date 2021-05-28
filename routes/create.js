const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const nodemailer = require("nodemailer");

router.get("/", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    // render create view
    res.render("admin/create", {
      layout: "layouts/layout",
    });
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

router.post(
  "/emailupdates",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { subject, body } = req.body;
      let errors = [];
      if (!subject || !body) {
        errors.push({ msg: "Please enter all fields" });
      }
      if (errors.length > 0) {
        req.flash("error_msg", "Please enter all the fields");
        res.render("admin/create", {
          layout: "layouts/layout",
          subject: subject,
        });
      } else {
        const users = await User.find({ emailUpdates: "in" });
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "gettinglivelytest@gmail.com",
            pass: "sahilkumar@123",
          },
        });
        users.forEach((user) => {
          var mailOptions = {
            to: user.email,
            from: "GettingLively.com",
            subject: subject,
            html: `${body}`,
          };
          smtpTransport
            .sendMail(mailOptions)

            .catch((err) => console.log(err));
        });
        req.flash("success_msg", "Emails sent successfully");
        res.redirect("/admincreate");
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

module.exports = router;
