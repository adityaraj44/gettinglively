const express = require("express");
const router = express.Router();
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const User = require("../models/User");

// admin dashboard
router.get("/", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const basicUsers = await User.find({ role: "basic" })
      .sort({ createdAt: "desc" })
      .lean();
    // finding members
    const memberUsers = await User.find({
      role: "member",
    })
      .sort({ createdAt: "desc" })
      .lean();

    res.render("admin/admindash", {
      layout: "layouts/layout",
      basicUsers,
      memberUsers,
    });
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

router.get("/users", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const basicUsers = await User.find({ role: "basic", status: "Active" })
      .sort({ createdAt: "desc" })
      .lean();

    res.render("admin/adminUsers", {
      layout: "layouts/layout",
      basicUsers,
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

// get members
router.get("/members", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const memberUsers = await User.find({ role: "member", status: "Active" })
      .sort({ createdAt: "desc" })
      .lean();

    res.render("admin/adminMembers", {
      layout: "layouts/layout",
      memberUsers,
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

module.exports = router;
