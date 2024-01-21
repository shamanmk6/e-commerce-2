const { Int32 } = require("mongodb");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    default: null,
  },
  pincode: {
    type: String,
    default: null,
  },
  mobile: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  appliedCoupons: {
    type: String,
    unique: true,
    default:null,
  },
  // otp:{
  //  type:String,
  //  default:null,
  // },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("user", userSchema);
