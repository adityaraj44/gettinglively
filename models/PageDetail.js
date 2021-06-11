const mongoose = require("mongoose");
const detailSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    image: String,

    typeOfPlace: {
      type: String,
      default: "none",
      enum: ["restaurant", "bar", "club", "pub", "venue", "none"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PageDetail", detailSchema);
