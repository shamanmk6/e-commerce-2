const { Int32 } = require("mongodb");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
    unique: true,
  },
  quantity: {
    type: Number,
    required:true
  },
  images:{
    type:String,
  }
});

module.exports = mongoose.model("product", productSchema);
