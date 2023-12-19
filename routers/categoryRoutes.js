const express = require("express");
const router = express.Router();
const {
  getAll,
  create,
  getBycategotyid,
  updateCategoryById,
  deleteCategoryById,
  getAllLoc,
} = require("../controllers/categoryController");
const validateTokenAdmin=require("../middleware/validateTokenAdmin");
router.get("/getall", getAll);
router.post("/create", create);

//Duong
router.get("/getCategoryID", getAllLoc);
router.put(
  "/updateCategoryById/:categoryID",
  validateTokenAdmin,
  updateCategoryById
);
router.delete(
  "/deleteCategoryById/:categoryID",
  validateTokenAdmin,
  deleteCategoryById
);
router.get("/getid/:categoryID", getBycategotyid);
module.exports = router;
