const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    offername: {
      type: String,
      required: true,
    },
    offerdesc: {
      type: String,
      required: true,
    },
    offerStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "paid"],
    },
    offeramount: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    offerPaymentCreationDate: String,
    offerCreationCardBrand: String,
    offerId: String,
    offerCreationCardLast4: String,
    offerCreationCardExpMon: String,
    offerCreationCardExpYear: String,
    offerCreationCardType: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
