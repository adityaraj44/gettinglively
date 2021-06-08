const express = require("express");
const router = express.Router();
const path = require("path");
const User = require("../models/User");
const Post = require("../models/Post");
const Review = require("../models/Review");
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const nodemailer = require("nodemailer");

// get request to the /admincreate

router.get("/", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    res.render("admin/create", {
      layout: "layouts/layout",
    });
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

// post /admincreate/emailUpdates
// desc Post emails
router.post(
  "/emailupdates",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { subject, body } = req.body;
      let errors = [];
      if (!subject || !body) {
        errors.push({ msg: "Enter all the fields" });
        res.render("admin/create", {
          layout: "layouts/layout",
          subject: subject,
          errors,
        });
        req.flash("error_msg", "Enter all the fields");
      } else {
        const users = await User.find({ emailUpdates: "in" });
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "gettinglivelytest@gmail.com",
            pass: "sahilkumar@123",
          },
        });
        users.forEach((user) => {
          var mailOptions = {
            to: user.email,
            from: "GettingLively.com",
            subject: subject,
            html: body,
            // text: body,
          };
          smtpTransport
            .sendMail(mailOptions)

            .catch((err) => console.log(err));
        });
        req.flash("success_msg", "Emails sent successfully");
        res.redirect("/admincreate");
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

