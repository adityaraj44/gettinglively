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
              //   text:
              //     "Hello,\n\n" +
              //     "This is a confirmation that the password for your account " +
              //     userDetail.email +
              //     " has just been changed.\n",
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
                  userDetail.name
                },</strong></p>
                <br />
                <p>
                ${
                  "This is a confirmation that the password for your account " +
                  userDetail.email +
                  " has just been changed."
                }
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
              margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Back to Getting Lively</a></button>
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
                <p>
                  If you have any questions or concerns, please do not hesitate to contact
                  us via our Live Chat or Contact Form on our website.
                </p>
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
