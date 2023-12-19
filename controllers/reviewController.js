const asyncHandler = require("express-async-handler");
const Review = require("../models/reviewModel");
const User = require("../models/userModel");
const createReview = asyncHandler(async (req, res) => {
  const { productID, rating, review } = req.body;
  const uid = req.user.id;
  const _review = await Review.create({
    productId: productID,
    rating,
    uid,
    reviewText: review ? review : "Sản phẩm tốt",
  });
  res.status(201).send();
});
const getreviewsprd = asyncHandler(async (req, res) => {
	const { productId } = req.body;
  
	try {
	  // Lấy tất cả đánh giá cho sản phẩm cụ thể (productId)
	  const reviews = await Review.find({ productId });
  
	  // Nếu tìm thấy các đánh giá, hãy kết nối chúng với thông tin người dùng
	  if (reviews && reviews.length > 0) {
		const reviewsWithUserInfo = await Promise.all(reviews.map(async (review) => {
		  const user = await User.findOne({ _id: review.uid });
		  return {
			review: {
			  _id: review._id,
			  rating: review.rating,
			  reviewText: review.reviewText,
			  createdAt: review.createdAt, // Thêm thời gian tạo
			},
			user: {
			  _id: user._id,
			  fullName: user.fullName,
			  email: user.email,
			  avatar: user.avatar,
			},
		  };
		}));
  
		res.json(reviewsWithUserInfo);
	  } else {
		res.json([]);
	  }
	} catch (error) {
	  console.error(error);
	  res.status(500).json({ message: 'Error fetching reviews' });
	}
  });
module.exports = { createReview ,getreviewsprd};
