const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const Specification = require("../models/specificationProductModel");
const ImageProduct = require("../models/imageProductModel");
const Brand = require("../models/brandModel");
const Category = require("../models/categoryModel");
const fs = require("fs-extra");
const path = require("path");
const unorm = require("unorm");
const short = require("short-uuid");
const slugify = require("slugify");
const unidecode = require("unidecode");
const Review = require("../models/reviewModel");
//@desc get a product
//@route GET /api/products/get:id
//@access public
const getProduct = asyncHandler(async (req, res) => {
  const sku = req.params.id;
  const product = await Product.findOne({ sku });
  if (!product) {
    res.status(400);
    throw new Error("Product not found");
  }
  const specification = await Specification.find({ sku: product.sku });
  const imageProduct = await ImageProduct.find({ sku: product.sku });
  const brand = await Brand.findOne({ idBrand: product.brandId });
  const category = await Category.findOne({ categoryID: product.categoryId });
  const parentCategories = [];
  parentCategories.unshift(category);
  let currentCategory = category;
  while (currentCategory.parentCategoryID) {
    const parentCategory = await Category.findOne({
      categoryID: currentCategory.parentCategoryID,
    });
    if (parentCategory) {
      parentCategories.unshift(parentCategory);
      currentCategory = parentCategory;
    } else {
      break;
    }
  }
  const rating = await getAverageRatingAndTotalReviews(product._id);
  res.status(200).json({
    product,
    specification,
    imageProduct,
    brand,
    category,
    parentCategories,
    rating,
  });
});
//@desc get a product
//@route GET /api/products/get:id
//@access public
const getProductByName = asyncHandler(async (req, res) => {
  try {
    const productName = req.params.id;
    const products = await Product.find();
    const needProduct = products
      .map((product) => ({
        productName: slugify(product.productName, {
          lower: true,
          remove: /[*/+~,.()'"!:@]/g,
          locale: "vi",
        }),
        _id: product._id,
      }))
      .find((product) => product.productName === productName);
    if (!needProduct) {
      res.status(400);
      throw new Error("Product not found");
    }
    const product = await Product.findOne({ _id: needProduct._id });
    const specification = await Specification.find({ sku: product.sku });
    const imageProduct = await ImageProduct.find({ sku: product.sku });
    const brand = await Brand.findOne({ idBrand: product.brandId });
    const category = await Category.findOne({ categoryID: product.categoryId });
    const parentCategories = [];
    parentCategories.unshift(category);
    let currentCategory = category;
    while (currentCategory.parentCategoryID) {
      const parentCategory = await Category.findOne({
        categoryID: currentCategory.parentCategoryID,
      });
      if (parentCategory) {
        parentCategories.unshift(parentCategory);
        currentCategory = parentCategory;
      } else {
        break;
      }
    }
    const rating = await getAverageRatingAndTotalReviews(product._id);
    res.status(200).json({
      product,
      specification,
      imageProduct,
      brand,
      category,
      parentCategories,
      rating,
    });
  } catch (error) {
    res.status(404).send();
  }
});
//@desc get 10 product
//@route GET /api/products/get5product
//@access public
const get5Product = asyncHandler(async (req, res) => {
  const { skip = 0 } = req.query;
  const limit = 10;
  try {
    const totalProducts = await Product.countDocuments();
    if (skip >= totalProducts) {
      // Không còn sản phẩm nào để lấy
      res.json({ message: "No more products" });
    } else {
      const randomProducts = await Product.aggregate([
        { $sample: { size: limit } }, // Lấy ngẫu nhiên 10 sản phẩm
      ]);
      const productsWithRatings = await Promise.all(
        randomProducts.map(async (product) => {
          // Lấy số sao trung bình dựa trên productId
          const { averageRating, totalReviews } =
            await getAverageRatingAndTotalReviews(product._id);

          return {
            ...product,
            averageRating,
            totalReviews,
          };
        })
      );
      res.json(productsWithRatings);
    }
  } catch (error) {
    res.status(404).json({ error: "Internal server error" });
  }
});
//@desc creates a product
//@route POST /api/products/create
//@access public
const createProduct = asyncHandler(async (req, res) => {
  const {
    sku,
    productName,
    originalPrice,
    sellingPrice,
    status,
    urlvideo,
    retailprice,
    description,
    quantity,
    brandId,
    categoryId,
    warrantyPeriod,
    contactToPurchase,
    technicalSpecifications,
    images,
  } = req.body;
  let urlImage = "";
  const checkProduct = await Product.findOne({ sku });
  if (checkProduct) {
    res.status(400);
    throw Error("sku already create");
  }
  let technicalSpecificationsArray = [];
  for (const specification of technicalSpecifications) {
    const { title, content } = specification;
    const technicalSpecification = await Specification.create({
      sku,
      title,
      content,
    });
    technicalSpecificationsArray.push(technicalSpecification);
  }
  let imageProductsArray = [];
  for (const image of images) {
    const { srcData, cardinal } = image;
    if (!/^data:image\/\w+;base64,/.test(srcData)) {
      res.status(400);
      throw new Error("image must be a base64 string");
    }
    let base64Data = srcData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const imageId = short.generate();
    const imageType = srcData.split(";")[0].split("/")[1];
    let address = `public/products/${sku}/${imageId}.${imageType}`;
    await fs.ensureDir(path.dirname(address));
    fs.writeFileSync(address, buffer);
    if (cardinal) {
      urlImage = `public/products/${sku}/${imageId}.${imageType}`;
    }
    const imageProduct = await ImageProduct.create({
      sku,
      urlImage: `public/products/${sku}/${imageId}.${imageType}`,
    });
    imageProductsArray.push(imageProduct);
  }
  const product = await Product.create({
    sku,
    productName,
    originalPrice,
    sellingPrice,
    status,
    description,
    retailprice,
    urlvideo,
    quantity,
    urlImage,
    brandId,
    categoryId,
    warrantyPeriod,
    contactToPurchase,
  });
  res.status(201).json({
    product,
    imageProductsArray,
    technicalSpecificationsArray,
  });
});
const getListProductInCart = asyncHandler(async (req, res) => {
  const { productIds } = req.body;
  const products = await Product.find({ sku: { $in: productIds } }).select({
    sku: 1,
    productName: 1,
    originalPrice: 1,
    sellingPrice: 1,
    status: 1,
    urlImage: 1,
    contactToPurchase: 1,
  });
  if (products.length > 0) {
    res.status(200).json(products);
  } else {
    res.status(400).send();
  }
});
const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const totalProducts = await Product.countDocuments();
    const products = await Product.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    if (!products || products.length === 0) {
      res.status(404);
      throw new Error("No products found");
    }
    const allProductsData = [];
    for (const product of products) {
      const specifications = await Specification.find({ sku: product.sku });
      const imageProducts = await ImageProduct.find({ sku: product.sku });
      const brand = await Brand.findOne({ idBrand: product.brandId });
      const category = await Category.findOne({
        categoryID: product.categoryId,
      });
      const parentCategories = [];

      let currentCategory = category;

      while (currentCategory && currentCategory.parentCategoryID) {
        const parentCategory = await Category.findOne({
          categoryID: currentCategory.parentCategoryID,
        });

        if (parentCategory) {
          parentCategories.unshift(parentCategory);
          currentCategory = parentCategory;
        } else {
          break;
        }
      }

      allProductsData.push({
        product,
        specification: specifications,
        imageProduct: imageProducts,
        brand,
        category,
        parentCategories,
      });
    }

    res.status(200).json({
      products: allProductsData,
      page,
      pageSize,
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const getProductBySKU = asyncHandler(async (req, res) => {
  try {
    const sku = req.query.sku;

    if (!sku) {
      res.status(400).json({ error: "SKU parameter is missing" });
      return;
    }
    const product = await Product.findOne({ sku });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const specifications = await Specification.find({ sku });
    const imageProducts = await ImageProduct.find({ sku });
    const brand = await Brand.findOne({ idBrand: product.brandId });
    const category = await Category.findOne({ categoryID: product.categoryId });
    const parentCategories = [];

    let currentCategory = category;

    while (currentCategory && currentCategory.parentCategoryID) {
      const parentCategory = await Category.findOne({
        categoryID: currentCategory.parentCategoryID,
      });

      if (parentCategory) {
        parentCategories.unshift(parentCategory);
        currentCategory = parentCategory;
      } else {
        break;
      }
    }
    res.status(200).json({
      product,
      specifications,
      imageProducts,
      brand,
      category,
      parentCategories,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const getnameProduct = asyncHandler(async (req, res) => {
  try {
    const partialProductName = req.params.productName;
    const normalizedPartialProductName = unorm
      .nfd(partialProductName)
      .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics

    // Use $or operator to search for both normalized and original product names
    const products = await Product.find({
      $or: [
        {
          productName: {
            $regex: new RegExp(normalizedPartialProductName, "i"),
          },
        }, // Accent-insensitive
        { productName: { $regex: new RegExp(partialProductName, "i") } }, // Original with accents
      ],
    }).collation({ locale: "vi", strength: 2 });

    if (products.length === 0) {
      return res.status(200).json([]);
    }

    const productPromises = products.map(async (product) => {
      const [specifications, imageProducts, brand, category] =
        await Promise.all([
          Specification.find({ sku: product.sku }),
          ImageProduct.find({ sku: product.sku }),
          Brand.findOne({ idBrand: product.brandId }),
          Category.findOne({ categoryID: product.categoryId }),
        ]);

      const parentCategories = await getParentCategories(category);

      return {
        product,
        specification: specifications,
        imageProduct: imageProducts,
        brand: brand,
        category: category,
        parentCategories: parentCategories,
      };
    });

    const productsData = await Promise.all(productPromises);

    res.status(200).json(productsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function getParentCategories(category) {
  const parentCategories = [];
  let currentCategory = category;

  while (currentCategory && currentCategory.parentCategoryID) {
    const parentCategory = await Category.findOne({
      categoryID: currentCategory.parentCategoryID,
    });

    if (!parentCategory) {
      break;
    }

    parentCategories.unshift(parentCategory);
    currentCategory = parentCategory;
  }

  return parentCategories;
}
const UpdateProduct = asyncHandler(async (req, res) => {
  try {
    const sku = req.params.sku;
    const { product, specification, imageProduct } = req.body;

    // Find the product by SKU
    const existingProduct = await Product.findOne({ sku });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete all image products with a matching SKU
    await ImageProduct.deleteMany({ sku });

    // Update the product data (excluding the `urlImage` field)
    await Product.updateOne({ sku }, product);

    // Update specifications
    await Specification.deleteMany({ sku });

    const newSpecifications = specification.map((spec) => ({
      sku: sku,
      ...spec,
    }));

    await Specification.insertMany(newSpecifications);

    for (const image of imageProduct) {
      const { urlImage, cardinal } = image;
      let address;

      // Check if the input is a direct URL or base64-encoded image
      let isBase64 = false; // Assume it's not base64

      if (urlImage.startsWith("data:image/")) {
        isBase64 = true; // It's a base64-encoded image
        if (!/^data:image\/\w+;base64,/.test(urlImage)) {
          return res
            .status(400)
            .json({ error: "Image must be a base64 string" });
        }
      }

      if (isBase64) {
        let base64Data = urlImage.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const imageId = short.generate();
        const imageType = urlImage.split(";")[0].split("/")[1];
        address = `public/products/${sku}/${imageId}.${imageType}`;

        await fs.ensureDir(path.dirname(address));
        fs.writeFileSync(address, buffer);
      } else {
        // It's a direct file path, use it as is
        address = urlImage;
      }

      if (cardinal) {
        // Set this image as the main image
        await Product.updateOne({ sku }, { urlImage: address });
      }

      const imageProductRecord = await ImageProduct.create({
        sku,
        urlImage: address,
      });
    }

    return res
      .status(200)
      .json({ message: "Product and images updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
const deleteProduct = asyncHandler(async (req, res) => {
  const sku = req.params.id; // Get the SKU from the request

  try {
    const product = await Product.findOne({ sku });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    // Delete specifications and image products for the product
    await Specification.deleteMany({ sku: product.sku });
    await ImageProduct.deleteMany({ sku: product.sku });

    // Delete the product itself
    await Product.deleteOne({ sku: product.sku });

    res.status(200).json({
      message: "Product and associated properties deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
const gettotalproduct = asyncHandler(async (req, res) => {
  {
    try {
      const totalProductCount = await Product.countDocuments();

      res.status(200).json({ totalProductCount });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
});
const getFollowCategory = asyncHandler(async (req, res) => {
  const urlPart = req.params.urlPart;
  const categories = await Category.find();
  const needCategory = categories
    .map((category) => ({
      name: slugify(category.name, {
        lower: true,
        remove: /[*/+~,.()'"!:@]/g,
        locale: "vi",
      }),
      categoryID: category.categoryID,
    }))
    .find((category) => category.name === urlPart);
  if (!needCategory) {
    res.status(404).json({ message: "Category not found" });
    return;
  }
  const category = await Category.findOne({
    categoryID: needCategory.categoryID,
  });
  const Get10NewestProducts = await Product.find({
    categoryId: needCategory.categoryID,
  })
    .sort({ createdAt: -1 })
    .limit(10);
  const productsWithRatings = await Promise.all(
    Get10NewestProducts.map(async (product) => {
      // Lấy số sao trung bình dựa trên productId
      const { averageRating, totalReviews } =
        await getAverageRatingAndTotalReviews(product._id);

      return {
        ...product._doc,
        averageRating,
        totalReviews,
      };
    })
  );
  res.json({ products: productsWithRatings, category: category });
});

const findProductByName = asyncHandler(async (req, res) => {
  try {
    const nameProduct = req.params.nameProduct;
    const products = await Product.find();
    const needProduct = products
      .map((product) => {
        return {
          _id: product._id,
          productName: slugify(product.productName, {
            lower: true,
            remove: /[*/+~,.()'"!:@]/g,
            locale: "vi",
          }),
        };
      })
      .find((product) => product.productName === nameProduct);
    const product = await Product.findById(needProduct._id);
    res.json(product);
  } catch (e) {
    console.log(e);
  }
});
const searchProduct = asyncHandler(async (req, res) => {
  const { keyWord } = req.body;

  try {
    const products = await Product.find(
      {
        $text: { $search: `\"${keyWord}\"` },
      },
      {
        sku: 1,
        productName: 1,
        urlImage: 1,
        sellingPrice: 1,
        score: { $meta: "textScore" },
      }
    ).sort({ score: { $meta: "textScore" } });
    if (products.length === 0) {
      const partialMatchProducts = await Product.find(
        {
          $text: { $search: `\"${keyWord}\"` },
        },
        {
          sku: 1,
          productName: 1,
          urlImage: 1,
          sellingPrice: 1,
          score: { $meta: "textScore" },
        }
      ).sort({ score: { $meta: "textScore" } });
      if (partialMatchProducts.length > 5) {
        res.json({
          products: partialMatchProducts.slice(0, 4),
          countResult: partialMatchProducts.length - 5,
        });
      } else {
        res.json({ products: partialMatchProducts, countResult: 0 });
      }
    } else {
      if (products.length > 5) {
        res.json({
          products: products.slice(0, 5),
          countResult: products.length - 5,
        });
      } else {
        res.json({ products: products, countResult: 0 });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Lỗi server" });
  }
});
const searchProductWithPagination = asyncHandler(async (req, res) => {
  const { keyWord, priceRange, page = 1, pageSize = 12, categoryId } = req.body;
  try {
    const skip = (page - 1) * pageSize;
    const query = {
      $text: { $search: `\"${keyWord}\"` },
    };

    // Xác định khoảng giá dựa trên lựa chọn của người dùng
    let priceQuery = {};
    if (priceRange === "100000") {
      priceQuery = { sellingPrice: { $lt: 100000 } };
    } else if (priceRange === "100000-300000") {
      priceQuery = { sellingPrice: { $gte: 100000, $lte: 300000 } };
    } else if (priceRange === "300000-500000") {
      priceQuery = { sellingPrice: { $gt: 300000, $lte: 500000 } };
    } else if (priceRange === "500000") {
      priceQuery = { sellingPrice: { $gt: 500000 } };
    }

    const categoryQuery = categoryId
      ? {
          categoryId: categoryId,
        }
      : {};

    const totalProducts = await Product.find({
      $and: [query, priceQuery, categoryQuery],
    });

    const products = await Product.find({
      $and: [query, priceQuery, categoryQuery],
    })
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(pageSize);
    if (products.length > 0) {
      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const { averageRating, totalReviews } =
            await getAverageRatingAndTotalReviews(product._id);

          return {
            ...product._doc, // Sử dụng _doc để lấy toàn bộ thông tin sản phẩm
            averageRating,
            totalReviews,
          };
        })
      );
      res.json({
        products: productsWithRatings,
        pages: Math.ceil(totalProducts.length / pageSize),
        totalproduct: totalProducts.length,
      });
    } else {
      res.status(404).send();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Lỗi server" });
  }
});
const ProductCategoryWithPagination = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20, categorySlug } = req.body;
  const categories = await Category.find();
  const needCategory = categories
    .map((category) => ({
      name: slugify(category.name, {
        lower: true,
        remove: /[*/+,~.()'"!:@]/g,
        locale: "vi",
      }),
      categoryID: category.categoryID,
    }))
    .find((category) => category.name === categorySlug);
  try {
    const skip = (page - 1) * pageSize;

    const categoryQuery = {
      categoryId: needCategory.categoryID,
    };

    const totalProducts = await Product.find({
      $and: [categoryQuery],
    });

    const products = await Product.find({
      $and: [categoryQuery],
    })
      .skip(skip)
      .limit(pageSize);
    const category = await Category.findOne({
      categoryID: needCategory.categoryID,
    });
    if (products.length > 0) {
      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const { averageRating, totalReviews } =
            await getAverageRatingAndTotalReviews(product._id);

          return {
            ...product._doc, // Sử dụng _doc để lấy toàn bộ thông tin sản phẩm
            averageRating,
            totalReviews,
          };
        })
      );
      res.json({
        products: productsWithRatings,
        pages: Math.ceil(totalProducts.length / pageSize),
        totalproduct: totalProducts.length,
        category,
      });
    } else {
      res.status(404).send();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Lỗi server" });
  }
});
const recommendationsProduct = asyncHandler(async (req, res) => {
  try {
    const allProducts = await Product.find(
      {},
      { sku: 1, productName: 1, sellingPrice: 1, urlImage: 1, contactToPurchase:1}
    );
    const today = new Date().toISOString().split("T")[0];
    const randomSeed = parseInt(today.replace(/-/g, ""), 10);
    const recommendations = allProducts
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    res.json({ recommendations: recommendations });
  } catch (error) {
    console.error("Lỗi khi lấy đề xuất sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});
const getAverageRatingAndTotalReviews = asyncHandler(async (productId) => {
  try {
    // Lấy tất cả đánh giá cho sản phẩm cụ thể (productId)
    const reviews = await Review.find({ productId });

    if (reviews && reviews.length > 0) {
      // Tính tổng số sao và tổng số lượt đánh giá
      let totalStars = 0;
      let totalReviews = reviews.length;

      reviews.forEach((review) => {
        totalStars += review.rating;
      });

      // Tính trung bình số sao
      const averageRating = totalStars / totalReviews;

      return { averageRating, totalReviews };
    } else {
      // Nếu không có đánh giá nào, trả về giá trị mặc định
      return { averageRating: 5, totalReviews: 0 };
    }
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching reviews");
  }
});
const relatedProduct = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  try {
    const productDetail = await Product.findById(productId);
    if (!productDetail) {
      return res.status(404).json({ message: "Product not found" });
    }

    const allProductsInCategory = await Product.find({
      categoryId: productDetail.categoryId,
    });
    const remainingProducts = allProductsInCategory.filter(
      (product) => product._id.toString() !== productId
    );
    let relatedProducts = [];
    if (remainingProducts.length < 5) {
      relatedProducts = remainingProducts;
    } else {
      relatedProducts = getRandomProducts(remainingProducts, 5);
    }
    const productsWithRatings = await Promise.all(
      relatedProducts.map(async (product) => {
        const { averageRating, totalReviews } =
          await getAverageRatingAndTotalReviews(product._id);

        return {
          ...product._doc, // Sử dụng _doc để lấy toàn bộ thông tin sản phẩm
          averageRating,
          totalReviews,
        };
      })
    );
    res.json(productsWithRatings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching related products" });
  }
});
function getRandomProducts(products, n) {
  const shuffled = products.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}
const out = asyncHandler(async (req, res) => {
  const products=await Product.find({},'productName');
  const resultString = products.map(product => product.productName).join(', ');
  res.json(resultString);
});
module.exports = {
  getProduct,
  createProduct,
  get5Product,
  getListProductInCart,
  getAllProducts,
  getProductBySKU,
  getnameProduct,
  UpdateProduct,
  deleteProduct,
  gettotalproduct,
  getFollowCategory,
  findProductByName,
  searchProduct,
  searchProductWithPagination,
  recommendationsProduct,
  ProductCategoryWithPagination,
  relatedProduct,
  getProductByName,out
};
