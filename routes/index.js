const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureGuest } = require("../middlewares/auth");

router.get("/", (req, res) => {
  res.redirect("/home");
});

router.get("/home", (req, res) => {
  res.render("homepage", {
    user: req.user,
    helper: require("../helpers/ejs"),
  });
});

module.exports = router;
