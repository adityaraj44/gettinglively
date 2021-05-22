const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");

router.get("/", ensureAuthenticated, (req, res) => {
  res.render("bars");
});

module.exports = router;
