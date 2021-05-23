const { Express } = require("@sentry/tracing/dist/integrations");
const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");

router.get("/", ensureAuthenticated, (req, res) => {
  res.redirect("/home");
});

router.get("/home", ensureAuthenticated, (req, res) => {
  res.render("homepage", {
    user: req.user,
    helper: require("../helpers/ejs"),
  });
});

module.exports = router;
