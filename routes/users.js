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
          req.session.save(() => {
            res.redirect("/users/login");
          });
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
    html: `
        <div style="color: #000;">
          <p class="titleTxt" style="font-size:18px;"><strong>Dear ${name},</strong></p>
          <br />
          <p>
            Thank you for signing up with us. Your need to verify your email. Please click on the link below to verify your email address.
          </p>
          
          <button class="loginBtn" style="background-color:red;
          outline: none;
         box-sizing: border-box;
        color: rgb(255, 255, 255);
        background-color: #ec4d37;
        border: none;
        padding: 5px 20px;
        cursor: pointer;
        border-radius: 5px;
        text-decoration:none;
        display: flex;
        margin: auto;"><a href="${
          "https://" + req.headers.host + "/users/verify/" + verifytoken
        }" style="color: #fff;">Verify Email Address</a></button>
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreplymail@gettinglively.co.uk"
                >noreplymail@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            We strongly suggest that you familiarise yourself with our Terms of
            Service before getting started. These can be found at the bottom of any
            page on our website.
          </p>
          <p>Thank you for choosing us!</p>
        
          <p><strong>Regards,</strong></p>
          <p><strong>The Getting Lively Team</strong></p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreplymail@gettinglively.co.uk"
                >noreplymail@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            STAY SAFE, STAY SECURE: We never ask for your personal account details
            by email.
          </p>
          <p>
            The information in this message is confidential and is intended solely
            for the addressee.
          </p>
          <p>
            Access to this e-mail by anyone else is unauthorised. If you are not the
            intended recipient, any disclosure, copying, distribution or any action
            taken or omitted in reliance on this, is prohibited and may be unlawful.
          </p>
          <p>
            Whilst all sensible steps are taken to ensure the accuracy and integrity
            of information and data transmitted electronically and to preserve the
            confidentiality thereof, no liability or responsibility whatsoever is
            accepted if information or data is, for whatever reason, corrupted or
            does not reach its intended destination.
          </p>
          <p>
            This email was sent to you by
            <span><a href="https://gettinglively.com">gettinglively.com</a></span>
          </p>
          <p>
            If you’re having trouble clicking the "Login" button, copy and paste the
            URL below into your web browser: <span
              ><a href="https://gettinglively.com/users/login"
                >https://gettinglively.com/users/login</a
              ></span
            >
          </p>
          <br />
          <br />
          <footer class="footer" style="text-align:center;">
            <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
          </footer>
        </div>`,
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
          req.session.save(() => {
            res.redirect("/users/login");
          });
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
          //   text:
          //     "You are receiving this because you need to verify your email.\n\n" +
          //     "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          //     "http://" +
          //     req.headers.host +
          //     "/users/verify/" +
          //     verifytoken +
          //     "\n\n" +
          //     "If you did not request this, please ignore this email.\n",
          html: `
        <div style="color: #000;">
          <p class="titleTxt" style="font-size:18px;"><strong>Dear ${name},</strong></p>
          <br />
          <p>
            Thank you for signing up with us. Your need to verify your email. Please click on the link below to verify your email address.
          </p>
          
          <button class="loginBtn" style="background-color:red;
          outline: none;
         box-sizing: border-box;
        color: rgb(255, 255, 255);
        background-color: #ec4d37;
        border: none;
        padding: 5px 20px;
        cursor: pointer;
        border-radius: 5px;
        text-decoration:none;
        display: flex;
        margin: auto;"><a href="${
          "https://" + req.headers.host + "/users/verify/" + verifytoken
        }" style="color: #fff;  text-decoration:none;">Verify Email Address</a></button>
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreplymail@gettinglively.co.uk"
                >noreplymail@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            We strongly suggest that you familiarise yourself with our Terms of
            Service before getting started. These can be found at the bottom of any
            page on our website.
          </p>
          <p>Thank you for choosing us!</p>
        
          <p><strong>Regards,</strong></p>
          <p><strong>The Getting Lively Team</strong></p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreplymail@gettinglively.co.uk"
                >noreplymail@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            STAY SAFE, STAY SECURE: We never ask for your personal account details
            by email.
          </p>
          <p>
            The information in this message is confidential and is intended solely
            for the addressee.
          </p>
          <p>
            Access to this e-mail by anyone else is unauthorised. If you are not the
            intended recipient, any disclosure, copying, distribution or any action
            taken or omitted in reliance on this, is prohibited and may be unlawful.
          </p>
          <p>
            Whilst all sensible steps are taken to ensure the accuracy and integrity
            of information and data transmitted electronically and to preserve the
            confidentiality thereof, no liability or responsibility whatsoever is
            accepted if information or data is, for whatever reason, corrupted or
            does not reach its intended destination.
          </p>
          <p>
            This email was sent to you by
            <span><a href="https://gettinglively.com">gettinglively.com</a></span>
          </p>
          <p>
            If you’re having trouble clicking the "Login" button, copy and paste the
            URL below into your web browser: <span
              ><a href="https://gettinglively.com/users/login"
                >https://gettinglively.com/users/login</a
              ></span
            >
          </p>
          <br />
          <br />
          <footer class="footer" style="text-align:center;">
            <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
          </footer>
        </div>`,
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
          html: `<style>
          .titleTxt {
            font-size: 18px;
          }
    
          a {
            text-decoration: none;

          }
    
          .loginBtn {
            outline: none;
            box-sizing: border-box;
            color: rgb(255, 255, 255);
            background-color: #ec4d37;
            border: none;
            padding: 5px 20px;
            cursor: pointer;
            border-radius: 5px;
            display: flex;
            margin: auto;
          }
    
          .footer {
            text-align: center;
          }
        </style>
        <div style="color: #000;">
          <p class="titleTxt" style="font-size:18px;"><strong>Dear ${
            user.name
          },</strong></p>
          <br />
          <p>
          You are receiving this because you (or someone else) have requested the reset of the password for your account. Please click on the following link, or paste this into your browser to complete the process.
          </p>
          
          <button class="loginBtn" style="background-color:red;
          outline: none;
         box-sizing: border-box;
        color: rgb(255, 255, 255);
        background-color: #ec4d37;
        border: none;
        padding: 5px 20px;
        cursor: pointer;
        border-radius: 5px;
        text-decoration:none;
        display: flex;
        margin: auto;"><a href="${
          "https://" + req.headers.host + "/users/reset/" + token
        }" style="color: #fff;">Forgot Password</a></button>
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreplymail@gettinglively.co.uk"
                >noreplymail@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            We strongly suggest that you familiarise yourself with our Terms of
            Service before getting started. These can be found at the bottom of any
            page on our website.
          </p>
          <p>Thank you for choosing us!</p>
        
          <p><strong>Regards,</strong></p>
          <p><strong>The Getting Lively Team</strong></p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreplymail@gettinglively.co.uk"
                >noreplymail@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            STAY SAFE, STAY SECURE: We never ask for your personal account details
            by email.
          </p>
          <p>
            The information in this message is confidential and is intended solely
            for the addressee.
          </p>
          <p>
            Access to this e-mail by anyone else is unauthorised. If you are not the
            intended recipient, any disclosure, copying, distribution or any action
            taken or omitted in reliance on this, is prohibited and may be unlawful.
          </p>
          <p>
            Whilst all sensible steps are taken to ensure the accuracy and integrity
            of information and data transmitted electronically and to preserve the
            confidentiality thereof, no liability or responsibility whatsoever is
            accepted if information or data is, for whatever reason, corrupted or
            does not reach its intended destination.
          </p>
          <p>
            This email was sent to you by
            <span><a href="https://gettinglively.com">gettinglively.com</a></span>
          </p>
          <p>
            If you’re having trouble clicking the "Login" button, copy and paste the
            URL below into your web browser: <span
              ><a href="https://gettinglively.com/users/login"
                >https://gettinglively.com/users/login</a
              ></span
            >
          </p>
          <br />
          <br />
          <footer class="footer" style="text-align:center;">
            <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
          </footer>
        </div>`,
          //   text:
          //   "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
          //   "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          //   "http://" +
          //   req.headers.host +
          //   "/users/reset/" +
          //   token +
          //     "\n\n" +
          //     "If you did not request this, please ignore this email and your password will remain unchanged.\n",
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