router.get("/entry", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    res.render("admin/createEntry", {
      layout: "layouts/layout",
    });
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

// post data to all the view pages
// /createPosts
router.post("/entry", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const {
      name,
      desc,
      typeOfPlace,
      typeOfVenue,
      location,

      bookingStatus,
      monopening,
      monclose,
      tueopening,
      tueclose,
      wedopening,
      wedclose,
      thuopening,
      thuclose,
      friopening,
      friclose,
      satopening,
      satclose,
      sunopening,
      sunclose,
    } = req.body;
    const errors = [];

    let cover = req.files.cover;
    cover.mv(path.resolve(__dirname, "..", "public/img", cover.name));
    let image1 = req.files.image1;
    image1.mv(path.resolve(__dirname, "..", "public/img", image1.name));
    let image2 = req.files.image2;
    image2.mv(path.resolve(__dirname, "..", "public/img", image2.name));
    let image3 = req.files.image3;
    image3.mv(path.resolve(__dirname, "..", "public/img", image3.name));
    let image4 = req.files.image4;
    image4.mv(path.resolve(__dirname, "..", "public/img", image4.name));
    let image5 = req.files.image5;
    image5.mv(path.resolve(__dirname, "..", "public/img", image5.name));
    let image6 = req.files.image6;
    image6.mv(path.resolve(__dirname, "..", "public/img", image6.name));
    let image7 = req.files.image7;
    image7.mv(path.resolve(__dirname, "..", "public/img", image7.name));
    let image8 = req.files.image8;
    image8.mv(path.resolve(__dirname, "..", "public/img", image8.name));
    let image9 = req.files.image9;
    image9.mv(path.resolve(__dirname, "..", "public/img", image9.name));
    let menu = req.files.menu;
    menu.mv(path.resolve(__dirname, "..", "public/docs", menu.name));

    if (desc.length < 500) {
      errors.push({ msg: "Description must be atleast 500 characters" });
      //   req.flash("warning_msg", "Description must be atleast 500 characters");
      return res.render("admin/createEntry", {
        layout: "layouts/layout",
        name,
        location,
        desc: desc.replace(/(<([^>]+)>)/gi, ""),
        typeOfVenue,

        monopening,
        monclose,
        tueopening,
        tueclose,
        wedopening,
        wedclose,
        thuopening,
        thuclose,
        friopening,
        friclose,
        satopening,
        satclose,
        sunopening,
        sunclose,
        errors,
      });
    }
    await Post.create({
      name,
      desc,
      typeOfPlace,
      location,
      typeOfVenue,
      bookingStatus,
      monopening,
      monclose,
      tueopening,
      tueclose,
      wedopening,
      wedclose,
      thuopening,
      thuclose,
      friopening,
      friclose,
      satopening,
      satclose,
      sunopening,
      sunclose,
      user: req.user.id,
      cover: "/img/" + cover.name,
      image1: "/img/" + image1.name,
      image2: "/img/" + image2.name,
      image3: "/img/" + image3.name,
      image4: "/img/" + image4.name,
      image5: "/img/" + image5.name,
      image6: "/img/" + image6.name,
      image7: "/img/" + image7.name,
      image8: "/img/" + image8.name,
      image9: "/img/" + image9.name,
      menu: "/docs/" + menu.name,
    }).then((post) => {
      req.flash("upload_msg", "Entry created and sent for verification.");
    });
    var smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gettinglivelytest@gmail.com",
        pass: "sahilkumar@123",
      },
    });

    var mailOptions = {
      to: req.user.email,
      from: "GettingLively.com",
      subject: "Entry Created",
      text: "Your entry has been created. Please add images and menu to publish your entry.",
      // text: body,
    };
    smtpTransport
      .sendMail(mailOptions)

      .catch((err) => console.log(err));
    res.redirect("/admincreate");
  } catch (error) {
    console.log(error);
    res.render("errors/500");
  }
});
// get all entries
router.get(
  "/allentries",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const allEntries = await Post.find({ reviewStatus: "reviewed" })
        .populate("user")
        .populate("reviews")
        .sort({ createdAt: "desc" })
        .lean();
      const reviews = await Review.find({})
        .populate("post")
        .populate("user")
        .lean();
      res.render("admin/allEntries", {
        layout: "layouts/layout",
        allEntries,
        reviews,

        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// get review entries
router.get(
  "/reviewentries",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const reviewEntries = await Post.find({ reviewStatus: "inprocess" })
        .populate("user")

        .sort({ createdAt: "desc" })
        .lean();

      //   const reviews = await Review.find(Post).populate("post").populate("user");
      //   console.log(reviews);

      res.render("admin/reviewEntries", {
        layout: "layouts/layout",
        reviewEntries,

        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

router.get("/myentries", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const myEntries = await Post.find({ user: req.user.id })

      .sort({ createdAt: "desc" })
      .lean();
    // const reviews = await Review.find({})
    //   .populate("post")
    //   .populate("user")
    //   .lean();
    res.render("entries/myEntries", {
      layout: "layouts/layout",
      myEntries,

      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

// get single entry
router.get(
  "/myentries/entry/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id })
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
      res.render("entries/entryDetail", {
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
  }
);

// delete entry using method overrride
// /myentries/entry/delete/:id
router.delete(
  "/myentries/entry/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await Post.remove({ _id: req.params.id });
      req.flash("success_msg", "Entry Deleted Successfully!");
      res.redirect("/admincreate/myentries");
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

// review entry
router.get(
  "/myentries/entry/review/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await Post.findById({
        _id: req.params.id,
      }).then((entry) => {
        if (entry.reviewStatus == "inprocess") {
          entry.reviewStatus = "reviewed";
          entry.save((err) => {
            req.flash("success_msg", "Entry reviewed successfully!");
            res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
          });
        } else {
          req.flash("error_msg", "Entry reviewed failed. Try again");
          res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
        }
      });
    } catch (error) {
      console.log(error);
      res.render("errors/404");
    }
  }
);

// get entry  edit page
router.get(
  "/myentries/entry/edit/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entry = await Post.findOne({ _id: req.params.id }).lean();
      if (!entry) {
        return res.render("error/404");
      }
      if (entry.user != req.user.id) {
        req.flash("error_msg", "Cannot process request at the moment!");
        res.redirect(`/myentries/entry/${req.params.id}`);
      } else {
        res.render("entries/editEntry", {
          layout: "layouts/layout",
          entry,
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);
// /admincreate/myentries/entry/edit/:id
// edit entry using method overrride
// /myentries/entry/delete/:id
router.put(
  "/myentries/entry/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const {
        name,
        desc,
        typeOfPlace,
        typeOfVenue,
        location,
        bookingStatus,
        monopening,
        monclose,
        tueopening,
        tueclose,
        wedopening,
        wedclose,
        thuopening,
        thuclose,
        friopening,
        friclose,
        satopening,
        satclose,
        sunopening,
        sunclose,
      } = req.body;
      const errors = [];

      let cover = req.files.cover;
      cover.mv(path.resolve(__dirname, "..", "public/img", cover.name));
      let image1 = req.files.image1;
      image1.mv(path.resolve(__dirname, "..", "public/img", image1.name));
      let image2 = req.files.image2;
      image2.mv(path.resolve(__dirname, "..", "public/img", image2.name));
      let image3 = req.files.image3;
      image3.mv(path.resolve(__dirname, "..", "public/img", image3.name));
      let image4 = req.files.image4;
      image4.mv(path.resolve(__dirname, "..", "public/img", image4.name));
      let image5 = req.files.image5;
      image5.mv(path.resolve(__dirname, "..", "public/img", image5.name));
      let image6 = req.files.image6;
      image6.mv(path.resolve(__dirname, "..", "public/img", image6.name));
      let image7 = req.files.image7;
      image7.mv(path.resolve(__dirname, "..", "public/img", image7.name));
      let image8 = req.files.image8;
      image8.mv(path.resolve(__dirname, "..", "public/img", image8.name));
      let image9 = req.files.image9;
      image9.mv(path.resolve(__dirname, "..", "public/img", image9.name));
      let menu = req.files.menu;
      menu.mv(path.resolve(__dirname, "..", "public/docs", menu.name));

      if (desc.length < 500) {
        errors.push({ msg: "Description must be atleast 500 characters" });
        //   req.flash("warning_msg", "Description must be atleast 500 characters");
        return res.render("entries/editEntry", {
          layout: "layouts/layout",
          errors,
        });
      }
      let entry = await Post.findById(req.params.id).lean();
      if (!entry) {
        return res.render("error/404");
      }
      if (entry.user != req.user.id) {
        req.flash("error_msg", "You can not edit this entry. Try again!");
        res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
      } else {
        entry = await Post.findOneAndUpdate(
          {
            _id: req.params.id,
          },
          {
            name,
            desc,
            typeOfPlace,
            location,
            typeOfVenue,
            bookingStatus,
            monopening,
            monclose,
            tueopening,
            tueclose,
            wedopening,
            wedclose,
            thuopening,
            thuclose,
            friopening,
            friclose,
            satopening,
            satclose,
            sunopening,
            sunclose,
            reviewStatus: "inprocess",
            user: req.user.id,
            cover: "/img/" + cover.name,
            image1: "/img/" + image1.name,
            image2: "/img/" + image2.name,
            image3: "/img/" + image3.name,
            image4: "/img/" + image4.name,
            image5: "/img/" + image5.name,
            image6: "/img/" + image6.name,
            image7: "/img/" + image7.name,
            image8: "/img/" + image8.name,
            image9: "/img/" + image9.name,
            menu: "/docs/" + menu.name,
          },
          {
            new: true,
            runValidators: true,
          }
        );
        entry.reviewStatus = "inprocess";
        entry.save().then((go) => {
          req.flash("success_msg", "Entry edited successfully!");
          res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
        });
      }
    } catch (error) {
      console.log(error);
      return res.render("errors/404");
    }
  }
);

module.exports = router;
