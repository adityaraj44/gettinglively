const { Express } = require("@sentry/tracing/dist/integrations");
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("homepage");
});

module.exports = router;
