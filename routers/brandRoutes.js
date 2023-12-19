const express = require("express");
const router = express.Router();
const {
  createBrand,
  getBrands,
  createMutiBrand,
  deleteBrands,
  getidBrands,
  updateidBrand,getBrandpage
} = require("../controllers/brandController");
router.get("/getbrands", getBrands);
router.post("/createbrand", createBrand);
router.post("/createmutibrand", createMutiBrand);

//Duong
router.get("/getidBrand/:idBrand", getidBrands);
router.delete("/deletebrand/:idBrand", deleteBrands);
router.get("/getBrandpage", getBrandpage);
router.put("/updateidbrand/:idBrand", updateidBrand);
module.exports = router;
