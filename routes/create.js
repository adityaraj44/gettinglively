const express = require("express");
const router = express.Router();
const path = require("path");
const User = require("../models/User");
const Post = require("../models/Post");
const Review = require("../models/Review");
const Offer = require("../models/Offer");
const Detailed = require("../models/Detailed");
const { ensureAdmin, ensureAuthenticated } = require("../middlewares/auth");
const nodemailer = require("nodemailer");
const PageDetail = require("../models/PageDetail");
const algoliasearch = require("algoliasearch");
const NodeGeocoder = require("node-geocoder");
const fetch = require("node-fetch");
// get request to the /admincreate

router.get("/", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    res.render("admin/create", {
      layout: "layouts/layout",
      helper: require("../helpers/ejs"),
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
      const { subject, body, rou } = req.body;
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
        const users = await User.find({ role: `${rou}` });
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ID,
            pass: process.env.PASS,
          },
        });
        users.forEach((user) => {
          var mailOptions = {
            to: user.email,
            from: "Getting Lively",
            subject: subject,
            html: body,
            // text: body,
          };
          smtpTransport
            .sendMail(mailOptions)

            .catch((err) => console.log(err));
        });
        req.flash("success_msg", "Emails sent successfully");
        req.session.save(() => {
          res.redirect("/admincreate");
        });
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// get detail page
router.get(
  "/pagedetails",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const pagedetails = await PageDetail.find({}).lean();

      res.render("admin/pagedetails", {
        layout: "layouts/layout",
        pagedetails,
        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// post detail page
router.post(
  "/pagedetails",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { title, desc, typeOfPlace } = req.body;
      const errors = [];

      let image = req.files.image;
      image.mv(path.resolve(__dirname, "..", "public/img", image.name));

      if (desc.length > 200) {
        errors.push({ msg: "Description must be less than 200 characters" });
        //   req.flash("warning_msg", "Description must be atleast 500 characters");
        return res.render("admin/pagedetails", {
          layout: "layouts/layout",
          title,

          desc: desc.replace(/(<([^>]+)>)/gi, ""),

          errors,
        });
      }
      await PageDetail.create({
        title,
        desc,
        typeOfPlace,

        user: req.user.id,
        image: "/img/" + image.name,
      }).then((post) => {
        req.flash("upload_msg", "Detail created.");
      });
      res.redirect("/admincreate");
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// edit page detail image

// edit page detail
router.get(
  "/edit/pagedetail/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const pagedetail = await PageDetail.findOne({
        _id: req.params.id,
      }).lean();
      if (!pagedetail) {
        return res.render("error/404");
      } else {
        res.render("admin/editPageDetail", {
          layout: "layouts/layout",
          pagedetail,
          user: req.user,
          helper: require("../helpers/ejs"),
        });
      }
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

router.put(
  "/edit/pagedetail/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { title, desc, typeOfPlace } = req.body;
      const errors = [];

      let pagedetail = await PageDetail.findById(req.params.id).lean();
      if (desc.length > 200) {
        errors.push({ msg: "Description must be less than 200 characters" });
        req.flash(
          "warning_msg",
          "Description must be less than 200 characters"
        );
        return res.render("admin/editPageDetail", {
          layout: "layouts/layout",
          title,

          desc: desc.replace(/(<([^>]+)>)/gi, ""),

          errors,
        });
      }

      if (!pagedetail) {
        return res.render("error/404");
      } else {
        pagedetail = await PageDetail.findOneAndUpdate(
          {
            _id: req.params.id,
          },
          {
            desc,
            typeOfPlace,

            title,
          },
          {
            new: true,
            runValidators: true,
          }
        );

        pagedetail.save().then((go) => {
          req.flash("success_msg", "Page Detail edited successfully!");
          res.redirect(`/admincreate/pagedetails`);
        });
      }
    } catch (error) {
      console.log(error);
      return res.render("errors/404");
    }
  }
);

// delete page detail
router.delete(
  "/delete/pagedetail/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      let pagedetail = await PageDetail.findById(req.params.id).lean();
      await PageDetail.remove({ _id: req.params.id });
      req.flash("success_msg", "Page Detail Deleted Successfully!");
      res.redirect(`/admincreate/pagedetails`);
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

router.get("/entry", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    res.render("admin/createEntry", {
      layout: "layouts/layout",
      helper: require("../helpers/ejs"),
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
      //   apiKey: "AIzaSyCnlwozEPLpM58UqIkb2OKfhVEkTP3aGUQ",
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
      return res.render("admin/createEntry", {
        layout: "layouts/layout",
        name,
        location,
        city,
        desc: desc.replace(/(<([^>]+)>)/gi, ""),
        typeOfVenue,
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
    await Post.create({
      name,
      desc,
      city,
      typeOfPlace,
      location,
      postcode,
      shortPost: shortpost,

      typeOfVenue,
      nearCodes: finalCodes,
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
      premier: "basic",
      advance: "basic",
      promoted: "basic",
      paymentStatus: "paid",
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
      //   text: "Your entry has been created. Please add images and menu to publish your entry.",
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
              ><a href="mailto:noreplymail@gettinglively.co.uk"
                >noreplymail@gettinglively.co.uk</a
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
              ><a href="mailto:noreplymail@gettinglively.co.uk"
                >noreplymail@gettinglively.co.uk</a
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
      const reviewEntries = await Post.find({
        reviewStatus: "inprocess",
        paymentStatus: "paid",
      })
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
      const allOffers = await Offer.find({
        post: req.params.id,
        offerStatus: "paid",
      })
        .populate("post")
        .populate("user")
        .sort({ createdAt: "desc" })
        .lean();
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
      res.render("entries/entryDetail", {
        layout: "layouts/layout",
        entry,
        allOffers,
        // detailed,
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

          // algolia
          const client = algoliasearch(
            process.env.SEARCH_APP_ID,
            process.env.SEARCH_APP_KEY
          );
          const index = client.initIndex("dev_BARS");
          index
            .saveObject(
              { entry },
              {
                autoGenerateObjectIDIfNotExist: true,
              }
            )
            .then((error) => {
              console.log(error);
            });

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

      let entry = await Post.findById(req.params.id).lean();
      if (desc.length < 300) {
        errors.push({ msg: "Description must be atleast 300 characters" });
        //   req.flash("warning_msg", "Description must be atleast 500 characters");
        return res.render("entries/editEntry", {
          layout: "layouts/layout",
          entry,
          user: req.user,
          errors,
        });
      }

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
            city,
            postcode,
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

// post offer
router.post(
  "/createoffer/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { offername, offeramount, offerdesc } = req.body;

      const entry = await Post.findById({ _id: req.params.id });
      if (entry) {
        await Offer.create({
          offername,
          offerdesc,
          offeramount,
          offerStatus: "paid",
          user: req.user.id,
          post: req.params.id,
        }).then((data) => {
          req.flash("success_msg", "Offer created successfully!");
          res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
        });
      } else {
        req.flash("error_msg", "Error in creating offer.");
        res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
      }
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// delete
// delete offer
router.delete(
  "/myentries/offer/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      let offer = await Offer.findById(req.params.id).populate("post").lean();
      await Offer.remove({ _id: req.params.id });
      req.flash("success_msg", "Offer Deleted Successfully!");
      res.redirect(`/admincreate/myentries/entry/${offer.post._id}`);
    } catch (error) {
      console.log(error);
      return res.render("errors/500");
    }
  }
);

// get edit offer page
router.get(
  "/myentries/offer/edit/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const offer = await Offer.findOne({ _id: req.params.id })
        .populate("post")
        .lean();
      if (!offer) {
        return res.render("error/404");
      }
      if (offer.user != req.user.id) {
        req.flash("error_msg", "Cannot process request at the moment!");
        res.redirect(`/admincreate/myentries/entry/${offer.post._id}`);
      } else {
        res.render("entries/offeredit", {
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

router.put(
  "/createoffer/edit/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { offername, offerdesc, offeramount } = req.body;
      if (!offerdesc) {
        req.flash("error_msg", "Please enter description");
        return res.redirect(
          `/admincreate/myentries/offer/edit/${req.params.id}`
        );
      }
      let offer = await Offer.findById(req.params.id).populate("post").lean();
      if (!offer) {
        return res.render("error/404");
      }

      if (offer.user != req.user.id) {
        req.flash("error_msg", "You can not edit this offer. Try again!");
        res.redirect(`/admincreate/myentries/entry/${offer.post._id}`);
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
              res.redirect(`/admincreate/myentries/entry/${offer.post._id}`);
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

// add images page
router.get(
  "/myentries/entry/editattach/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entry = await Post.findOne({ _id: req.params.id }).lean();
      console.log(entry);
      if (!entry) {
        return res.render("error/404");
      } else {
        res.render("admin/editAttachadmin", {
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

// put images and menu
router.put(
  "/myentries/entry/editattach/:id",
  ensureAuthenticated,
  ensureAdmin,
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

//
// get add detailed review page
router.get(
  "/promotedreview/add/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id });
      if (!entry) {
        req.flash("error_msg", "No entry found at the moment.");
        res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
      }
      res.render("admin/createDetailed", {
        layout: "layouts/layout",
        entry,
        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// post detailed review
router.post(
  "/promotedreview/add/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { detailTitle, detailDesc } = req.body;
      const errors = [];
      const entry = await Post.findById({ _id: req.params.id });
      if (detailDesc.length < 300) {
        errors.push({ msg: "Description must be atleast 300 characters" });
        //   req.flash("warning_msg", "Description must be atleast 500 characters");
        return res.render("admin/createDetailed", {
          layout: "layouts/layout",
          detailTitle,
          entry,
          detailDesc: detailDesc.replace(/(<([^>]+)>)/gi, ""),
          helper: require("../helpers/ejs"),
          errors,
        });
      }
      if (entry.detailPresent == "no") {
        entry.detailPresent = "yes";
        entry.detailTitle = detailTitle;
        entry.detailDesc = detailDesc;
        await entry.save();
        req.flash("success_msg", "Detailed created successfully.");
        req.session.save(() => {
          res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
        });
      }
      //   req.flash("success_msg", "Detailed created successfully.");
      //   res.redirect("/admin/allplans");
    } catch (error) {
      console.log(error);
      res.render("errors/500");
    }
  }
);

// edit detailed review
router.get(
  "/promotedreview/edit/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const entry = await Post.findById({ _id: req.params.id });
      if (!entry) {
        req.flash("error_msg", "No review found at the moment.");
        res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
      }
      res.render("admin/editDetailed", {
        layout: "layouts/layout",
        entry,
        helper: require("../helpers/ejs"),
      });
    } catch (error) {
      console.log(error);
      res.render("errors/pagenotfound");
    }
  }
);

// put detailed review
router.put(
  "/promotedreview/edit/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { detailTitle, detailDesc } = req.body;
      const errors = [];

      let entry = await Post.findById({ _id: req.params.id }).lean();
      if (detailDesc.length < 300) {
        errors.push({ msg: "Description must be atleast 300 characters" });
        //   req.flash("warning_msg", "Description must be atleast 500 characters");
        return res.render("admin/editDetailed", {
          layout: "layouts/layout",
          entry,
          helper: require("../helpers/ejs"),
          errors,
        });
      }

      if (!entry) {
        return res.render("error/404");
      } else {
        entry = await Post.findOneAndUpdate(
          {
            _id: req.params.id,
          },
          {
            detailTitle,
            detailDesc,
          },
          {
            new: true,
            runValidators: true,
          }
        );

        entry.save();
        req.flash("success_msg", "Review edited successfully!");

        req.session.save(() => {
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
