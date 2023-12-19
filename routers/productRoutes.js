const express = require("express");
const router = express.Router();
const validateTokenAdmin = require("../middleware/validateTokenAdmin");
const {
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

} = require("../controllers/productController");
router.get("/get/:id", getProduct);
router.get("/out", out);
router.get("/getbyname/:id", getProductByName);
router.get("/findProductByName/:nameProduct", findProductByName);
router.post("/searchProduct", searchProduct);
router.post("/searchProductWithPagination", searchProductWithPagination);
router.post("/ProductCategoryWithPagination", ProductCategoryWithPagination);
router.get("/get5Product", get5Product);
router.get("/recommendationsProduct", recommendationsProduct);
router.post("/create", validateTokenAdmin, createProduct);
router.post("/get-list-product-in-cart", getListProductInCart);
router.get("/getFollowCategory/:urlPart", getFollowCategory);
router.post("/relatedProduct", relatedProduct);
//Duong
router.get("/getall", getAllProducts);
router.get("/getsku/:sku", getProductBySKU);
router.get("/getname/:productName", getnameProduct);
router.put("/updateproduct/:sku", validateTokenAdmin, UpdateProduct);
router.delete("/delete/:id", validateTokenAdmin, deleteProduct);
router.get("/total/count", gettotalproduct);

module.exports = router;
