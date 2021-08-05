const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Post = require("../models/Post");
const Review = require("../models/Review");

const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");

router.post("/:id", ensureAuthenticated, async (req, res) => {
  try {
    // const post = await Post.findById({ _id: req.params.id });
    const review = await Review.find({
      user: req.user.id,
    });
    console.log(review);
    if (review.user == req.user.id) {
      req.flash("error_msg", "You have already submitted a review");
      if (req.user.role == "admin") {
        res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
      } else if (req.user.role == "business") {
        res.redirect(`/business/myentries/entry/${req.params.id}`);
      } else {
        res.redirect("/");
      }
    } else {
      const newReview = new Review({
        userScore: req.body.userScore,
        userComment: req.body.userComment,
        post: req.params.id,
        user: req.user.id,
      });

      newReview.save().then((review) => {
        //   });
        req.flash("success_msg", "Thank you for giving your review.");
        if (req.user.role == "admin") {
          res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
        } else if (req.user.role == "business") {
          res.redirect(`/business/myentries/entry/${req.params.id}`);
        }
      });
    }

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
});

router.delete(
  "/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      let review = await Review.findById(req.params.id).lean();
      await Review.deleteOne({ _id: req.params.id });
      req.flash("success_msg", "Review Deleted Successfully!");
      req.session.save(() => {
        res.redirect(`/admincreate/myentries/entry/${review.post._id}`);
      });
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

router.get("/edit/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const review = await Review.findById({ _id: req.params.id }).lean();
    if (!review) {
      res.render("errors/pagenotfound");
    } else {
      res.render("admin/editReview", {
        layout: "layouts/layout",
        review,
        helper: require("../helpers/ejs"),
      });
    }
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

// put detailed review
router.put("/edit/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { userScore, userComment } = req.body;

    let review = await Review.findById({ _id: req.params.id }).lean();

    if (!review) {
      return res.render("error/404");
    } else {
      review = await Review.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        {
          userScore,
          userComment,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      review.save();
      req.flash("success_msg", "Review edited successfully!");

      req.session.save(() => {
        res.redirect(
          `/admincreate/myentries/entry/${review.post._id.toString()}`
        );
      });
    }
  } catch (error) {
    console.log(error);
    return res.render("errors/404");
  }
});

module.exports = router;
