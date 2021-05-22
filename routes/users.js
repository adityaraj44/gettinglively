const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const { ensureGuest } = require("../middlewares/auth");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const async = require("async");
const jwt = require("jsonwebtoken");
// user model
const User = require("../models/User");

// login page
router.get("/login", ensureGuest, (req, res) => {
  res.render("login", {
    layout: "layouts/auth",
  });
});

// register page
router.get("/register", ensureGuest, (req, res) => {
  res.render("signup", {
    layout: "layouts/auth",
  });
});

// post register
router.post("/register", (req, res) => {
  const verifytoken = jwt.sign({ email: req.body.email }, process.env.SECRET);
  const { name, email, password } = req.body;
  let errors = [];
  if (!name || !email || !password) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }
  if (errors.length > 0) {
    res.render("signup", {
      errors,
      name,
      email,
      password,
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        errors.push({ msg: "Email already exists" });
        res.render("signup", {
          errors,
          name,
          email,
          password,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
          confirmationCode: verifytoken,
        });

        newUser.save().then((user) => {
          req.flash(
            "success_msg",
            "You are now registered! Please check your email for verification"
          );
          res.redirect("/users/register");
        });
      }
    });
  }
  // nodemailer
  var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "punk43496@gmail.com",
      pass: "punk43496",
    },
  });
  var mailOptions = {
    to: email,
    from: "GettingLively.com",
    subject: "Getting Lively Email Verification",
    text:
      "You are receiving this because you need to verify your email.\n\n" +
      "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
      "http://" +
      req.headers.host +
      "/users/verify/" +
      verifytoken +
      "\n\n" +
      "If you did not request this, please ignore this email.\n",
  };
  smtpTransport.sendMail(mailOptions).catch((err) => console.log(err));
});

// verify user email
router.get("/verify/:token", ensureGuest, (req, res) => {
  User.findOne({
    confirmationCode: req.params.token,
  })
    .then((user) => {
      req.flash("success_msg", "Account verified successfully!");
      if (!user) {
        req.flash("error_msg", "User not found");
      }

      user.status = "Active";

      user.save((err) => {
        res.render("verify", {
          layout: "layouts/auth",
        });

        if (err) {
          res.status(500).send({ message: err });
          return;
        }
      });
    })
    .catch((e) => console.log("error", e));
});

// login handle
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/home",
    failureMessage: req.flash("error_msg", "Email or Password is incorrect"),
    failureRedirect: "/users/login",
  })(req, res, next);
});

// logouthandle
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/users/login");
});

// forgotpass
router.get("/forgot", ensureGuest, (req, res) => {
  res.render("forgotpassword", {
    layout: "layouts/auth",
  });
});

// post forgot email
router.post("/forgot", (req, res) => {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash(
              "error_msg",
              "No account with that email address exists."
            );
            return res.redirect("/users/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "punk43496@gmail.com",
            pass: "punk43496",
          },
        });
        var mailOptions = {
          to: user.email,
          from: "GettingLively.com",
          subject: "Getting Lively Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/users/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash(
            "success_msg",
            "An e-mail has been sent to " +
              user.email +
              " with further instructions."
          );
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/users/forgot");
    }
  );
});

// reset page
router.get("/reset/:token", ensureGuest, function (req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash(
          "error_msg",
          "Password reset token is invalid or has expired."
        );
        return res.redirect("/users/forgot");
      }
      res.render("reset", {
        layout: "layouts/auth",
        resetPasswordToken: req.params.token,
      });
    }
  );
});

// reset post
router.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              req.flash(
                "error_msg",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }

            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err) {
              if (err) {
                req.flash("error_msg", "Error in changing password");
                return res.redirect("/users/login");
              } else {
                req.logIn(user, function (err) {
                  done(err, user);
                });
              }
            });
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "punk43496@gmail.com",
            pass: "punk43496",
          },
        });
        var mailOptions = {
          to: user.email,
          from: "passwordreset@demo.com",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/users/login");
    }
  );
});

module.exports = router;
