const express = require("express");
const router = express.Router();
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const User = require("../models/User");
const Post = require("../models/Post");
const Voucher = require("../models/Voucher");
const Offer = require("../models/Offer");

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
        .lean()
        .then((entry) => {
          if (entry.premier == "basic" || entry.premier == "renew") {
            entry.premier = "valid";
            entry.save((err) => {
              req.flash("success_msg", "Listing plan changed successfully!");
              req.session.save(function () {
                res.redirect(req.originalUrl);
              });
            });
          } else if (entry.premier == "valid") {
            entry.premier = "basic";

            entry.save((err) => {
              req.flash("success_msg", "Listing plan changed successfully!");
              req.session.save(function () {
                res.redirect(req.originalUrl);
              });
            });
          } else {
            req.flash("error_msg", "Listing plan was not changed");
            req.session.save(function () {
              res.redirect(req.originalUrl);
            });
          }
        })
        .catch((err) => {
          console.log(err);
          req.flash("error_msg", "Listing plan was not changed");
          req.session.save(function () {
            res.redirect(req.originalUrl);
          });
        });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);
// get advance
// get promoted

module.exports = router;
