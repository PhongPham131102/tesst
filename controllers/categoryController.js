const asyncHandler = require("express-async-handler");
const Category = require("../models/categoryModel");
//@desc get all category
//@route GET /api/categories/getall
//access public
const getAll = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json(categories);
});
//@desc create a category
//@route POST /api/categories/create
//@access public
const create = asyncHandler(async (req, res) => {
  const { categoryID, name, parentCategoryID } = req.body;
  if (!name) {
    res.status(400);
    throw Error("Name Field is mendatory");
  }
  const category = await Category.create({
    categoryID,
    name,
    parentCategoryID: parentCategoryID ? parentCategoryID : " ",
  });
  if (category) {
    res.status(201).json({
      category,
    });
  } else {
    res.status(400);
    throw Error("create category failed");
  }
});

const getBycategotyid = asyncHandler(async (req, res) => {
  const categoryID = req.params.categoryID;
  const category = await Category.findOne({ categoryID }); // Sử dụng findOne để tìm theo categoryID

  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  res.json(category);
});
const updateCategoryById = asyncHandler(async (req, res) => {
  const categoryID = req.params.categoryID;
  const updateData = req.body;

  try {
    const updatedCategory = await Category.findOneAndUpdate(
      { categoryID },
      updateData,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
const deleteCategoryById = asyncHandler(async (req, res) => {
  const categoryID = req.params.categoryID;
  try {
    const deletedCategory = await Category.findOneAndDelete({ categoryID });

    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
const getAllLoc = asyncHandler(async (req, res) => {
  const { categoryID } = req.query;

  // Check if categoryID is provided in the query
  if (categoryID) {
    const filteredCategory = await Category.findOne({ categoryID }); // Find the first matching category
    if (filteredCategory) {
      res.status(200).json(filteredCategory);
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } else {
    // If categoryID is not provided, retrieve all categories
    const categories = await Category.find();
    res.status(200).json(categories);
  }
});
module.exports = {
  getAll,
  create,
  getBycategotyid,
  updateCategoryById,
  deleteCategoryById,
  getAllLoc,
};
