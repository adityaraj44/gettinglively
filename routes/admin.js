const express = require("express");
const router = express.Router();
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const User = require("../models/User");

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

module.exports = router;
