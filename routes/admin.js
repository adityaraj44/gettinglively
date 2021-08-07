const express = require("express");
const router = express.Router();
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const User = require("../models/User");
const Post = require("../models/Post");
const Voucher = require("../models/Voucher");
const Offer = require("../models/Offer");
const Detailed = require("../models/Detailed");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// admin dashboard
router.get("/", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const customerMembers = await User.find({
      role: "customer",
      status: "Active",
    })
      .sort({ createdAt: "desc" })
      .lean();
    // finding members
    const businessMembers = await User.find({
      role: "business",
      status: "Active",
    })
      .sort({ createdAt: "desc" })
      .lean();

    const entries = await Post.find({ reviewStatus: "reviewed" }).lean();
    const transaction = await Voucher.find({}).lean();
    const transaction2 = await Post.find({ paymentStatus: "paid" }).lean();
    const offerTransaction = await Offer.find({ offerStatus: "paid" }).lean();
    const planTransaction = await Post.find({ premier: "valid" });
    const planTransaction2 = await Post.find({ advance: "valid" });
    const planTransaction3 = await Post.find({ promoted: "valid" });

    res.render("admin/admindash", {
      layout: "layouts/layout",
      customerMembers,
      transaction2,
      businessMembers,
      entries,
      transaction,
      offerTransaction,
      planTransaction,
      planTransaction2,
      planTransaction3,
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

router.get("/customers", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const customerMembers = await User.find({
      role: "customer",
      status: "Active",
    })
      .sort({ createdAt: "desc" })
      .lean();

    res.render("admin/customerMembers", {
      layout: "layouts/layout",
      customerMembers,
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

// get members
router.get("/business", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const businessMembers = await User.find({
      role: "business",
      status: "Active",
    })
      .sort({ createdAt: "desc" })
      .lean();

    res.render("admin/businessMembers", {
      layout: "layouts/layout",
      businessMembers,
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

// get req to single user detail
// /users/:id

router.get(
  "/customers/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const user = await User.findById({ _id: req.params.id }).lean();
      console.log(user);
      res.render("admin/customerDetails", {
        layout: "layouts/layout",
        user,
        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// get req to single member detail
// /users/memberusers/:id

router.get(
  "/members/businessmembers/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const user = await User.findById({ _id: req.params.id }).lean();
      console.log(user);
      res.render("admin/memberdetails", {
        layout: "layouts/layout",
        user,
        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// delete user using method overrride
// admin/users/delete/:id
router.delete(
  "/customers/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await User.remove({ _id: req.params.id });
      req.flash("success_msg", "Customer deleted from records.");
      res.redirect("/admin/customers");
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

// delete member using method override
// admin/members/memberusers/delete/:id
router.delete(
  "/members/businessmembers/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await User.remove({ _id: req.params.id });
      req.flash("success_msg", "Business deleted from records.");
      res.redirect("/admin/business");
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

router.get(
  "/allpayments",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entryPayments = await Post.find({
        paymentStatus: "paid",
      })
        .sort({ createdAt: "desc" })
        .lean();
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   }).lean();
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   }).lean();
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "",
      //   }).lean();
      //   console.log(planPaymentPromoted.length);
      const offerPayments = await Offer.find({
        offerStatus: "paid",
      }).lean();
      res.render("admin/allpayments", {
        layout: "layouts/layout",
        entryPayments,
        offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/mypayments/carddetails/entry/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entryPayment = await Post.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      //   const offerPayments = await Offer.findById({
      //     _id: req.params.id,
      //   });
      res.render("admin/carddetailsEntry", {
        layout: "layouts/layout",
        entryPayment,
        // offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/mypayments/carddetails/offer/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const offerPayment = await Offer.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      // const offerPayments = await Offer.findById({
      //   _id: req.params.id,
      // });
      res.render("admin/carddetailsOffer", {
        layout: "layouts/layout",
        offerPayment,
        //   offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/mypayments/carddetails/premier/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entryPayment = await Post.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      //   const offerPayments = await Offer.findById({
      //     _id: req.params.id,
      //   });
      res.render("admin/carddetailPlan", {
        layout: "layouts/layout",
        entryPayment,
        // offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);
router.get(
  "/mypayments/carddetails/advance/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entryPayment = await Post.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      // const offerPayments = await Offer.findById({
      //   _id: req.params.id,
      // });
      res.render("admin/carddetailadvance", {
        layout: "layouts/layout",
        entryPayment,
        //   offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);
router.get(
  "/mypayments/carddetails/promoted/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entryPayment = await Post.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      // const offerPayments = await Offer.findById({
      //   _id: req.params.id,
      // });
      res.render("admin/carddetailpromoted", {
        layout: "layouts/layout",
        entryPayment,
        //   offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/allvouchers",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      //   const allBusinessEntries = await Post.find({
      //     user: req.user.id,
      //     reviewStatus: "reviewed",
      //   })
      //     .populate("user")
      //     .sort({ createdAt: "desc" })
      //     .lean();

      const allVouchers = await Voucher.find({})
        .populate("post")
        .populate("user")
        .populate("offer")
        .sort({ createdAt: "desc" })
        .lean();

      res.render("admin/allvouchers", {
        layout: "layouts/layout",
        // allBusinessEntries,
        allVouchers,
        user: req.user,
        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get("/allplans", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const allEntries = await Post.find({
      reviewStatus: "reviewed",
    })
      .sort({ createdAt: "desc" })
      .lean();

    // const detailed = await Detailed.find({}).populate("post").lean();
    // console.log(detailed);
    // const allVouchers = await Voucher.find({})
    //   .populate("post")
    //   .populate("user")
    //   .populate("offer")
    //   .sort({ createdAt: "desc" })
    //   .lean();
    // console.log(allVouchers);

    res.render("admin/allPlans", {
      layout: "layouts/layout",
      allEntries,
      //   detailed,
      // allVouchers,

      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

router.get(
  "/managelistings",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const allEntries = await Post.find({
        reviewStatus: "reviewed",
      })

        .sort({ createdAt: "desc" })
        .lean();

      res.render("admin/manageListing", {
        layout: "layouts/layout",
        allEntries,

        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/pricingandplans/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id }).lean();
      const amount_premier = 50;
      const amount_advancedpremier = 100;
      const amount_promoted = 200;
      if (entry) {
        res.render("admin/pricingplans", {
          entry,
          amount_premier,
          amount_advancedpremier,
          amount_promoted,
          layout: "layouts/layout",

          helper: require("../helpers/ejs"),
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// get premier
router.get(
  "/pricingandplans/premier/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await Post.findById({ _id: req.params.id })

        .then((entry) => {
          if (entry.premier == "basic" || entry.premier == "renew") {
            entry.premier = "valid";
            entry.save((err) => {
              req.flash("success_msg", "Listing plan changed successfully!");
              req.session.save(function () {
                res.redirect(`/admin/pricingandplans/${req.params.id}`);
              });
            });
          } else if (entry.premier == "valid") {
            entry.premier = "basic";

            entry.save((err) => {
              req.flash("success_msg", "Listing plan changed successfully!");
              req.session.save(function () {
                res.redirect(`/admin/pricingandplans/${req.params.id}`);
              });
            });
          } else {
            req.flash("error_msg", "Listing plan was not changed");
            req.session.save(function () {
              res.redirect(`/admin/pricingandplans/${req.params.id}`);
            });
          }
        })
        .catch((err) => {
          console.log(err);
          req.flash("error_msg", "Listing plan was not changed");
          req.session.save(function () {
            res.redirect(`/admin/pricingandplans/${req.params.id}`);
          });
        });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);
// get advance
router.get(
  "/pricingandplans/advancepremier/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await Post.findById({ _id: req.params.id })

        .then((entry) => {
          if (entry.advance == "basic" || entry.advance == "renew") {
            entry.advance = "valid";
            entry.save((err) => {
              req.flash("success_msg", "Listing plan changed successfully!");
              req.session.save(function () {
                res.redirect(`/admin/pricingandplans/${req.params.id}`);
              });
            });
          } else if (entry.advance == "valid") {
            entry.advance = "basic";

            entry.save((err) => {
              req.flash("success_msg", "Listing plan changed successfully!");
              req.session.save(function () {
                res.redirect(`/admin/pricingandplans/${req.params.id}`);
              });
            });
          } else {
            req.flash("error_msg", "Listing plan was not changed");
            req.session.save(function () {
              res.redirect(`/admin/pricingandplans/${req.params.id}`);
            });
          }
        })
        .catch((err) => {
          console.log(err);
          req.flash("error_msg", "Listing plan was not changed");
          req.session.save(function () {
            res.redirect(`/admin/pricingandplans/${req.params.id}`);
          });
        });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);
// get promoted
router.get(
  "/pricingandplans/promoted/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await Post.findById({ _id: req.params.id })

        .then((entry) => {
          if (entry.promoted == "basic" || entry.promoted == "renew") {
            entry.promoted = "valid";
            entry.save((err) => {
              req.flash("success_msg", "Listing plan changed successfully!");
              req.session.save(function () {
                res.redirect(`/admin/pricingandplans/${req.params.id}`);
              });
            });
          } else if (entry.promoted == "valid") {
            entry.promoted = "basic";

            entry.save((err) => {
              req.flash("success_msg", "Listing plan changed successfully!");
              req.session.save(function () {
                res.redirect(`/admin/pricingandplans/${req.params.id}`);
              });
            });
          } else {
            req.flash("error_msg", "Listing plan was not changed");
            req.session.save(function () {
              res.redirect(`/admin/pricingandplans/${req.params.id}`);
            });
          }
        })
        .catch((err) => {
          console.log(err);
          req.flash("error_msg", "Listing plan was not changed");
          req.session.save(function () {
            res.redirect(`/admin/pricingandplans/${req.params.id}`);
          });
        });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// change pass page
router.get(
  "/changepassword",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const loggedUser = await User.findById({ _id: req.user.id }).lean();
      if (loggedUser) {
        res.render("admin/changePassword", {
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
  ensureAdmin,
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
          res.redirect("/admin/changepassword");
        });
      }

      if (passwordold === passwordnew) {
        req.flash(
          "error_msg",
          "Your new password matches the old one. Please use another password."
        );
        req.session.save(() => {
          res.redirect("/admin/changepassword");
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
              res.redirect("/admin");
            });
          } else {
            req.flash("error_msg", "You have entered wrong password.");
            req.session.save(() => {
              res.redirect("/admin/changepassword");
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
