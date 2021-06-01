const express = require("express");
const router = express.Router();
const path = require("path");
const User = require("../models/User");
const Post = require("../models/Post");
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const nodemailer = require("nodemailer");
const multer = require("multer");

// initialize multer
// var storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + file.originalname);
//   },
// });

// var upload = multer({ storage: storage });

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
      if (!subject || !body) {
        req.flash("error_msg", "Enter all the fields");
        res.render("admin/create", {
          layout: "layouts/layout",
          subject: subject,
        });
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
            html: `${body}`,
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
router.post(
  "/entry",
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
        rating,
        bookingStatus,
      } = req.body;
      let image = req.files.image;
      image.mv(path.resolve(__dirname, "..", "public/img", image.name));
      let menu = req.files.menu;
      menu.mv(path.resolve(__dirname, "..", "public/docs", menu.name));

      if (desc.length < 500) {
        res.render("admin/createEntry", {
          layout: "layouts/layout",
          name,
          location,
          desc: desc.replace(/(<([^>]+)>)/gi, ""),
          typeOfVenue,
          image,
          rating,
          menu,
        });
        req.flash("warning_msg", "Description must be atleast 500 characters");
      } else {
        await Post.create({
          name,
          desc: desc.replace(/(<([^>]+)>)/gi, ""),
          typeOfPlace,
          location,
          typeOfVenue,
          rating,
          bookingStatus,
          user: req.user.id,
          image: "/img/" + image.name,
          menu: "/docs/" + menu.name,
        }).then((post) => {
          req.flash("upload_msg", "Post sent for verification!");
          res.redirect("/admincreate/entry");
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);
// get all entries
router.get(
  "/allentries",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const allEntries = await Post.find({ reviewStatus: "reviewed" })
        .populate("user")
        .sort({ createdAt: "desc" })
        .lean();

      res.render("admin/allEntries", {
        layout: "layouts/layout",
        allEntries,

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

module.exports = router;
