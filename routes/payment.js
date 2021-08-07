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
          //   text: `Voucher purchased successfully. Your code: ${voucher_code[0]}.  Voucher codes can be redeemed offline on the venues or online on the
          //   merchant's website.`,
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
          Voucher purchased successfully. Your code: ${voucher_code[0]}.  Voucher codes can be redeemed offline on the venues or online on the merchant's website.
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
