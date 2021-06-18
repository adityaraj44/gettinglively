const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const Offer = require("../models/Offer");
const { paymentsApi, locationsApi } = require("../middlewares/square");
const { v4: uuidv4 } = require("uuid");

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

router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const token = req.body.sourceId;
    // console.log(req.header.arguments);
    // length of idempotency_key should be less than 45
    const idempotencyKey = uuidv4();
    // get the currency for the location
    const locationResponse = await locationsApi.retrieveLocation(
      process.env.SQUARE_LOCATION_ID
    );
    const currency = locationResponse.result.location.currency;
    // Charge the customer's card
    const requestBody = {
      idempotencyKey,
      sourceId: token,
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

      res.json({
        result,
      });
      console.log(result);
    } catch (error) {
      res.json(error.result);
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
