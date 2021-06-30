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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
