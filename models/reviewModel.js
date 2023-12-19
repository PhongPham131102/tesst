const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema({
	productId: { type: String, required: true },
	uid: { type: String, required: true },
	rating: { type: Number, required: true },
	reviewText: { type: String, required: true },
  },{
    timestamps: true,
});
  
  const Review = mongoose.model('Review', reviewSchema);
  
  module.exports = Review;