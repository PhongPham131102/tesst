const asyncHandler = require("express-async-handler");
const Brand = require("../models/brandModel");
const fs = require("fs-extra");
const path = require("path");
const short = require("short-uuid");
//@desc get all brand
//@route GET /api/brands/getbrands
//@access public
const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find();
  res.status(200).json({ brands });
});
//@desc create a brand
//@route POST /api/brands/createbrand
//@access public
const createBrand = asyncHandler(async (req, res) => {
  const { idBrand, name, image } = req.body;
  if (!idBrand || !name || !image) {
    res.status(400);
    throw new Error("idBrand or name or image field are mendatory!");
  } else if (!/^data:image\/\w+;base64,/.test(image)) {
    res.status(400);
    throw new Error("image must be a base64 string");
  }
  let base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const imageId = short.generate();
  const imageType = image.split(";")[0].split("/")[1];
  let address = `public/brands/${name}/${imageId}.${imageType}`;
  await fs.ensureDir(path.dirname(address));
  fs.writeFileSync(address, buffer);
  const brand = await Brand.create({
    idBrand,
    name,
    urlImage: `public/brands/${name}/${imageId}.${imageType}`,
  });
  if (brand) {
    res.status(201).json({
      brand,
    });
  } else {
    res.status(400);
    throw new Error("brand create fails");
  }
});
//@desc create muti brands
//@route POST /api/brands/createmutibrand
//@access public
const createMutiBrand = asyncHandler(async (req, res) => {
  const brandsData = req.body.brandsData;
  if (!brandsData || !Array.isArray(brandsData) || brandsData.length === 0) {
    res.status(400);
    throw new Error("No valid brand data provided.");
  }

  const createdBrands = [];
  for (const brandData of brandsData) {
    const { idBrand, name, image } = brandData;
    if (!idBrand || !name || !image) {
      res.status(400);
      throw new Error(
        "idBrand, name, and image fields are mandatory for each brand."
      );
    } else if (!/^data:image\/\w+;base64,/.test(image)) {
      res.status(400);
      throw new Error("Image must be a base64 string.");
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const imageId = short.generate();
    const imageType = image.split(";")[0].split("/")[1];
    const address = `public/brands/${name}/${imageId}.${imageType}`;

    await fs.ensureDir(path.dirname(address));
    fs.writeFileSync(address, buffer);

    const brand = await Brand.create({
      idBrand,
      name,
      urlImage: `public/brands/${name}/${imageId}.${imageType}`,
    });

    if (brand) {
      createdBrands.push(brand);
    }
  }
  if (createdBrands.length > 0) {
    res.status(201).json({
      brands: createdBrands,
    });
  } else {
    res.status(400);
    throw new Error("Failed to create brands.");
  }
});

//Duong
const getidBrands = asyncHandler(async (req, res) => {
  const { idBrand } = req.params;

  try {
    const brand = await Brand.findOne({ idBrand });

    if (!brand) {
      return res.status(404).json({ message: "Brand not found." });
    }

    return res.status(200).json(brand);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving brand." });
  }
});

const deleteBrands = asyncHandler(async (req, res) => {
  const { idBrand } = req.params;

  try {
    const deletedBrand = await Brand.findOneAndRemove({ idBrand });
    if (!deletedBrand) {
      return res.status(404).json({ message: "Brand not found." });
    }

    return res.status(200).json({ message: "Brand deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting brand." });
  }
});
///api put thei idBrand
const updateidBrand = asyncHandler(async (req, res) => {
  const { idBrand, name, image } = req.body;
  if (!idBrand || !name) {
    res.status(400);
    throw new Error("idBrand or name field is mandatory!");
  }

  let imageId, imageType, address;

  // Check if an image is provided for update
  if (image) {
    // If the image is a base64 string, process it as before
    if (/^data:image\/\w+;base64,/.test(image)) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      imageId = short.generate();
      imageType = image.split(";")[0].split("/")[1];
      address = `public/brands/${name}/${imageId}.${imageType}`;

      // Save the updated image
      await fs.ensureDir(path.dirname(address));
      fs.writeFileSync(address, buffer);
    }
  }

  const updateData = {
    name,
  };

  if (image) {
    // If the image is a base64 string, update urlImage as before
    if (/^data:image\/\w+;base64,/.test(image)) {
      updateData.urlImage = `public/brands/${name}/${imageId}.${imageType}`;
    } else {
      // If the image is a URL, update urlImage with the provided URL
      updateData.urlImage = image;
    }
  }

  const brand = await Brand.findOneAndUpdate(
    { idBrand },
    { $set: updateData },
    { new: true }
  );

  if (brand) {
    res.status(200).json({
      brand,
    });
  } else {
    res.status(404);
    throw new Error("Brand not found.");
  }
});
const getBrandpage = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Current page, default to 1
  const perPage = parseInt(req.query.perPage) || 8; // Number of items per page, default to 10

  const skip = (page - 1) * perPage;

  const totalBrands = await Brand.countDocuments(); // Get the total number of brands

  const brands = await Brand.find().skip(skip).limit(perPage);

  res.status(200).json({
    brands,
    currentPage: page,
    totalPages: Math.ceil(totalBrands / perPage),
    totalItems: totalBrands,
  });
});
module.exports = {
  createBrand,
  getBrands,
  createMutiBrand,
  getBrandpage,
  getidBrands,
  deleteBrands,
  updateidBrand,
};
