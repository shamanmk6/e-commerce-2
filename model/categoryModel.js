const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  offer: {
    type: String,
    required: true,
  },
  offerStart: {
    type: Date,
    required: true,
  },
  offerEnd: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Category", categorySchema);
