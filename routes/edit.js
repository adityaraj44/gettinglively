const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const Post = require("../models/Post");
const path = require("path");

// get edit page
router.get(
  "/entries/:id",
  ensureAuthenticated,

  async (req, res) => {
    try {
      const entry = await Post.findOne({ _id: req.params.id }).lean();
      if (!entry) {
        return res.render("error/404");
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

router.put("/entries/:id", ensureAuthenticated, async (req, res) => {
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

    // let cover = req.files.cover;
    // cover.mv(path.resolve(__dirname, "..", "public/img", cover.name));
    // let image1 = req.files.image1;
    // image1.mv(path.resolve(__dirname, "..", "public/img", image1.name));
    // let image2 = req.files.image2;
    // image2.mv(path.resolve(__dirname, "..", "public/img", image2.name));
    // let image3 = req.files.image3;
    // image3.mv(path.resolve(__dirname, "..", "public/img", image3.name));
    // let image4 = req.files.image4;
    // image4.mv(path.resolve(__dirname, "..", "public/img", image4.name));
    // let image5 = req.files.image5;
    // image5.mv(path.resolve(__dirname, "..", "public/img", image5.name));
    // let image6 = req.files.image6;
    // image6.mv(path.resolve(__dirname, "..", "public/img", image6.name));
    // let image7 = req.files.image7;
    // image7.mv(path.resolve(__dirname, "..", "public/img", image7.name));
    // let image8 = req.files.image8;
    // image8.mv(path.resolve(__dirname, "..", "public/img", image8.name));
    // let image9 = req.files.image9;
    // image9.mv(path.resolve(__dirname, "..", "public/img", image9.name));

    // if (req.files.menu) {
    //   let menu = req.files.menu;
    //   menu.mv(path.resolve(__dirname, "..", "public/docs", menu.name));

    if (desc.length < 300) {
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
        res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
      });
    }
    // } else {
    //   if (desc.length < 300) {
    //     errors.push({ msg: "Description must be atleast 500 characters" });
    //     //   req.flash("warning_msg", "Description must be atleast 500 characters");
    //     return res.render("entries/editEntry", {
    //       layout: "layouts/layout",
    //       errors,
    //     });
    //   }
    //   let entry = await Post.findById(req.params.id).lean();
    //   if (!entry) {
    //     return res.render("error/404");
    //   } else {
    //     entry = await Post.findOneAndUpdate(
    //       {
    //         _id: req.params.id,
    //       },
    //       {
    //         name,
    //         desc,
    //         typeOfPlace,
    //         location,
    //         postcode,
    //         city,
    //         typeOfVenue,
    //         bookingStatus,
    //         monopening,
    //         monclose,
    //         tueopening,
    //         tueclose,
    //         wedopening,
    //         wedclose,
    //         thuopening,
    //         thuclose,
    //         friopening,
    //         friclose,
    //         satopening,
    //         satclose,
    //         sunopening,
    //         sunclose,
    //         reviewStatus: "inprocess",

    //         cover: "/img/" + cover.name,
    //         image1: "/img/" + image1.name,
    //         image2: "/img/" + image2.name,
    //         image3: "/img/" + image3.name,
    //         image4: "/img/" + image4.name,
    //         image5: "/img/" + image5.name,
    //         image6: "/img/" + image6.name,
    //         image7: "/img/" + image7.name,
    //         image8: "/img/" + image8.name,
    //         image9: "/img/" + image9.name,
    //       },
    //       {
    //         new: true,
    //         runValidators: true,
    //       }
    //     );
    //     entry.reviewStatus = "inprocess";
    //     entry.save().then((go) => {
    //       req.flash("success_msg", "Entry edited successfully!");
    //       res.redirect(`/admincreate/myentries/entry/${req.params.id}`);
    //     });
    //   }
    // }
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

module.exports = router;
