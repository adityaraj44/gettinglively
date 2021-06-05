const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Post = require("../models/Post");
const Review = require("../models/Review");

const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");

router.post(
  "/admin/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await Review.findOne({
        user: req.user.id,
      }).then((user) => {
        if (user) {
          req.flash("error_msg", "You have already submitted a review");
          res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
        } else {
          const newReview = new Review({
            userScore: req.body.userScore,
            userComment: req.body.userComment,
            post: req.params.id,
            user: req.user.id,
          });

          newReview.save().then((review) => {
            //   });
            req.flash("success_msg", "Thanks for giving review");
            res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
          });
        }
      });
      //   await Review.create({
      //     userScore: req.body.userScore,
      //     userComment: req.body.userComment,
      //     post: req.params.id,
      //     user: req.user.id,
      //   });
      //   await Post.findByIdAndUpdate({ _id: req.params.id }, Review, {
      //     new: true,
      //     runValidators: true,
      //   });
      //   req.flash("success_msg", "Thanks for giving review");
      //   res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

module.exports = router;
