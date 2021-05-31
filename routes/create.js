const express = require("express");
const router = express.Router();
const path = require("path");
const User = require("../models/User");
const Post = require("../models/Post");
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const nodemailer = require("nodemailer");

// get request to the /admincreate

router.get("/", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const allEntries = await Post.find({ reviewStatus: "reviewed" })
      .populate("user")
      .sort({ createdAt: "desc" })
      .lean();
    const reviewEntries = await Post.find({ reviewStatus: "inprocess" })
      .populate("user")
      .sort({ createdAt: "desc" })
      .lean();
    res.render("admin/create", {
      layout: "layouts/layout",
      allEntries,
      reviewEntries,
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/500");
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
        errors.push({ msg: "Please enter all fields" });
      }
      if (errors.length > 0) {
        req.flash("error_msg", "Please enter all the fields");
        res.render("partials/createEmail", {
          layout: "layouts/layout",
          subject: subject,
          body: body.replace(/(<([^>]+)>)/gi, ""),
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

// post data to all the view pages
// /createPosts
router.post(
  "/places",
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
        req.flash(
          "errorupload_msg",
          "Description must be atleast 500 characters"
        );
        res.render("partials/createEntry", {
          layout: "layouts/layout",
          name,
          location,
          desc: desc.replace(/(<([^>]+)>)/gi, ""),
          typeOfVenue,
          image,
          rating,
          menu,
        });
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
          res.redirect("/admincreate");
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

module.exports = router;
