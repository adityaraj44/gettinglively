const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureGuest } = require("../middlewares/auth");
const Post = require("../models/Post");

router.get("/", async (req, res) => {
  const allEntries = await Post.find({ reviewStatus: "reviewed" })
    .populate("user")
    .sort({ rating: "desc" })
    .lean();
  res.render("bars", {
    user: req.user,
    allEntries,
    helper: require("../helpers/ejs"),
  });
});

module.exports = router;
