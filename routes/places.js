const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureGuest } = require("../middlewares/auth");
const Post = require("../models/Post");
const User = require("../models/User");
const PageDetail = require("../models/PageDetail");
const Review = require("../models/Review");

router.get("/bars", async (req, res) => {
  const allEntries = await Post.find({
    reviewStatus: "reviewed",
    typeOfPlace: "bar",
  })
    .populate("user")
    .sort({ createdAt: "desc" })
    .lean();
  const pagedetails = await PageDetail.find({
    typeOfPlace: "bar",
  })
    .sort({ createdAt: "desc" })
    .lean();

  res.render("bars", {
    user: req.user,
    pagedetails,
    allEntries,

    helper: require("../helpers/ejs"),
  });
});

// restuarant
router.get("/restaurant", async (req, res) => {
  const allEntries = await Post.find({
    reviewStatus: "reviewed",
    typeOfPlace: "restaurant",
  })
    .populate("user")
    .sort({ createdAt: "desc" })
    .lean();

  const pagedetails = await PageDetail.find({
    typeOfPlace: "restaurant",
  })
    .sort({ createdAt: "desc" })
    .lean();

  res.render("restaurant", {
    user: req.user,
    allEntries,
    pagedetails,
    helper: require("../helpers/ejs"),
  });
});

// club
router.get("/club", async (req, res) => {
  const allEntries = await Post.find({
    reviewStatus: "reviewed",
    typeOfPlace: "club",
  })
    .populate("user")
    .sort({ createdAt: "desc" })
    .lean();

  res.render("club", {
    user: req.user,
    allEntries,
    helper: require("../helpers/ejs"),
  });
});

// pub
router.get("/pubs", async (req, res) => {
  const allEntries = await Post.find({
    reviewStatus: "reviewed",
    typeOfPlace: "pub",
  })
    .populate("user")
    .sort({ createdAt: "desc" })
    .lean();

  res.render("pub", {
    user: req.user,
    allEntries,
    helper: require("../helpers/ejs"),
  });
});

// venue
router.get("/venue", async (req, res) => {
  const allEntries = await Post.find({
    reviewStatus: "reviewed",
    typeOfPlace: "venue",
  })
    .populate("user")
    .sort({ createdAt: "desc" })
    .lean();

  res.render("venue", {
    user: req.user,
    allEntries,
    helper: require("../helpers/ejs"),
  });
});

// get each entry
router.get("/entries/entry/:id", async (req, res) => {
  try {
    const entry = await Post.findById({
      _id: req.params.id,
    })
      .populate("user")
      .lean();
    const allReview = await Review.find({ post: req.params.id })
      .populate("post")
      .populate("user")
      .sort({ createdAt: "desc" })
      .lean();
    let totalScore = 0;
    for (i = 0; i < allReview.length; i++) {
      totalScore = totalScore + allReview[i].userScore;
    }
    if (!entry) {
      res.render("errors/404");
    }
    res.render("singleEntry", {
      layout: "layouts/layout",
      entry,
      allReview,
      totalScore,
      user: req.user,
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

// post review of all 5 pages
router.post("/userreviews/:id", ensureAuthenticated, async (req, res) => {
  try {
    // const post = await Post.findById({ _id: req.params.id });
    const review = await Review.find({
      user: req.user.id,
    });

    if (review.user == req.user.id) {
      req.flash("error_msg", "You have already submitted a review");

      res.redirect(`/entries/entry/${req.params.id}`);
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
        res.redirect(`/places/entries/entry/${req.params.id}`);
      });
    }
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});

module.exports = router;
