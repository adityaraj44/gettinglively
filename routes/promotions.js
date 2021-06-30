const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.render("promotions", {
      layout: "layouts/layout",
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

module.exports = router;
