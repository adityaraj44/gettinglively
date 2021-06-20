const mongoose = require("mongoose");
const voucherSchema = new mongoose.Schema(
  {
    vouchercode: {
      type: String,
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
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
  },
  { timestamps: true }
);

const Voucher = mongoose.model("Voucher", voucherSchema);

module.exports = Voucher;
