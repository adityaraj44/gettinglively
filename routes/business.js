const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Review = require("../models/Review");
const Offer = require("../models/Offer");
const Voucher = require("../models/Voucher");
const Detailed = require("../models/Detailed");
const path = require("path");
const { paymentsApi, locationsApi } = require("../middlewares/square");
const { v4: uuidv4 } = require("uuid");
const { ensureAuthenticated, ensureBusiness } = require("../middlewares/auth");
const nodemailer = require("nodemailer");
// const { response } = require("express");
const cron = require("node-cron");
const NodeGeocoder = require("node-geocoder");
const fetch = require("node-fetch");
const bcrypt = require("bcrypt");

// get business dash
router.get("/", ensureAuthenticated, ensureBusiness, async (req, res) => {
  try {
    const allBusinessEntries = await Post.find({
      user: req.user.id,
      reviewStatus: "reviewed",
    })
      .populate("user")
      .sort({ createdAt: "desc" })
      .lean();
    res.render("businessmember/businessdash", {
      layout: "layouts/layout",
      allBusinessEntries,
      helper: require("../helpers/ejs"),
    });
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

router.get(
  "/createentries",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      res.render("businessmember/createBusinessEntry", {
        layout: "layouts/layout",
      });
      //   res.render("businessmember/businessdash", {
      //     layout: "layouts/layout",
      //     helper: require("../helpers/ejs"),
      //   });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// post entry
router.post(
  "/createentries",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const {
        name,
        desc,
        typeOfPlace,
        typeOfVenue,
        location,
        city,
        postcode,
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

      const options = {
        provider: "openstreetmap",
        // apiKey: "AIzaSyCnlwozEPLpM58UqIkb2OKfhVEkTP3aGUQ",
      };

      const geocoder = NodeGeocoder(options);
      const address = `${req.body.city}, ${req.body.postcode}`;
      // Using callback
      const resp = await geocoder.geocode(address);
      let nearcodes = [];
      let finalCodes;
      await fetch(`https://api.postcodes.io/postcodes?lon=${resp[0].longitude}&lat=${resp[0].latitude}&limit=100&radius=2000
      `)
        .then((res) => res.json())
        .then((json) => {
          console.log(json.result.length),
            json.result.forEach((elem) => {
              // console.log(elem.postcode);
              nearcodes.push(elem.postcode);
            });
          console.log(nearcodes);
        });

      finalCodes = nearcodes.toString();
      console.log(finalCodes);

      const shortpost = req.body.postcode.split(" ")[0];

      if (desc.length < 300) {
        errors.push({ msg: "Description must be atleast 300 characters" });
        //   req.flash("warning_msg", "Description must be atleast 500 characters");
        return res.render("businessmember/createBusinessEntry", {
          layout: "layouts/layout",
          name,
          location,
          desc: desc.replace(/(<([^>]+)>)/gi, ""),
          typeOfVenue,
          city,
          postcode,
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

      //   payment login will be written here

      await Post.create({
        name,
        desc,
        typeOfPlace,
        location,
        shortPost: shortpost,
        city,
        nearCodes: finalCodes,
        postcode,
        typeOfVenue,
        bookingStatus,
        premier: "basic",
        advance: "basic",
        promoted: "basic",
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
      }).then((post) => {
        req.flash("upload_msg", "Entry created and sent for verification.");
      });
      var smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.ID,
          pass: process.env.PASS,
        },
      });

      var mailOptions = {
        to: req.user.email,
        from: "Getting Lively",
        subject: "Entry Created",
        // text: "Your entry has been created. Please proceed with payment to make your entry public.",
        html: `<style>
          .titleTxt {
            font-size: 18px;
          }
    
          a {
            text-decoration: none;

          }
    
          .loginBtn {
            outline: none;
            box-sizing: border-box;
            color: rgb(255, 255, 255);
            background-color: #ec4d37;
            border: none;
            padding: 5px 20px;
            cursor: pointer;
            border-radius: 5px;
            display: flex;
            margin: auto;
          }
    
          .footer {
            text-align: center;
          }
        </style>
        <div style="color: #000;">
          <p class="titleTxt" style="font-size:18px;"><strong>Dear ${req.user.name},</strong></p>
          <br />
          <p>
          Entry created successfully. Go to your entry to add more images and menu.
          </p>
          
          <button class="loginBtn" style="background-color:red;
          outline: none;
         box-sizing: border-box;
        color: rgb(255, 255, 255);
        background-color: #ec4d37;
        border: none;
        padding: 5px 20px;
        cursor: pointer;
        border-radius: 5px;
        text-decoration:none;
        display: flex;
        margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Go back to Getting Lively</a></button>
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreply@gettinglively.co.uk"
                >noreply@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            We strongly suggest that you familiarise yourself with our Terms of
            Service before getting started. These can be found at the bottom of any
            page on our website.
          </p>
          <p>Thank you for choosing us!</p>
          <p>
            If you have any questions or concerns, please do not hesitate to contact
            us via our Live Chat or Contact Form on our website.
          </p>
          <p><strong>Regards,</strong></p>
          <p><strong>The Getting Lively Team</strong></p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreply@gettinglively.co.uk"
                >noreply@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            STAY SAFE, STAY SECURE: We never ask for your personal account details
            by email.
          </p>
          <p>
            The information in this message is confidential and is intended solely
            for the addressee.
          </p>
          <p>
            Access to this e-mail by anyone else is unauthorised. If you are not the
            intended recipient, any disclosure, copying, distribution or any action
            taken or omitted in reliance on this, is prohibited and may be unlawful.
          </p>
          <p>
            Whilst all sensible steps are taken to ensure the accuracy and integrity
            of information and data transmitted electronically and to preserve the
            confidentiality thereof, no liability or responsibility whatsoever is
            accepted if information or data is, for whatever reason, corrupted or
            does not reach its intended destination.
          </p>
          <p>
            This email was sent to you by
            <span><a href="https://gettinglively.com">gettinglively.com</a></span>
          </p>
          <p>
            If you’re having trouble clicking the "Login" button, copy and paste the
            URL below into your web browser: <span
              ><a href="https://gettinglively.com/users/login"
                >https://gettinglively.com/users/login</a
              ></span
            >
          </p>
          <br />
          <br />
          <footer class="footer" style="text-align:center;">
            <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
          </footer>
        </div>`,
        // text: body,
      };
      smtpTransport
        .sendMail(mailOptions)

        .catch((err) => console.log(err));
      req.flash(
        "success_msg",
        "Entry created. Proceed with payment to send the newly created entry for approval."
      );
      req.session.save(() => {
        res.redirect("/business/entries/pendingpayment");
      });
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

router.get(
  "/reviewentries",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const reviewEntries = await Post.find({
        user: req.user.id,
        reviewStatus: "inprocess",
        paymentStatus: "paid",
      })
        .populate("user")

        .sort({ createdAt: "desc" })
        .lean();
      res.render("businessmember/reviewEntries", {
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

// get single entry
router.get(
  "/myentries/entry/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findById({
        _id: req.params.id,
        user: req.user.id,
      })
        .populate("user")
        .lean();
      const allOffers = await Offer.find({
        post: req.params.id,
        offerStatus: "paid",
      })
        .populate("post")
        .populate("user")
        .sort({ createdAt: "desc" })
        .lean();
      // detail
      //   const detailed = await Detailed.find({}).populate("post").lean();
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
      res.render("businessmember/entryDetailBusiness", {
        layout: "layouts/layout",
        entry,
        allReview,
        allOffers,
        // detailed,
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

// delete business entry
router.delete(
  "/myentries/entry/delete/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      await Post.remove({ _id: req.params.id });
      req.flash("success_msg", "Entry Deleted Successfully!");
      res.redirect("/business");
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

// get edit page
router.get(
  "/myentries/entry/edit/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findOne({ _id: req.params.id }).lean();
      if (!entry) {
        return res.render("error/404");
      }
      if (entry.user != req.user.id) {
        req.flash("error_msg", "Cannot process request at the moment!");
        res.redirect(`/business/myentries/entry/${req.params.id}`);
      } else {
        res.render("businessmember/editBusinessEntry", {
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

// edit entry using method overrride
// /myentries/entry/delete/:id
router.put(
  "/myentries/entry/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const {
        name,
        desc,
        typeOfPlace,
        typeOfVenue,
        location,
        city,
        postcode,
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

      //   let cover = req.files.cover;
      //   cover.mv(path.resolve(__dirname, "..", "public/img", cover.name));
      //   let image1 = req.files.image1;
      //   image1.mv(path.resolve(__dirname, "..", "public/img", image1.name));
      //   let image2 = req.files.image2;
      //   image2.mv(path.resolve(__dirname, "..", "public/img", image2.name));
      //   let image3 = req.files.image3;
      //   image3.mv(path.resolve(__dirname, "..", "public/img", image3.name));
      //   let image4 = req.files.image4;
      //   image4.mv(path.resolve(__dirname, "..", "public/img", image4.name));
      //   let image5 = req.files.image5;
      //   image5.mv(path.resolve(__dirname, "..", "public/img", image5.name));
      //   let image6 = req.files.image6;
      //   image6.mv(path.resolve(__dirname, "..", "public/img", image6.name));
      //   let image7 = req.files.image7;
      //   image7.mv(path.resolve(__dirname, "..", "public/img", image7.name));
      //   let image8 = req.files.image8;
      //   image8.mv(path.resolve(__dirname, "..", "public/img", image8.name));
      //   let image9 = req.files.image9;
      //   image9.mv(path.resolve(__dirname, "..", "public/img", image9.name));

      //   if (req.files.menu) {
      //     let menu = req.files.menu;
      //     menu.mv(path.resolve(__dirname, "..", "public/docs", menu.name));
      let entry = await Post.findById(req.params.id).lean();

      if (desc.length < 300) {
        errors.push({ msg: "Description must be atleast 300 characters" });
        //   req.flash("warning_msg", "Description must be atleast 500 characters");
        return res.render("businessmember/editBusinessEntry", {
          layout: "layouts/layout",
          entry,
          errors,
        });
      }
      //   let entry = await Post.findById(req.params.id).lean();
      if (!entry) {
        return res.render("error/404");
      }
      if (entry.user != req.user.id) {
        req.flash("error_msg", "You can not edit this entry. Try again!");
        res.redirect(`/business/myentries/entry/${req.params.id}`);
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
            postcode,
            city,
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
            // cover: "/img/" + cover.name,
            // image1: "/img/" + image1.name,
            // image2: "/img/" + image2.name,
            // image3: "/img/" + image3.name,
            // image4: "/img/" + image4.name,
            // image5: "/img/" + image5.name,
            // image6: "/img/" + image6.name,
            // image7: "/img/" + image7.name,
            // image8: "/img/" + image8.name,
            // image9: "/img/" + image9.name,
            // menu: "/docs/" + menu.name,
          },
          {
            new: true,
            runValidators: true,
          }
        );
        entry.reviewStatus = "inprocess";
        entry.save().then((go) => {
          req.flash("success_msg", "Entry edited successfully!");
          res.redirect(`/business/myentries/entry/${req.params.id}`);
        });
      }
      //   } else {
      //     if (desc.length < 300) {
      //       errors.push({ msg: "Description must be atleast 500 characters" });
      //       //   req.flash("warning_msg", "Description must be atleast 500 characters");
      //       return res.render("businessmember/editBusinessEntry", {
      //         layout: "layouts/layout",
      //         errors,
      //       });
      //     }
      //     let entry = await Post.findById(req.params.id).lean();
      //     if (!entry) {
      //       return res.render("error/404");
      //     }
      //     if (entry.user != req.user.id) {
      //       req.flash("error_msg", "You can not edit this entry. Try again!");
      //       res.redirect(`/business/myentries/entry/${req.params.id}`);
      //     } else {
      //       entry = await Post.findOneAndUpdate(
      //         {
      //           _id: req.params.id,
      //         },
      //         {
      //           name,
      //           desc,
      //           typeOfPlace,
      //           location,
      //           postcode,
      //           city,
      //           typeOfVenue,
      //           bookingStatus,
      //           monopening,
      //           monclose,
      //           tueopening,
      //           tueclose,
      //           wedopening,
      //           wedclose,
      //           thuopening,
      //           thuclose,
      //           friopening,
      //           friclose,
      //           satopening,
      //           satclose,
      //           sunopening,
      //           sunclose,
      //           reviewStatus: "inprocess",
      //           user: req.user.id,
      //           cover: "/img/" + cover.name,
      //           image1: "/img/" + image1.name,
      //           image2: "/img/" + image2.name,
      //           image3: "/img/" + image3.name,
      //           image4: "/img/" + image4.name,
      //           image5: "/img/" + image5.name,
      //           image6: "/img/" + image6.name,
      //           image7: "/img/" + image7.name,
      //           image8: "/img/" + image8.name,
      //           image9: "/img/" + image9.name,
      //         },
      //         {
      //           new: true,
      //           runValidators: true,
      //         }
      //       );
      //       entry.reviewStatus = "inprocess";
      //       entry.save().then((go) => {
      //         req.flash("success_msg", "Entry edited successfully!");
      //         res.redirect(`/business/myentries/entry/${req.params.id}`);
      //       });
      //     }
      //   }
    } catch (error) {
      console.log(error);
      return res.render("errors/404");
    }
  }
);

// edit images and menu page
router.get(
  "/myentries/entry/editattach/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findOne({ _id: req.params.id }).lean();

      if (!entry) {
        return res.render("error/404");
      } else {
        res.render("businessmember/editAttach", {
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

router.put(
  "/myentries/entry/editattach/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      if (req.files.cover) {
        let cover = req.files.cover;
        cover.mv(path.resolve(__dirname, "..", "public/img", cover.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              cover: "/img/" + cover.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.image1) {
        let image1 = req.files.image1;
        image1.mv(path.resolve(__dirname, "..", "public/img", image1.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              image1: "/img/" + image1.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.image2) {
        let image2 = req.files.image2;
        image2.mv(path.resolve(__dirname, "..", "public/img", image2.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              image2: "/img/" + image2.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.image3) {
        let image3 = req.files.image3;
        image3.mv(path.resolve(__dirname, "..", "public/img", image3.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              image3: "/img/" + image3.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.image4) {
        let image4 = req.files.image4;
        image4.mv(path.resolve(__dirname, "..", "public/img", image4.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              image4: "/img/" + image4.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.image5) {
        let image5 = req.files.image5;
        image5.mv(path.resolve(__dirname, "..", "public/img", image5.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              image5: "/img/" + image5.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.image6) {
        let image6 = req.files.image6;
        image6.mv(path.resolve(__dirname, "..", "public/img", image6.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              image6: "/img/" + image6.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.image7) {
        let image7 = req.files.image7;
        image7.mv(path.resolve(__dirname, "..", "public/img", image7.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              image7: "/img/" + image7.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.image8) {
        let image8 = req.files.image8;
        image8.mv(path.resolve(__dirname, "..", "public/img", image8.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              image8: "/img/" + image8.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.image9) {
        let image9 = req.files.image9;
        image9.mv(path.resolve(__dirname, "..", "public/img", image9.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              image9: "/img/" + image9.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Image uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      } else if (req.files.menu) {
        let menu = req.files.menu;
        menu.mv(path.resolve(__dirname, "..", "public/docs", menu.name));
        let entry = await Post.findById(req.params.id).lean();
        if (!entry) {
          return res.render("error/404");
        }
        if (entry.user != req.user.id) {
          req.flash("error_msg", "You can not edit this entry. Try again!");
          res.redirect(req.originalUrl);
        } else {
          entry = await Post.findOneAndUpdate(
            {
              _id: req.params.id,
            },
            {
              reviewStatus: "inprocess",

              menu: "/docs/" + menu.name,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          entry.reviewStatus = "inprocess";
          entry.save().then((go) => {
            req.flash("success_msg", "Menu uploaded successfully!");
            res.redirect(req.originalUrl);
          });
        }
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// post offer
router.post(
  "/createoffer/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const { offername, offeramount, offerdesc } = req.body;
      const entry = await Post.findById({ _id: req.params.id });
      console.log(entry);
      if (entry && entry.user._id.toString() == req.user._id.toString()) {
        await Offer.create({
          offername,
          offerdesc,
          offeramount,
          user: req.user.id,
          post: req.params.id,
        }).then((data) => {
          req.flash("success_msg", "Offer created successfully!");
          //   res.redirect(`/business/myentries/entry/${req.params.id}`);
        });
        await Post.findById({ _id: req.params.id }).then((post) => {
          if (post.reviewStatus == "reviewed") {
            post.reviewStatus = "inprocess";
          }
          post.save((err) => {
            // req.flash("success_msg", "Offer edited successfully");
            res.redirect(`/business/myentries/entry/${req.params.id}`);
          });
        });
      } else {
        req.flash(
          "error_msg",
          "Not allowed to create offer as you are not the owner of this post."
        );
        res.redirect(`/business/myentries/entry/${req.params.id}`);
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// delete
// delete business entry
router.delete(
  "/myentries/offer/delete/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      let offer = await Offer.findById(req.params.id).populate("post").lean();
      await Offer.remove({ _id: req.params.id });
      req.flash("success_msg", "Offer Deleted Successfully!");
      res.redirect(`/business/myentries/entry/${offer.post._id}`);
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

// get offer edit page
router.get(
  "/myentries/offer/edit/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const offer = await Offer.findOne({ _id: req.params.id })
        .populate("post")
        .lean();
      if (!offer) {
        return res.render("error/404");
      } else {
        res.render("businessmember/offeredit", {
          layout: "layouts/layout",
          offer,
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

// edit offer
router.put(
  "/createoffer/edit/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const { offername, offerdesc, offeramount } = req.body;
      if (!offerdesc) {
        req.flash("error_msg", "Please enter description");
        return res.redirect(`/business/myentries/offer/edit/${req.params.id}`);
      }
      let offer = await Offer.findById(req.params.id).populate("post").lean();
      if (!offer) {
        return res.render("error/404");
      } else {
        offer = await Offer.findOneAndUpdate(
          {
            _id: req.params.id,
          },
          {
            offername,
            offerdesc,
            offeramount,
          },
          {
            new: true,
            runValidators: true,
          }
        );
        await Post.findById({ _id: offer.post }).then((post) => {
          if (post.reviewStatus == "reviewed") {
            post.reviewStatus = "inprocess";
          }
          post.save((err) => {
            offer.save().then((go) => {
              req.flash("success_msg", "Offer edited successfully");
              res.redirect(`/business/myentries/entry/${offer.post._id}`);
            });
          });
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

router.get(
  "/entries/pendingpayment",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const pendingEntries = await Post.find({
        paymentStatus: "pending",
        user: req.user.id,
      })
        .sort({ createdAt: "desc" })
        .lean();

      const pendingOffers = await Offer.find({
        offerStatus: "pending",
        user: req.user.id,
      }).lean();
      res.render("businessmember/pendingPayment", {
        layout: "layouts/layout",
        pendingEntries,
        pendingOffers,
        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

router.get(
  "/entries/paymentpage/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id })
        .populate("user")
        .lean();
      const amount = 1;
      if (entry) {
        res.render("businessmember/payment", {
          entry,
          amount,
          layout: "layouts/layout",
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// get offer payment page
router.get(
  "/offers/paymentpage/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const offer = await Offer.findById({ _id: req.params.id })
        .populate("user")
        .lean();
      const amount = 1;
      if (offer) {
        res.render("businessmember/paymentOffer", {
          offer,
          amount,
          layout: "layouts/layout",
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      } else {
        res.render("errors/404");
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// post method of payment of offer
router.post(
  "/offers/paymentpage/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const verifyPayment = await Offer.findById({ _id: req.params.id })
        .populate("user")
        .lean();

      if (verifyPayment.offerStatus == "pending") {
        const token = req.body.sourceId;
        const idempotencyKey = uuidv4();
        // get the currency for the location
        const locationResponse = await locationsApi.retrieveLocation(
          process.env.SQUARE_PROD_LOCATION_ID
        );
        const currency = locationResponse.result.location.currency;
        // Charge the customer's card
        const requestBody = {
          idempotencyKey,
          sourceId: token,
          locationId: "LZ6W6KA5YDE19",
          amountMoney: {
            amount: 100, // $1.00 charge
            currency,
          },
        };
        try {
          const {
            result: { payment },
          } = await paymentsApi.createPayment(requestBody);

          const result = JSON.stringify(
            payment,
            (key, value) => {
              return typeof value === "bigint" ? parseInt(value) : value;
            },
            4
          );

          if (result) {
            console.log(result);
            await Offer.findById({ _id: req.params.id }).then((offer) => {
              if (offer.offerStatus == "pending") {
                offer.offerStatus = "paid";
                offer.offerId = payment.orderId;
                offer.offerCreationCardBrand =
                  payment.cardDetails.card.cardBrand;
                offer.offerCreationCardLast4 = payment.cardDetails.card.last4;
                offer.offerCreationCardExpMon =
                  payment.cardDetails.card.expMonth;
                offer.offerCreationCardExpYear =
                  payment.cardDetails.card.expYear;
                offer.offerCreationCardType = payment.cardDetails.card.cardType;
                offer.offerpaymentCreationDate = payment.createdAt;
              }
              offer.save((err) => {
                req.flash(
                  "success_msg",
                  "Payment successfull. Offer sent for review. You may now close this browser window."
                );
                req.session.save(function () {
                  res.redirect(req.originalUrl);
                });
              });
            });
          } else {
            req.flash("error_msg", "Payment Failed. Try again");
            req.session.save(function () {
              res.redirect(req.originalUrl);
            });
          }
        } catch (error) {
          console.log(error);
          req.flash("error_msg", "Payment Failed. Try again");
          req.session.save(function () {
            res.redirect(req.originalUrl);
          });
        }
      } else {
        req.flash("error_msg", "Offer Already Activated!");

        req.session.save(function () {
          res.redirect(req.originalUrl);
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

router.post(
  "/entries/paymentpage/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const verifyPayment = await Post.findById({ _id: req.params.id })
        .populate("user")
        .lean();

      if (verifyPayment.paymentStatus == "pending") {
        const token = req.body.sourceId;
        const idempotencyKey = uuidv4();
        // get the currency for the location
        const locationResponse = await locationsApi.retrieveLocation(
          process.env.SQUARE_PROD_LOCATION_ID
        );
        const currency = locationResponse.result.location.currency;
        // Charge the customer's card
        const requestBody = {
          idempotencyKey,
          sourceId: token,
          locationId: "LZ6W6KA5YDE19",
          amountMoney: {
            amount: 100, // $1.00 charge
            currency,
          },
          //   appFeeMoney: {
          //     amount: 10,
          //     currency,
          //   },
        };
        try {
          const {
            result: { payment },
          } = await paymentsApi.createPayment(requestBody);

          const result = JSON.stringify(
            payment,
            (key, value) => {
              return typeof value === "bigint" ? parseInt(value) : value;
            },
            4
          );

          if (result) {
            console.log(payment);
            await Post.findById({ _id: req.params.id }).then((post) => {
              if (post.paymentStatus == "pending") {
                post.paymentStatus = "paid";
                post.entryId = payment.orderId;
                post.entryCreationCardBrand =
                  payment.cardDetails.card.cardBrand;
                post.entryCreationCardLast4 = payment.cardDetails.card.last4;
                post.entryCreationCardExpMon =
                  payment.cardDetails.card.expMonth;
                post.entryCreationCardExpYear =
                  payment.cardDetails.card.expYear;
                post.entryCreationCardType = payment.cardDetails.card.cardType;
                post.entrypaymentCreationDate = payment.createdAt;
              }
              post.save((err) => {
                req.flash(
                  "success_msg",
                  "Payment successfull. Entry sent for review. You may now close this browser window."
                );
                var smtpTransport = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    user: process.env.ID,
                    pass: process.env.PASS,
                  },
                });

                var mailOptions = {
                  to: req.user.email,
                  from: "Getting Lively",
                  subject: "Entry Activated",
                  //   text: "You've successfully activated your entry. Entry is now sent for approval.",
                  html: `<style>
          .titleTxt {
            font-size: 18px;
          }
    
          a {
            text-decoration: none;

          }
    
          .loginBtn {
            outline: none;
            box-sizing: border-box;
            color: rgb(255, 255, 255);
            background-color: #ec4d37;
            border: none;
            padding: 5px 20px;
            cursor: pointer;
            border-radius: 5px;
            display: flex;
            margin: auto;
          }
    
          .footer {
            text-align: center;
          }
        </style>
        <div style="color: #000;">
          <p class="titleTxt" style="font-size:18px;"><strong>Dear ${req.user.name},</strong></p>
          <br />
          <p>
          Payment for activation of your entry is successful. Entry sent for approval.
          </p>
          
          <button class="loginBtn" style="background-color:red;
          outline: none;
         box-sizing: border-box;
        color: rgb(255, 255, 255);
        background-color: #ec4d37;
        border: none;
        padding: 5px 20px;
        cursor: pointer;
        border-radius: 5px;
        text-decoration:none;
        display: flex;
        margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Go back to Getting Lively</a></button>
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreply@gettinglively.co.uk"
                >noreply@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            We strongly suggest that you familiarise yourself with our Terms of
            Service before getting started. These can be found at the bottom of any
            page on our website.
          </p>
          <p>Thank you for choosing us!</p>
          <p>
            If you have any questions or concerns, please do not hesitate to contact
            us via our Live Chat or Contact Form on our website.
          </p>
          <p><strong>Regards,</strong></p>
          <p><strong>The Getting Lively Team</strong></p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreply@gettinglively.co.uk"
                >noreply@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            STAY SAFE, STAY SECURE: We never ask for your personal account details
            by email.
          </p>
          <p>
            The information in this message is confidential and is intended solely
            for the addressee.
          </p>
          <p>
            Access to this e-mail by anyone else is unauthorised. If you are not the
            intended recipient, any disclosure, copying, distribution or any action
            taken or omitted in reliance on this, is prohibited and may be unlawful.
          </p>
          <p>
            Whilst all sensible steps are taken to ensure the accuracy and integrity
            of information and data transmitted electronically and to preserve the
            confidentiality thereof, no liability or responsibility whatsoever is
            accepted if information or data is, for whatever reason, corrupted or
            does not reach its intended destination.
          </p>
          <p>
            This email was sent to you by
            <span><a href="https://gettinglively.com">gettinglively.com</a></span>
          </p>
          <p>
            If you’re having trouble clicking the "Login" button, copy and paste the
            URL below into your web browser: <span
              ><a href="https://gettinglively.com/users/login"
                >https://gettinglively.com/users/login</a
              ></span
            >
          </p>
          <br />
          <br />
          <footer class="footer" style="text-align:center;">
            <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
          </footer>
        </div>`,
                  // text: body,
                };
                smtpTransport
                  .sendMail(mailOptions)

                  .catch((err) => console.log(err));
                setTimeout(() => {
                  post.paymentStatus = "pending";
                  post.save();
                  var smtpTransport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                      user: process.env.ID,
                      pass: process.env.PASS,
                    },
                  });

                  var mailOptions = {
                    to: req.user.email,
                    from: "Getting Lively",
                    subject: "Entry Expired",
                    // text: `Your entry ${post.name} has expired. Visit out website and renew today.`,
                    html: `<style>
          .titleTxt {
            font-size: 18px;
          }
    
          a {
            text-decoration: none;

          }
    
          .loginBtn {
            outline: none;
            box-sizing: border-box;
            color: rgb(255, 255, 255);
            background-color: #ec4d37;
            border: none;
            padding: 5px 20px;
            cursor: pointer;
            border-radius: 5px;
            display: flex;
            margin: auto;
          }
    
          .footer {
            text-align: center;
          }
        </style>
        <div style="color: #000;">
          <p class="titleTxt" style="font-size:18px;"><strong>Dear ${req.user.name},</strong></p>
          <br />
          <p>
          Your entry ${post.name} has expired. Visit out website and renew today.
          </p>
          
          <button class="loginBtn" style="background-color:red;
          outline: none;
         box-sizing: border-box;
        color: rgb(255, 255, 255);
        background-color: #ec4d37;
        border: none;
        padding: 5px 20px;
        cursor: pointer;
        border-radius: 5px;
        text-decoration:none;
        display: flex;
        margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Go back to Getting Lively</a></button>
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreply@gettinglively.co.uk"
                >noreply@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            We strongly suggest that you familiarise yourself with our Terms of
            Service before getting started. These can be found at the bottom of any
            page on our website.
          </p>
          <p>Thank you for choosing us!</p>
          <p>
            If you have any questions or concerns, please do not hesitate to contact
            us via our Live Chat or Contact Form on our website.
          </p>
          <p><strong>Regards,</strong></p>
          <p><strong>The Getting Lively Team</strong></p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <p>
            To ensure delivery to your inbox (not bulk or junk folders), please add
            <span
              ><a href="mailto:noreply@gettinglively.co.uk"
                >noreply@gettinglively.co.uk</a
              ></span
            >
            to your safe senders list or address book.
          </p>
          <p>
            STAY SAFE, STAY SECURE: We never ask for your personal account details
            by email.
          </p>
          <p>
            The information in this message is confidential and is intended solely
            for the addressee.
          </p>
          <p>
            Access to this e-mail by anyone else is unauthorised. If you are not the
            intended recipient, any disclosure, copying, distribution or any action
            taken or omitted in reliance on this, is prohibited and may be unlawful.
          </p>
          <p>
            Whilst all sensible steps are taken to ensure the accuracy and integrity
            of information and data transmitted electronically and to preserve the
            confidentiality thereof, no liability or responsibility whatsoever is
            accepted if information or data is, for whatever reason, corrupted or
            does not reach its intended destination.
          </p>
          <p>
            This email was sent to you by
            <span><a href="https://gettinglively.com">gettinglively.com</a></span>
          </p>
          <p>
            If you’re having trouble clicking the "Login" button, copy and paste the
            URL below into your web browser: <span
              ><a href="https://gettinglively.com/users/login"
                >https://gettinglively.com/users/login</a
              ></span
            >
          </p>
          <br />
          <br />
          <footer class="footer" style="text-align:center;">
            <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
          </footer>
        </div>`,
                    // text: body,
                  };
                  smtpTransport
                    .sendMail(mailOptions)

                    .catch((err) => console.log(err));

                  console.log("done");
                }, 2147483647);
                res.redirect(req.originalUrl);
              });
            });
          } else {
            req.flash("error_msg", "Payment Failed. Try again");
            res.redirect(req.originalUrl);
          }
        } catch (error) {
          console.log(error);
          req.flash("error_msg", "Payment Failed. Try again");
          res.redirect(req.originalUrl);
        }
      } else {
        req.flash("error_msg", "Already paid!");

        res.redirect(req.originalUrl);
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// get manage listing page
//
router.get(
  "/managelisting",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const allBusinessEntries = await Post.find({
        user: req.user.id,
        reviewStatus: "reviewed",
      })
        .populate("user")
        .sort({ createdAt: "desc" })
        .lean();

      const allVouchers = await Voucher.find({})
        .populate("post")
        .populate("user")
        .populate("offer")
        .sort({ createdAt: "desc" })
        .lean();
      console.log(allVouchers);

      res.render("businessmember/managelisting", {
        layout: "layouts/layout",
        allBusinessEntries,
        allVouchers,
        user: req.user,
        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/entrieswithplans",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const allBusinessEntries = await Post.find({
        user: req.user.id,
        reviewStatus: "reviewed",
      })
        .populate("user")
        .sort({ createdAt: "desc" })
        .lean();

      // const allVouchers = await Voucher.find({})
      //   .populate("post")
      //   .populate("user")
      //   .populate("offer")
      //   .sort({ createdAt: "desc" })
      //   .lean();
      // console.log(allVouchers);

      res.render("businessmember/plans", {
        layout: "layouts/layout",
        allBusinessEntries,
        // allVouchers,
        user: req.user,
        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// get pricing and plans page
router.get(
  "/pricingandplans/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id })
        .populate("user")
        .lean();
      const amount_premier = 50;
      const amount_advancedpremier = 100;
      const amount_promoted = 200;
      if (entry) {
        res.render("businessmember/pricingplans", {
          entry,
          amount_premier,
          amount_advancedpremier,
          amount_promoted,
          layout: "layouts/layout",
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// get premier plan payment
router.get(
  "/pricingandplans/premier/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id })
        .populate("user")
        .lean();
      const amount = 50;
      if (entry) {
        res.render("businessmember/paymentlisting", {
          entry,
          amount,
          layout: "layouts/layout",
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      } else {
        req.flash("error_msg", "Cannot proceed with payment.");
        req.session.save(function () {
          res.redirect(`/business/pricingandplans/${req.params.id}`);
        });
        // res.redirect(`/business/pricingandplans/${req.params.id}`);
      }
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// post method payment of premier plan
router.post(
  "/pricingandplans/premier/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id })
        .populate("user")
        .lean();
      if (entry.premier == "basic" || entry.premier == "renew") {
        const token = req.body.sourceId;
        const idempotencyKey = uuidv4();
        // get the currency for the location
        const locationResponse = await locationsApi.retrieveLocation(
          process.env.SQUARE_PROD_LOCATION_ID
        );
        const currency = locationResponse.result.location.currency;
        // Charge the customer's card
        const requestBody = {
          idempotencyKey,
          sourceId: token,
          locationId: "LZ6W6KA5YDE19",
          amountMoney: {
            amount: 100,
            currency,
          },
        };
        try {
          const {
            result: { payment },
          } = await paymentsApi.createPayment(requestBody);

          const result = JSON.stringify(
            payment,
            (key, value) => {
              return typeof value === "bigint" ? parseInt(value) : value;
            },
            4
          );

          if (result) {
            console.log(result);
            await Post.findById({ _id: req.params.id }).then((post) => {
              if (post.premier == "basic" || post.premier == "renew") {
                post.premier = "valid";
                post.premierplanId = payment.orderId;
                post.premierplanCreationCardBrand =
                  payment.cardDetails.card.cardBrand;
                post.premierplanCreationCardLast4 =
                  payment.cardDetails.card.last4;
                post.premierplanCreationCardExpMon =
                  payment.cardDetails.card.expMonth;
                post.premierplanCreationCardExpYear =
                  payment.cardDetails.card.expYear;
                post.premierplanCreationCardType =
                  payment.cardDetails.card.cardType;
                post.premierplanpaymentCreationDate = payment.createdAt;
              }
              post.save((err) => {
                req.flash(
                  "success_msg",
                  "Payment successfull. You have successfully bought out premier plan of 1 week validity."
                );
                var smtpTransport = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    user: process.env.ID,
                    pass: process.env.PASS,
                  },
                });

                var mailOptions = {
                  to: req.user.email,
                  from: "Getting Lively",
                  subject: "Plan Purchased",
                  //   text: "You've bought our Premier listing plan. Plan expires in 7 days. Visit our website to renew the plan or buy another.",
                  html: `<style>
                .titleTxt {
                  font-size: 18px;
                }
          
                a {
                  text-decoration: none;
      
                }
          
                .loginBtn {
                  outline: none;
                  box-sizing: border-box;
                  color: rgb(255, 255, 255);
                  background-color: #ec4d37;
                  border: none;
                  padding: 5px 20px;
                  cursor: pointer;
                  border-radius: 5px;
                  display: flex;
                  margin: auto;
                }
          
                .footer {
                  text-align: center;
                }
              </style>
              <div style="color: #000;">
                <p class="titleTxt" style="font-size:18px;"><strong>Dear ${req.user.name},</strong></p>
                <br />
                <p>
                You've bought our Premier listing plan. Plan expires in 7 days. You can renew your plan anytime or buy another too.
                </p>
                
                <button class="loginBtn" style="background-color:red;
                outline: none;
               box-sizing: border-box;
              color: rgb(255, 255, 255);
              background-color: #ec4d37;
              border: none;
              padding: 5px 20px;
              cursor: pointer;
              border-radius: 5px;
              text-decoration:none;
              display: flex;
              margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Go back to Getting Lively</a></button>
                <p>
                  To ensure delivery to your inbox (not bulk or junk folders), please add
                  <span
                    ><a href="mailto:noreply@gettinglively.co.uk"
                      >noreply@gettinglively.co.uk</a
                    ></span
                  >
                  to your safe senders list or address book.
                </p>
                <p>
                  We strongly suggest that you familiarise yourself with our Terms of
                  Service before getting started. These can be found at the bottom of any
                  page on our website.
                </p>
                <p>Thank you for choosing us!</p>
                <p>
                  If you have any questions or concerns, please do not hesitate to contact
                  us via our Live Chat or Contact Form on our website.
                </p>
                <p><strong>Regards,</strong></p>
                <p><strong>The Getting Lively Team</strong></p>
                <br />
                <br />
                <br />
                <br />
                <br />
                <p>
                  To ensure delivery to your inbox (not bulk or junk folders), please add
                  <span
                    ><a href="mailto:noreply@gettinglively.co.uk"
                      >noreply@gettinglively.co.uk</a
                    ></span
                  >
                  to your safe senders list or address book.
                </p>
                <p>
                  STAY SAFE, STAY SECURE: We never ask for your personal account details
                  by email.
                </p>
                <p>
                  The information in this message is confidential and is intended solely
                  for the addressee.
                </p>
                <p>
                  Access to this e-mail by anyone else is unauthorised. If you are not the
                  intended recipient, any disclosure, copying, distribution or any action
                  taken or omitted in reliance on this, is prohibited and may be unlawful.
                </p>
                <p>
                  Whilst all sensible steps are taken to ensure the accuracy and integrity
                  of information and data transmitted electronically and to preserve the
                  confidentiality thereof, no liability or responsibility whatsoever is
                  accepted if information or data is, for whatever reason, corrupted or
                  does not reach its intended destination.
                </p>
                <p>
                  This email was sent to you by
                  <span><a href="https://gettinglively.com">gettinglively.com</a></span>
                </p>
                <p>
                  If you’re having trouble clicking the "Login" button, copy and paste the
                  URL below into your web browser: <span
                    ><a href="https://gettinglively.com/users/login"
                      >https://gettinglively.com/users/login</a
                    ></span
                  >
                </p>
                <br />
                <br />
                <footer class="footer" style="text-align:center;">
                  <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
                </footer>
              </div>`,
                  // text: body,
                };
                smtpTransport
                  .sendMail(mailOptions)

                  .catch((err) => console.log(err));
                //   post.planStart = Date.now();
                //   post.planEnd = post.planStart + 20000;
                //   post.save();
                //   cron.schedule("* * * * * *", async function (req, res, next) {
                //     let current_date = Date.now();
                //     if (current_date == post.planEnd) {
                //       post.listing = "basic";
                //       post.planStart = undefined;
                //       post.planEnd = undefined;
                //       post.save((err) => {
                //         console.log("Expired");
                //       });
                //     }
                //   });

                setTimeout(() => {
                  post.premier = "renew";
                  post.save();
                  var smtpTransport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                      user: process.env.ID,
                      pass: process.env.PASS,
                    },
                  });

                  var mailOptions = {
                    to: req.user.email,
                    from: "Getting Lively",
                    subject: "Renew your plan",
                    // text: "Your current premier promotion plan has been expired. Visit our website to renew the plan or buy another.",
                    html: `<style>
                    .titleTxt {
                      font-size: 18px;
                    }
              
                    a {
                      text-decoration: none;
          
                    }
              
                    .loginBtn {
                      outline: none;
                      box-sizing: border-box;
                      color: rgb(255, 255, 255);
                      background-color: #ec4d37;
                      border: none;
                      padding: 5px 20px;
                      cursor: pointer;
                      border-radius: 5px;
                      display: flex;
                      margin: auto;
                    }
              
                    .footer {
                      text-align: center;
                    }
                  </style>
                  <div style="color: #000;">
                    <p class="titleTxt" style="font-size:18px;"><strong>Dear ${req.user.name},</strong></p>
                    <br />
                    <p>
                    Your current premier promotion plan has been expired. Visit our website to renew the plan or buy another.
                    </p>
                    
                    <button class="loginBtn" style="background-color:red;
                    outline: none;
                   box-sizing: border-box;
                  color: rgb(255, 255, 255);
                  background-color: #ec4d37;
                  border: none;
                  padding: 5px 20px;
                  cursor: pointer;
                  border-radius: 5px;
                  text-decoration:none;
                  display: flex;
                  margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Go back to Getting Lively</a></button>
                    <p>
                      To ensure delivery to your inbox (not bulk or junk folders), please add
                      <span
                        ><a href="mailto:noreply@gettinglively.co.uk"
                          >noreply@gettinglively.co.uk</a
                        ></span
                      >
                      to your safe senders list or address book.
                    </p>
                    <p>
                      We strongly suggest that you familiarise yourself with our Terms of
                      Service before getting started. These can be found at the bottom of any
                      page on our website.
                    </p>
                    <p>Thank you for choosing us!</p>
                    <p>
                      If you have any questions or concerns, please do not hesitate to contact
                      us via our Live Chat or Contact Form on our website.
                    </p>
                    <p><strong>Regards,</strong></p>
                    <p><strong>The Getting Lively Team</strong></p>
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <p>
                      To ensure delivery to your inbox (not bulk or junk folders), please add
                      <span
                        ><a href="mailto:noreply@gettinglively.co.uk"
                          >noreply@gettinglively.co.uk</a
                        ></span
                      >
                      to your safe senders list or address book.
                    </p>
                    <p>
                      STAY SAFE, STAY SECURE: We never ask for your personal account details
                      by email.
                    </p>
                    <p>
                      The information in this message is confidential and is intended solely
                      for the addressee.
                    </p>
                    <p>
                      Access to this e-mail by anyone else is unauthorised. If you are not the
                      intended recipient, any disclosure, copying, distribution or any action
                      taken or omitted in reliance on this, is prohibited and may be unlawful.
                    </p>
                    <p>
                      Whilst all sensible steps are taken to ensure the accuracy and integrity
                      of information and data transmitted electronically and to preserve the
                      confidentiality thereof, no liability or responsibility whatsoever is
                      accepted if information or data is, for whatever reason, corrupted or
                      does not reach its intended destination.
                    </p>
                    <p>
                      This email was sent to you by
                      <span><a href="https://gettinglively.com">gettinglively.com</a></span>
                    </p>
                    <p>
                      If you’re having trouble clicking the "Login" button, copy and paste the
                      URL below into your web browser: <span
                        ><a href="https://gettinglively.com/users/login"
                          >https://gettinglively.com/users/login</a
                        ></span
                      >
                    </p>
                    <br />
                    <br />
                    <footer class="footer" style="text-align:center;">
                      <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
                    </footer>
                  </div>`,
                    // text: body,
                  };
                  smtpTransport
                    .sendMail(mailOptions)

                    .catch((err) => console.log(err));

                  console.log("done");
                }, 604800000);
                req.session.save(function () {
                  res.redirect(`/business/managelisting`);
                });
                // res.redirect(req.originalUrl);
              });
            });
          } else {
            req.flash("error_msg", "Payment Failed. Try again");
            req.session.save(function () {
              res.redirect(`/business/managelisting`);
            });
            // res.redirect(req.originalUrl);
          }
        } catch (error) {
          console.log(error);

          req.flash("error_msg", "Payment Failed. Try again");
          req.session.save(function () {
            res.redirect(`/business/managelisting`);
          });
          //   res.redirect(req.originalUrl);
        }
      } else {
        req.flash("error_msg", "You've already purchased this plan.");
        req.session.save(function () {
          res.redirect(`/business/managelisting`);
        });
        // res.redirect(req.originalUrl);
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// get advancepremier plan payment
router.get(
  "/pricingandplans/advancepremier/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id })
        .populate("user")
        .lean();
      const amount = 100;
      if (entry) {
        res.render("businessmember/paymentlistingadvance", {
          entry,
          amount,
          layout: "layouts/layout",
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      } else {
        req.flash("error_msg", "Cannot proceed with payment.");
        res.redirect(`/business/pricingandplans/${req.params.id}`);
      }
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// post advance plan

router.post(
  "/pricingandplans/advancepremier/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id })
        .populate("user")
        .lean();
      if (entry.advance == "basic" || entry.advance == "renew") {
        const token = req.body.sourceId;
        const idempotencyKey = uuidv4();
        // get the currency for the location
        const locationResponse = await locationsApi.retrieveLocation(
          process.env.SQUARE_PROD_LOCATION_ID
        );
        const currency = locationResponse.result.location.currency;
        // Charge the customer's card
        const requestBody = {
          idempotencyKey,
          sourceId: token,
          locationId: "LZ6W6KA5YDE19",
          amountMoney: {
            amount: 100, // $1.00 charge
            currency,
          },
        };
        try {
          const {
            result: { payment },
          } = await paymentsApi.createPayment(requestBody);

          const result = JSON.stringify(
            payment,
            (key, value) => {
              return typeof value === "bigint" ? parseInt(value) : value;
            },
            4
          );

          if (result) {
            console.log(result);
            await Post.findById({ _id: req.params.id }).then((post) => {
              if (post.advance == "basic" || post.advance == "renew") {
                post.advance = "valid";
                post.advanceplanId = payment.orderId;
                post.advanceplanCreationCardBrand =
                  payment.cardDetails.card.cardBrand;
                post.advanceplanCreationCardLast4 =
                  payment.cardDetails.card.last4;
                post.advanceplanCreationCardExpMon =
                  payment.cardDetails.card.expMonth;
                post.advanceplanCreationCardExpYear =
                  payment.cardDetails.card.expYear;
                post.advanceplanCreationCardType =
                  payment.cardDetails.card.cardType;
                post.advanceplanpaymentCreationDate = payment.createdAt;
              }
              post.save((err) => {
                req.flash(
                  "success_msg",
                  "Payment successfull. You have successfully bought out advance premier plan of 1 week validity."
                );
                var smtpTransport = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    user: process.env.ID,
                    pass: process.env.PASS,
                  },
                });

                var mailOptions = {
                  to: req.user.email,
                  from: "Getting Lively",
                  subject: "Plan Purchased",
                  //   text: "You've bought our Advance Premier listing plan. Plan expires in 7 days. Visit our website to renew the plan or buy another.",
                  html: `<style>
                .titleTxt {
                  font-size: 18px;
                }
          
                a {
                  text-decoration: none;
      
                }
          
                .loginBtn {
                  outline: none;
                  box-sizing: border-box;
                  color: rgb(255, 255, 255);
                  background-color: #ec4d37;
                  border: none;
                  padding: 5px 20px;
                  cursor: pointer;
                  border-radius: 5px;
                  display: flex;
                  margin: auto;
                }
          
                .footer {
                  text-align: center;
                }
              </style>
              <div style="color: #000;">
                <p class="titleTxt" style="font-size:18px;"><strong>Dear ${req.user.name},</strong></p>
                <br />
                <p>
                You've bought our Advance Premier listing plan. Plan expires in 7 days. You can renew your plan anytime or buy another too.
                </p>
                
                <button class="loginBtn" style="background-color:red;
                outline: none;
               box-sizing: border-box;
              color: rgb(255, 255, 255);
              background-color: #ec4d37;
              border: none;
              padding: 5px 20px;
              cursor: pointer;
              border-radius: 5px;
              text-decoration:none;
              display: flex;
              margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Go back to Getting Lively</a></button>
                <p>
                  To ensure delivery to your inbox (not bulk or junk folders), please add
                  <span
                    ><a href="mailto:noreply@gettinglively.co.uk"
                      >noreply@gettinglively.co.uk</a
                    ></span
                  >
                  to your safe senders list or address book.
                </p>
                <p>
                  We strongly suggest that you familiarise yourself with our Terms of
                  Service before getting started. These can be found at the bottom of any
                  page on our website.
                </p>
                <p>Thank you for choosing us!</p>
                <p>
                  If you have any questions or concerns, please do not hesitate to contact
                  us via our Live Chat or Contact Form on our website.
                </p>
                <p><strong>Regards,</strong></p>
                <p><strong>The Getting Lively Team</strong></p>
                <br />
                <br />
                <br />
                <br />
                <br />
                <p>
                  To ensure delivery to your inbox (not bulk or junk folders), please add
                  <span
                    ><a href="mailto:noreply@gettinglively.co.uk"
                      >noreply@gettinglively.co.uk</a
                    ></span
                  >
                  to your safe senders list or address book.
                </p>
                <p>
                  STAY SAFE, STAY SECURE: We never ask for your personal account details
                  by email.
                </p>
                <p>
                  The information in this message is confidential and is intended solely
                  for the addressee.
                </p>
                <p>
                  Access to this e-mail by anyone else is unauthorised. If you are not the
                  intended recipient, any disclosure, copying, distribution or any action
                  taken or omitted in reliance on this, is prohibited and may be unlawful.
                </p>
                <p>
                  Whilst all sensible steps are taken to ensure the accuracy and integrity
                  of information and data transmitted electronically and to preserve the
                  confidentiality thereof, no liability or responsibility whatsoever is
                  accepted if information or data is, for whatever reason, corrupted or
                  does not reach its intended destination.
                </p>
                <p>
                  This email was sent to you by
                  <span><a href="https://gettinglively.com">gettinglively.com</a></span>
                </p>
                <p>
                  If you’re having trouble clicking the "Login" button, copy and paste the
                  URL below into your web browser: <span
                    ><a href="https://gettinglively.com/users/login"
                      >https://gettinglively.com/users/login</a
                    ></span
                  >
                </p>
                <br />
                <br />
                <footer class="footer" style="text-align:center;">
                  <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
                </footer>
              </div>`,

                  // text: body,
                };
                smtpTransport
                  .sendMail(mailOptions)

                  .catch((err) => console.log(err));
                //   post.planStart = Date.now();
                //   post.planEnd = post.planStart + 20000;
                //   post.save();
                //   cron.schedule("* * * * * *", async function (req, res, next) {
                //     let current_date = Date.now();
                //     if (current_date == post.planEnd) {
                //       post.listing = "basic";
                //       post.planStart = undefined;
                //       post.planEnd = undefined;
                //       post.save((err) => {
                //         console.log("Expired");
                //       });
                //     }
                //   });

                setTimeout(() => {
                  post.advance = "renew";
                  post.save();
                  var smtpTransport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                      user: process.env.ID,
                      pass: process.env.PASS,
                    },
                  });

                  var mailOptions = {
                    to: req.user.email,
                    from: "Getting Lively",
                    subject: "Renew your plan",
                    // text: "Your current promotion plan has been expired. Visit our website to renew the plan or buy another.",
                    html: `<style>
                    .titleTxt {
                      font-size: 18px;
                    }
              
                    a {
                      text-decoration: none;
          
                    }
              
                    .loginBtn {
                      outline: none;
                      box-sizing: border-box;
                      color: rgb(255, 255, 255);
                      background-color: #ec4d37;
                      border: none;
                      padding: 5px 20px;
                      cursor: pointer;
                      border-radius: 5px;
                      display: flex;
                      margin: auto;
                    }
              
                    .footer {
                      text-align: center;
                    }
                  </style>
                  <div style="color: #000;">
                    <p class="titleTxt" style="font-size:18px;"><strong>Dear ${req.user.name},</strong></p>
                    <br />
                    <p>
                    Your current Advanced Premier Listing plan has been expired. Visit our website to renew or buy another.
                    </p>
                    
                    <button class="loginBtn" style="background-color:red;
                    outline: none;
                   box-sizing: border-box;
                  color: rgb(255, 255, 255);
                  background-color: #ec4d37;
                  border: none;
                  padding: 5px 20px;
                  cursor: pointer;
                  border-radius: 5px;
                  text-decoration:none;
                  display: flex;
                  margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Go back to Getting Lively</a></button>
                    <p>
                      To ensure delivery to your inbox (not bulk or junk folders), please add
                      <span
                        ><a href="mailto:noreply@gettinglively.co.uk"
                          >noreply@gettinglively.co.uk</a
                        ></span
                      >
                      to your safe senders list or address book.
                    </p>
                    <p>
                      We strongly suggest that you familiarise yourself with our Terms of
                      Service before getting started. These can be found at the bottom of any
                      page on our website.
                    </p>
                    <p>Thank you for choosing us!</p>
                    <p>
                      If you have any questions or concerns, please do not hesitate to contact
                      us via our Live Chat or Contact Form on our website.
                    </p>
                    <p><strong>Regards,</strong></p>
                    <p><strong>The Getting Lively Team</strong></p>
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <p>
                      To ensure delivery to your inbox (not bulk or junk folders), please add
                      <span
                        ><a href="mailto:noreply@gettinglively.co.uk"
                          >noreply@gettinglively.co.uk</a
                        ></span
                      >
                      to your safe senders list or address book.
                    </p>
                    <p>
                      STAY SAFE, STAY SECURE: We never ask for your personal account details
                      by email.
                    </p>
                    <p>
                      The information in this message is confidential and is intended solely
                      for the addressee.
                    </p>
                    <p>
                      Access to this e-mail by anyone else is unauthorised. If you are not the
                      intended recipient, any disclosure, copying, distribution or any action
                      taken or omitted in reliance on this, is prohibited and may be unlawful.
                    </p>
                    <p>
                      Whilst all sensible steps are taken to ensure the accuracy and integrity
                      of information and data transmitted electronically and to preserve the
                      confidentiality thereof, no liability or responsibility whatsoever is
                      accepted if information or data is, for whatever reason, corrupted or
                      does not reach its intended destination.
                    </p>
                    <p>
                      This email was sent to you by
                      <span><a href="https://gettinglively.com">gettinglively.com</a></span>
                    </p>
                    <p>
                      If you’re having trouble clicking the "Login" button, copy and paste the
                      URL below into your web browser: <span
                        ><a href="https://gettinglively.com/users/login"
                          >https://gettinglively.com/users/login</a
                        ></span
                      >
                    </p>
                    <br />
                    <br />
                    <footer class="footer" style="text-align:center;">
                      <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
                    </footer>
                  </div>`,
                    // text: body,
                  };
                  smtpTransport
                    .sendMail(mailOptions)

                    .catch((err) => console.log(err));
                  console.log("done");
                }, 604800000);

                req.session.save(function () {
                  res.redirect(`/business/managelisting`);
                });
              });
            });
          } else {
            console.log("error 1");
            req.flash("error_msg", "Payment Failed. Try again");
            req.session.save(function () {
              res.redirect(`/business/managelisting`);
            });
          }
        } catch (error) {
          console.log(error);
          console.log("error 2");
          req.flash("error_msg", "Payment Failed. Try again");
          req.session.save(function () {
            res.redirect(`/business/managelisting`);
          });
        }
      } else {
        req.flash("error_msg", "You've already purchased this plan.");
        req.session.save(function () {
          res.redirect(`/business/managelisting`);
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// get promoted plan payment
router.get(
  "/pricingandplans/promoted/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id })
        .populate("user")
        .lean();
      const amount = 200;
      if (entry) {
        res.render("businessmember/paymentlistingpromoted", {
          entry,
          amount,
          layout: "layouts/layout",
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      } else {
        req.flash("error_msg", "Cannot proceed with payment.");
        req.session.save(function () {
          // res.redirect(req.originalUrl);
          res.redirect(`/business/pricingandplans/${req.params.id}`);
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// payment promoted
router.post(
  "/pricingandplans/promoted/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id })
        .populate("user")
        .lean();
      if (entry.promoted == "basic" || entry.promoted == "renew") {
        const token = req.body.sourceId;
        const idempotencyKey = uuidv4();
        // get the currency for the location
        const locationResponse = await locationsApi.retrieveLocation(
          process.env.SQUARE_PROD_LOCATION_ID
        );
        const currency = locationResponse.result.location.currency;
        // Charge the customer's card
        const requestBody = {
          idempotencyKey,
          sourceId: token,
          locationId: "LZ6W6KA5YDE19",
          amountMoney: {
            amount: 100, // $1.00 charge
            currency,
          },
        };
        try {
          const {
            result: { payment },
          } = await paymentsApi.createPayment(requestBody);

          const result = JSON.stringify(
            payment,
            (key, value) => {
              return typeof value === "bigint" ? parseInt(value) : value;
            },
            4
          );

          if (result) {
            console.log(result);
            await Post.findById({ _id: req.params.id }).then((post) => {
              if (post.promoted == "basic" || post.promoted == "renew") {
                post.promoted = "valid";
                post.promotedplanId = payment.orderId;
                post.promotedplanCreationCardBrand =
                  payment.cardDetails.card.cardBrand;
                post.promotedplanCreationCardLast4 =
                  payment.cardDetails.card.last4;
                post.promotedplanCreationCardExpMon =
                  payment.cardDetails.card.expMonth;
                post.promotedplanCreationCardExpYear =
                  payment.cardDetails.card.expYear;
                post.promotedplanCreationCardType =
                  payment.cardDetails.card.cardType;
                post.promotedplanpaymentCreationDate = payment.createdAt;
              }
              post.save((err) => {
                var smtpTransport = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    user: process.env.ID,
                    pass: process.env.PASS,
                  },
                });

                var mailOptions = {
                  to: req.user.email,
                  from: "Getting Lively",
                  subject: "Plan Purchased",
                  //   text: "You've bought our Promoted premier spot listing plan. Plan expires in 7 days. Visit our website to renew the plan or buy another.",
                  html: `<style>
                .titleTxt {
                  font-size: 18px;
                }
          
                a {
                  text-decoration: none;
      
                }
          
                .loginBtn {
                  outline: none;
                  box-sizing: border-box;
                  color: rgb(255, 255, 255);
                  background-color: #ec4d37;
                  border: none;
                  padding: 5px 20px;
                  cursor: pointer;
                  border-radius: 5px;
                  display: flex;
                  margin: auto;
                }
          
                .footer {
                  text-align: center;
                }
              </style>
              <div style="color: #000;">
                <p class="titleTxt" style="font-size:18px;"><strong>Dear ${req.user.name},</strong></p>
                <br />
                <p>
                You've bought our Promoted Premier Spot listing plan. Plan expires in 7 days. You can renew your plan anytime or buy another too.
                </p>
                
                <button class="loginBtn" style="background-color:red;
                outline: none;
               box-sizing: border-box;
              color: rgb(255, 255, 255);
              background-color: #ec4d37;
              border: none;
              padding: 5px 20px;
              cursor: pointer;
              border-radius: 5px;
              text-decoration:none;
              display: flex;
              margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Go back to Getting Lively</a></button>
                <p>
                  To ensure delivery to your inbox (not bulk or junk folders), please add
                  <span
                    ><a href="mailto:noreply@gettinglively.co.uk"
                      >noreply@gettinglively.co.uk</a
                    ></span
                  >
                  to your safe senders list or address book.
                </p>
                <p>
                  We strongly suggest that you familiarise yourself with our Terms of
                  Service before getting started. These can be found at the bottom of any
                  page on our website.
                </p>
                <p>Thank you for choosing us!</p>
                <p>
                  If you have any questions or concerns, please do not hesitate to contact
                  us via our Live Chat or Contact Form on our website.
                </p>
                <p><strong>Regards,</strong></p>
                <p><strong>The Getting Lively Team</strong></p>
                <br />
                <br />
                <br />
                <br />
                <br />
                <p>
                  To ensure delivery to your inbox (not bulk or junk folders), please add
                  <span
                    ><a href="mailto:noreply@gettinglively.co.uk"
                      >noreply@gettinglively.co.uk</a
                    ></span
                  >
                  to your safe senders list or address book.
                </p>
                <p>
                  STAY SAFE, STAY SECURE: We never ask for your personal account details
                  by email.
                </p>
                <p>
                  The information in this message is confidential and is intended solely
                  for the addressee.
                </p>
                <p>
                  Access to this e-mail by anyone else is unauthorised. If you are not the
                  intended recipient, any disclosure, copying, distribution or any action
                  taken or omitted in reliance on this, is prohibited and may be unlawful.
                </p>
                <p>
                  Whilst all sensible steps are taken to ensure the accuracy and integrity
                  of information and data transmitted electronically and to preserve the
                  confidentiality thereof, no liability or responsibility whatsoever is
                  accepted if information or data is, for whatever reason, corrupted or
                  does not reach its intended destination.
                </p>
                <p>
                  This email was sent to you by
                  <span><a href="https://gettinglively.com">gettinglively.com</a></span>
                </p>
                <p>
                  If you’re having trouble clicking the "Login" button, copy and paste the
                  URL below into your web browser: <span
                    ><a href="https://gettinglively.com/users/login"
                      >https://gettinglively.com/users/login</a
                    ></span
                  >
                </p>
                <br />
                <br />
                <footer class="footer" style="text-align:center;">
                  <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
                </footer>
              </div>`,
                  // text: body,
                };
                smtpTransport
                  .sendMail(mailOptions)

                  .catch((err) => console.log(err));
                //   post.planStart = Date.now();
                //   post.planEnd = post.planStart + 20000;
                //   post.save();
                //   cron.schedule("* * * * * *", async function (req, res, next) {
                //     let current_date = Date.now();
                //     if (current_date == post.planEnd) {
                //       post.listing = "basic";
                //       post.planStart = undefined;
                //       post.planEnd = undefined;
                //       post.save((err) => {
                //         console.log("Expired");
                //       });
                //     }
                //   });

                setTimeout(() => {
                  post.promoted = "renew";
                  post.save();
                  var smtpTransport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                      user: process.env.ID,
                      pass: process.env.PASS,
                    },
                  });

                  var mailOptions = {
                    to: req.user.email,
                    from: "Getting Lively",
                    subject: "Renew your plan",
                    // text: "Your current promotion plan has been expired. Visit our website to renew the plan or buy another.",
                    html: `<style>
                    .titleTxt {
                      font-size: 18px;
                    }
              
                    a {
                      text-decoration: none;
          
                    }
              
                    .loginBtn {
                      outline: none;
                      box-sizing: border-box;
                      color: rgb(255, 255, 255);
                      background-color: #ec4d37;
                      border: none;
                      padding: 5px 20px;
                      cursor: pointer;
                      border-radius: 5px;
                      display: flex;
                      margin: auto;
                    }
              
                    .footer {
                      text-align: center;
                    }
                  </style>
                  <div style="color: #000;">
                    <p class="titleTxt" style="font-size:18px;"><strong>Dear ${req.user.name},</strong></p>
                    <br />
                    <p>
                    Your current Promoted Premier Spot Listing plan has been expired. Visit our website to renew or buy another.
                    </p>
                    
                    <button class="loginBtn" style="background-color:red;
                    outline: none;
                   box-sizing: border-box;
                  color: rgb(255, 255, 255);
                  background-color: #ec4d37;
                  border: none;
                  padding: 5px 20px;
                  cursor: pointer;
                  border-radius: 5px;
                  text-decoration:none;
                  display: flex;
                  margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Go back to Getting Lively</a></button>
                    <p>
                      To ensure delivery to your inbox (not bulk or junk folders), please add
                      <span
                        ><a href="mailto:noreply@gettinglively.co.uk"
                          >noreply@gettinglively.co.uk</a
                        ></span
                      >
                      to your safe senders list or address book.
                    </p>
                    <p>
                      We strongly suggest that you familiarise yourself with our Terms of
                      Service before getting started. These can be found at the bottom of any
                      page on our website.
                    </p>
                    <p>Thank you for choosing us!</p>
                    <p>
                      If you have any questions or concerns, please do not hesitate to contact
                      us via our Live Chat or Contact Form on our website.
                    </p>
                    <p><strong>Regards,</strong></p>
                    <p><strong>The Getting Lively Team</strong></p>
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <p>
                      To ensure delivery to your inbox (not bulk or junk folders), please add
                      <span
                        ><a href="mailto:noreply@gettinglively.co.uk"
                          >noreply@gettinglively.co.uk</a
                        ></span
                      >
                      to your safe senders list or address book.
                    </p>
                    <p>
                      STAY SAFE, STAY SECURE: We never ask for your personal account details
                      by email.
                    </p>
                    <p>
                      The information in this message is confidential and is intended solely
                      for the addressee.
                    </p>
                    <p>
                      Access to this e-mail by anyone else is unauthorised. If you are not the
                      intended recipient, any disclosure, copying, distribution or any action
                      taken or omitted in reliance on this, is prohibited and may be unlawful.
                    </p>
                    <p>
                      Whilst all sensible steps are taken to ensure the accuracy and integrity
                      of information and data transmitted electronically and to preserve the
                      confidentiality thereof, no liability or responsibility whatsoever is
                      accepted if information or data is, for whatever reason, corrupted or
                      does not reach its intended destination.
                    </p>
                    <p>
                      This email was sent to you by
                      <span><a href="https://gettinglively.com">gettinglively.com</a></span>
                    </p>
                    <p>
                      If you’re having trouble clicking the "Login" button, copy and paste the
                      URL below into your web browser: <span
                        ><a href="https://gettinglively.com/users/login"
                          >https://gettinglively.com/users/login</a
                        ></span
                      >
                    </p>
                    <br />
                    <br />
                    <footer class="footer" style="text-align:center;">
                      <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
                    </footer>
                  </div>`,
                    // text: body,
                  };
                  smtpTransport
                    .sendMail(mailOptions)

                    .catch((err) => console.log(err));
                  console.log("done");
                }, 604800000);
                req.flash(
                  "success_msg",
                  "Payment successfull. You have successfully bought out promoted premier plan of 1 week validity."
                );
                req.session.save(function () {
                  res.redirect(`/business/managelisting`);
                });
              });
            });
          } else {
            console.log("error 1");
            req.flash("error_msg", "Payment Failed. Try again");
            req.session.save(function () {
              res.redirect(req.originalUrl);
            });
          }
        } catch (error) {
          console.log(error);
          console.log("error 2");
          req.flash("error_msg", "Payment Failed. Try again");
          req.session.save(function () {
            res.redirect(`/business/managelisting`);
          });
        }
      } else {
        req.flash("error_msg", "You've already purchased this plan.");
        req.session.save(function () {
          res.redirect(`/business/managelisting`);
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

router.get(
  "/mypayments",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entryPayments = await Post.find({
        user: req.user.id,
        paymentStatus: "paid",
      })
        .sort({ createdAt: "desc" })
        .lean();
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   }).lean();
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   }).lean();
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "",
      //   }).lean();
      //   console.log(planPaymentPromoted.length);
      const offerPayments = await Offer.find({
        user: req.user.id,
        offerStatus: "paid",
      }).lean();
      res.render("businessmember/mypayments", {
        layout: "layouts/layout",
        entryPayments,
        offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/mypayments/carddetails/entry/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entryPayment = await Post.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      //   const offerPayments = await Offer.findById({
      //     _id: req.params.id,
      //   });
      res.render("businessmember/carddetailsEntry", {
        layout: "layouts/layout",
        entryPayment,
        // offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/mypayments/carddetails/offer/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const offerPayment = await Offer.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      // const offerPayments = await Offer.findById({
      //   _id: req.params.id,
      // });
      res.render("businessmember/carddetailsOffer", {
        layout: "layouts/layout",
        offerPayment,
        //   offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/mypayments/carddetails/premier/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entryPayment = await Post.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      const offerPayments = await Offer.findById({
        _id: req.params.id,
      });
      res.render("businessmember/carddetailsPlan", {
        layout: "layouts/layout",
        entryPayment,
        offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/mypayments/carddetails/advance/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entryPayment = await Post.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      const offerPayments = await Offer.findById({
        _id: req.params.id,
      });
      res.render("businessmember/carddetailsadvance", {
        layout: "layouts/layout",
        entryPayment,
        offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

router.get(
  "/mypayments/carddetails/promoted/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const entryPayment = await Post.findById({
        _id: req.params.id,
      }).lean();
      //   console.log(entryPayment.length);
      //   const planPaymentPremier = await Post.find({
      //     user: req.user.id,
      //     listing: "premier",
      //   });
      //   const planPaymentAdvance = await Post.find({
      //     user: req.user.id,
      //     listing: "premier advance",
      //   });
      //   const planPaymentPromoted = await Post.find({
      //     user: req.user.id,
      //     listing: "promoted",
      //   });
      const offerPayments = await Offer.findById({
        _id: req.params.id,
      });
      res.render("businessmember/carddetailspromoted", {
        layout: "layouts/layout",
        entryPayment,
        offerPayments,
        // offerPayments,
        // planPaymentPremier,
        // planPaymentAdvance,
        // planPaymentPromoted,
        helper: require("../helpers/ejs"),
        user: req.user,
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// change password
// change pass page
router.get(
  "/changepassword",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const loggedUser = await User.findById({ _id: req.user.id }).lean();
      if (loggedUser) {
        res.render("businessmember/changePassword", {
          layout: "layouts/layout",
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/404");
    }
  }
);

router.post(
  "/changepassword/:id",
  ensureAuthenticated,
  ensureBusiness,
  async (req, res) => {
    try {
      const userDetail = await User.findById({ _id: req.params.id });
      const { passwordold, passwordnew } = req.body;
      if (!userDetail) {
        req.flash(
          "error_msg",
          "Cannot change password. Security issue detected!"
        );
        req.session.save(() => {
          res.redirect("/business/changepassword");
        });
      }

      bcrypt.compare(passwordold, userDetail.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          if (passwordold === passwordnew) {
            req.flash(
              "error_msg",
              "Your new password matches the old one. Please use another password."
            );
            req.session.save(() => {
              res.redirect("/business/changepassword");
            });
          } else {
            userDetail.password = passwordnew;
            userDetail.save();
            //   mail
            var smtpTransport = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: process.env.ID,
                pass: process.env.PASS,
              },
            });
            var mailOptions = {
              to: userDetail.email,
              from: "Getting Lively",
              subject: "Your password has been changed",
              //   text:
              //     "Hello,\n\n" +
              //     "This is a confirmation that the password for your account " +
              //     userDetail.email +
              //     " has just been changed.\n",
              html: `<style>
            .titleTxt {
              font-size: 18px;
            }
      
            a {
              text-decoration: none;
  
            }
      
            .loginBtn {
              outline: none;
              box-sizing: border-box;
              color: rgb(255, 255, 255);
              background-color: #ec4d37;
              border: none;
              padding: 5px 20px;
              cursor: pointer;
              border-radius: 5px;
              display: flex;
              margin: auto;
            }
      
            .footer {
              text-align: center;
            }
          </style>
          <div style="color: #000;">
            <p class="titleTxt" style="font-size:18px;"><strong>Dear ${
              userDetail.name
            },</strong></p>
            <br />
            <p>
            ${
              "This is a confirmation that the password for your account " +
              userDetail.email +
              " has just been changed."
            }
            </p>
            
            <button class="loginBtn" style="background-color:red;
            outline: none;
           box-sizing: border-box;
          color: rgb(255, 255, 255);
          background-color: #ec4d37;
          border: none;
          padding: 5px 20px;
          cursor: pointer;
          border-radius: 5px;
          text-decoration:none;
          display: flex;
          margin: auto;"><a href="https://gettinglively.com" style="color: #fff;">Back to Getting Lively</a></button>
            <p>
              To ensure delivery to your inbox (not bulk or junk folders), please add
              <span
                ><a href="mailto:noreply@gettinglively.co.uk"
                  >noreply@gettinglively.co.uk</a
                ></span
              >
              to your safe senders list or address book.
            </p>
            <p>
              We strongly suggest that you familiarise yourself with our Terms of
              Service before getting started. These can be found at the bottom of any
              page on our website.
            </p>
            <p>Thank you for choosing us!</p>
            <p>
              If you have any questions or concerns, please do not hesitate to contact
              us via our Live Chat or Contact Form on our website.
            </p>
            <p><strong>Regards,</strong></p>
            <p><strong>The Getting Lively Team</strong></p>
            <br />
            <br />
            <br />
            <br />
            <br />
            <p>
              To ensure delivery to your inbox (not bulk or junk folders), please add
              <span
                ><a href="mailto:noreply@gettinglively.co.uk"
                  >noreply@gettinglively.co.uk</a
                ></span
              >
              to your safe senders list or address book.
            </p>
            <p>
              STAY SAFE, STAY SECURE: We never ask for your personal account details
              by email.
            </p>
            <p>
              The information in this message is confidential and is intended solely
              for the addressee.
            </p>
            <p>
              Access to this e-mail by anyone else is unauthorised. If you are not the
              intended recipient, any disclosure, copying, distribution or any action
              taken or omitted in reliance on this, is prohibited and may be unlawful.
            </p>
            <p>
              Whilst all sensible steps are taken to ensure the accuracy and integrity
              of information and data transmitted electronically and to preserve the
              confidentiality thereof, no liability or responsibility whatsoever is
              accepted if information or data is, for whatever reason, corrupted or
              does not reach its intended destination.
            </p>
            <p>
              This email was sent to you by
              <span><a href="https://gettinglively.com">gettinglively.com</a></span>
            </p>
            <p>
              If you’re having trouble clicking the "Login" button, copy and paste the
              URL below into your web browser: <span
                ><a href="https://gettinglively.com/users/login"
                  >https://gettinglively.com/users/login</a
                ></span
              >
            </p>
            <br />
            <br />
            <footer class="footer" style="text-align:center;">
              <p><strong>© 2021 Getting Lively. All rights reserved.</strong></p>
            </footer>
          </div>`,
            };
            smtpTransport
              .sendMail(mailOptions)

              .catch((err) => console.log(err));
            req.flash("success_msg", "Password changed successfully.");
            req.session.save(() => {
              res.redirect("/business");
            });
          }
        } else {
          req.flash("error_msg", "You have entered wrong password.");
          req.session.save(() => {
            res.redirect("/business/changepassword");
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.render("errors/404");
    }
  }
);

module.exports = router;
