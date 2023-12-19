const express = require("express");
const router = express.Router();
const validateToken = require("../middleware/validateTokenHandler");
const { createReview,getreviewsprd } = require("../controllers/reviewController");
router.post("/createReview", validateToken, createReview);
router.post("/getreviewsprd", getreviewsprd);
module.exports = router;
