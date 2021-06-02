const mongoose = require("mongoose");
const postSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      default: "Not taking bookings",
      enum: ["Taking bookings", "Not taking bookings"],
    },
    typeOfPlace: {
      type: String,
      default: "none",
      enum: ["restaurant", "bar", "club", "pub", "venue", "none"],
    },
    reviewStatus: {
      type: String,
      enum: ["inprocess", "incomplete", "reviewed"],
      default: "incomplete",
    },
    typeOfVenue: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
