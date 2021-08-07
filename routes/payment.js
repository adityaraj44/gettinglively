const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const Offer = require("../models/Offer");
const { paymentsApi, locationsApi } = require("../middlewares/square");
const { v4: uuidv4 } = require("uuid");
const voucher_codes = require("voucher-code-generator");
const Voucher = require("../models/Voucher");
const nodemailer = require("nodemailer");

router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const allOffer = await Offer.findById({ _id: req.params.id })
      .populate("user")
      .lean();

    if (allOffer) {
      res.render("payment", {
        allOffer,
        layout: "layouts/layout",
        user: req.user,
        helper: require("../helpers/ejs"),
      });
    } else {
      res.render("errors/500");
    }
  } catch (error) {
    console.log(error);
    res.render("errors/pagenotfound");
  }
});

router.post("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const allOffer = await Offer.findById({ _id: req.params.id })

      .populate("user")
      .lean();

    const voucher_code = voucher_codes.generate({
      length: 16,
      count: 1,
      pattern: "####-####-####-####",
      prefix: "gettinglively-",
      charset: voucher_codes.charset("alphanumeric"),
    });

    const token = req.body.sourceId;
    // console.log(req.header.arguments);
    // length of idempotency_key should be less than 45
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
        amount: allOffer.offeramount * 100, // $1.00 charge
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
        const newPayment = new Voucher({
          vouchercode: voucher_code[0],
          offer: req.params.id,
          user: req.user._id,
          post: allOffer.post,
        });

        newPayment.save().then((resp) => {
          req.flash(
            "success_msg",
            `Offer purchased successfully. Your code is ${voucher_code[0]}. Voucher code has also been sent on your email. You can now close this window.`
          );

          req.session.save(function () {
            res.redirect(req.originalUrl);
          });
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
          subject: "Voucher Purchased",
          text: `Voucher purchased successfully. Your code: ${voucher_code[0]}.  Voucher codes can be redeemed offline on the venues or online on the
          merchant's website.`,
          // text: body,
        };
        smtpTransport
          .sendMail(mailOptions)

          .catch((err) => console.log(err));
        console.log("done");
      } else {
        req.flash("error_msg", "Payment Failed. Try again");
        res.redirect(`/places/entries/entry/${allOffer.post}`);
      }
      console.log(result);
    } catch (error) {
      console.log(error);
      req.flash("error_msg", "Payment Failed. Try again");
      res.redirect(`/places/entries/entry/${allOffer.post}`);
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
