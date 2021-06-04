const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Post = require("../models/Post");
const Reviews = require("../models/Reviews");

const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");

router.post(
  "/admin/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { userScore, userComment } = req.body;

      await Reviews.create({
        userScore,
        userComment,
        post: req.params.id,
        user: req.user.id,
      });
      req.flash("success_msg", "Thanks for giving review");
      res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

module.exports = router;
