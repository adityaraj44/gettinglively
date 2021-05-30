const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureGuest } = require("../middlewares/auth");

router.get("/", (req, res) => {
  res.render("bars", {
    user: req.user,
  });
});

module.exports = router;
