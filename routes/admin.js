const express = require("express");
const router = express.Router();
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const User = require("../models/User");
const Post = require("../models/Post");
const Voucher = require("../models/Voucher");

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

    res.render("admin/admindash", {
      layout: "layouts/layout",
      customerMembers,
      transaction2,
      businessMembers,
      entries,
      transaction,
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

module.exports = router;
