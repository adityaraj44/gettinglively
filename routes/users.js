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

// register as business page
router.get("/businessregister", ensureGuest, (req, res) => {
  res.render("businessSignup", {
    layout: "layouts/auth",
  });
});

// post register
router.post("/register", ensureGuest, async (req, res) => {
  const verifytoken = jwt.sign({ email: req.body.email }, process.env.SECRET, {
    expiresIn: "1d",
  });
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
    await User.findOne({ email: email }).then((user) => {
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
          role: "customer",
        });

        newUser.save().then(async (user) => {
          req.flash(
            "success_msg",
            "You are now registered! Please check your inbox or scam emails for the verification of your account."
          );

          req.flash(
            "error_msg",
            "You can not login without verifying your email!"
          );
          res.redirect("/users/login");
        });
      }
    });
  }
  // nodemailer
  var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ID,
      pass: process.env.PASS,
    },
  });
  var mailOptions = {
    to: email,
    from: "Getting Lively",
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

// desc business register
// users/businessregister
router.post("/businessregister", ensureGuest, async (req, res) => {
  const verifytoken = jwt.sign({ email: req.body.email }, process.env.SECRET, {
    expiresIn: "1d",
  });
  const { name, websiteurl, businessName, email, password } = req.body;
  let errors = [];
  if (!name || !email || !password || !businessName || !websiteurl) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }
  if (errors.length > 0) {
    res.render("businessSignup", {
      errors,
      name,
      websiteurl,
      businessName,
      email,
      password,
    });
  } else {
    await User.findOne({ email: email }).then((user) => {
      if (user) {
        errors.push({ msg: "Email already exists" });
        res.render("businessSignup", {
          errors,
          websiteurl,
          businessName,
          name,
          email,
          password,
        });
      } else {
        const newUser = new User({
          name,
          businessName,
          websiteurl,
          email,
          password,
          confirmationCode: verifytoken,
          role: "business",
        });

        newUser.save().then(async (user) => {
          req.flash(
            "success_msg",
            "You are now registered! Please check your email for verification"
          );
          req.flash(
            "error_msg",
            "You can not login without verifying your email!"
          );
          res.redirect("/users/login");
        });
        // nodemailer
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ID,
            pass: process.env.PASS,
          },
        });
        var mailOptions = {
          to: email,
          from: "Getting Lively",
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
      }
    });
  }
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
router.post("/login", ensureGuest, (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureMessage: req.flash("loginError_msg", "Incorrect Credentails"),
    failureRedirect: "/users/login",
  })(req, res, next);
});

// logouthandle
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

// forgotpass
router.get("/forgot", ensureGuest, (req, res) => {
  res.render("forgotpassword", {
    layout: "layouts/auth",
  });
});

// post forgot email
router.post("/forgot", ensureGuest, (req, res) => {
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
          //   port: 465,
          //   secure: true,
          auth: {
            user: process.env.ID,
            pass: process.env.PASS,
          },
          //   tls: {
          //     rejectUnauthorized: false,
          //   },
        });
        var mailOptions = {
          to: user.email,
          from: "Getting Lively",
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
router.post("/reset/:token", ensureGuest, function (req, res) {
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
            user: process.env.ID,
            pass: process.env.PASS,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "Getting Lively",
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
