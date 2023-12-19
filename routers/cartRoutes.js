const express = require("express");
const router = express.Router();
const validateToken = require("../middleware/validateTokenHandler");
const {
    addToCart,
    getCart,
    updateCartItem,
    deleteCartItem,
    countCart,
} = require("../controllers/cartController");
router.post("/add-to-cart", validateToken, addToCart);
router.get("/get-cart", validateToken, getCart);
router.get("/count-cart", validateToken, countCart);
router.put("/update-cart-item/:idCart", validateToken, updateCartItem);
router.delete("/delete-cart-item/:idCart", validateToken, deleteCartItem);
module.exports = router;