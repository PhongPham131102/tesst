const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const getCart = asyncHandler(async(req, res) => {
    const uid = req.user.id;
    const cartItems = await Cart.find({ uid });

    if (cartItems.length > 0) {
        const productIds = cartItems.map((item) => item.productId);
        const products = await Product.find({ sku: { $in: productIds } }).select({
            sku: 1,
            productName: 1,
            originalPrice: 1,
            sellingPrice: 1,
            status: 1,
            urlImage: 1,
            contactToPurchase: 1,
        });
        const user = await User.findOne({ _id: uid }).select({
            fullName: 1,
            address: 1,
            phoneNumber: 1,
        });
        const combinedItems = cartItems.map((cartItem) => {
            const matchingProduct = products.find(
                (product) => product.sku === cartItem.productId
            );
            return {
                cartItem,
                product: matchingProduct,
            };
        });
        res.status(200).json({ combinedItems, user });
    } else {
        res.status(404);
        throw new Error("No product found");
    }
});
const countCart = asyncHandler(async(req, res) => {
    const uid = req.user.id;
    const cart = await Cart.find({ uid });
    res.status(200).json({ count: cart.length });
});

const addToCart = asyncHandler(async(req, res) => {
    const uid = req.user.id;
    const { productId, quantity } = req.body;
    let cartItem = await Cart.findOne({ uid, productId });

    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        cartItem = new Cart({ uid, productId, quantity });
    }

    await cartItem.save();
    const cart = await Cart.find({ uid });
    res.status(201).json({ cartItem, count: cart.length });
});
const updateCartItem = asyncHandler(async(req, res) => {
    const uid = req.user.id;
    const { idCart } = req.params;
    const { quantity } = req.body;
    const cartItem = await Cart.findOne({ _id: idCart });
    if (!cartItem) {
        res.status(404);
        throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
    }

    cartItem.quantity = quantity;
    await cartItem.save();
    res.status(200).json(cartItem);
});
const deleteCartItem = asyncHandler(async(req, res) => {
    const { idCart } = req.params;
    await Cart.findOneAndDelete({ _id: idCart });
    res.status(200).json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công" });
});

module.exports = {
    getCart,
    countCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
};