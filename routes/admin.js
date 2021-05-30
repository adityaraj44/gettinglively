const express = require("express");
const router = express.Router();
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const User = require("../models/User");
const Post = require("../models/Post");

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

    const entries = await Post.find({ reviewStatus: "reviewed" }).lean();

    res.render("admin/admindash", {
      layout: "layouts/layout",
      basicUsers,
      memberUsers,
      entries,
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

    res.render("admin/allUsers", {
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

// get req to single user detail
// /users/:id

router.get(
  "/users/basicusers/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const user = await User.findById({ _id: req.params.id }).lean();
      console.log(user);
      res.render("admin/userdetails", {
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
  "/members/memberusers/:id",
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
  "/users/basicusers/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await User.remove({ _id: req.params.id });
      res.redirect("/admin/users");
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

// delete member using method override
// admin/members/memberusers/delete/:id
router.delete(
  "/members/memberusers/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await User.remove({ _id: req.params.id });
      res.redirect("/admin/members");
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

module.exports = router;
