const express = require("express");
const router = express.Router();
// const path = require("path");
const User = require("../models/User");
const Post = require("../models/Post");
// const Image = require("../models/Image");
// const fs = require("fs");
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const nodemailer = require("nodemailer");
// const multer = require("multer");

// initialize multer
// var storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads");
//   },
//   filename: (req, file, cb) => {
//     var ext = file.originalname.substr(file.originalname.lastIndexOf("."));

//     cb(null, file.fieldname + "-" + Date.now() + ext);
//   },
// });

// const upload = multer({ storage: storage });

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

// // get img upload page
// router.get(
//   "/entry/images",
//   ensureAuthenticated,
//   ensureAdmin,
//   async (req, res) => {
//     try {
//       res.render("admin/imageUpload", {
//         layout: "layouts/layout",
//       });
//     } catch (error) {
//       console.log(error);
//       res.render("errors/pagenotfound");
//     }
//   }
// );

// // to post image gallary
// router.post(
//   "/entry/images",
//   ensureAuthenticated,
//   ensureAdmin,
//   upload.array("image", 2),
//   (req, res) => {
//     const files = req.files;

//     if (files) {
//       // convert images into base64 encoding
//       let imgArray = files.map((file) => {
//         let img = fs.readFileSync(file.path);

//         return (encode_image = img.toString("base64"));
//       });

//       imgArray.map(async (src, index) => {
//         // create object to store data in collection
//         let finalImg = {
//           filename: files[index].originalname,
//           contentType: files[index].mimetype,
//           imageBase64: src,
//           user: req.user.id,
//         };

//         let newUpload = new Image(finalImg);

//         try {
//           await newUpload.save();
//           return req.flash(
//             "success_msg",
//             "Images uploaded successfully!",
//             res.redirect("/admincreate")
//           );
//         } catch (error) {
//           console.log(error);
//           return req.flash(
//             "error_msg",
//             "Something went wrong!",
//             res.redirect("/admincreate/entry/images")
//           );
//         }
//       });
//       return res.redirect("/admincreate");
//     }
//     req.flash("error_msg", "No images selected!");
//     res.redirect("/admincreate/entry/images");
//   }
// );

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
      rating,
      bookingStatus,
    } = req.body;
    const errors = [];
    //   let menu = req.files.menu;
    //   menu.mv(path.resolve(__dirname, "..", "public/docs", menu.name));

    if (desc.length < 500) {
      errors.push({ msg: "Description must be atleast 500 characters" });
      //   req.flash("warning_msg", "Description must be atleast 500 characters");
      return res.render("admin/createEntry", {
        layout: "layouts/layout",
        name,
        location,
        desc: desc.replace(/(<([^>]+)>)/gi, ""),
        typeOfVenue,
        rating,
        errors,
      });
    }
    await Post.create({
      name,
      desc: desc.replace(/(<([^>]+)>)/gi, ""),
      typeOfPlace,
      location,
      typeOfVenue,
      rating,
      bookingStatus,
      user: req.user.id,
    }).then((post) => {
      req.flash(
        "upload_msg",
        "Post created. Next step: Add images and menu to your entry for verification."
      );
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
