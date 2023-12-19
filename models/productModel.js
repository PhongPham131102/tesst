const mongoose = require("mongoose");
const ProductSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  productName: {
    type: String,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  sellingPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    requried: true,
  },
  urlImage: {
    type: String,
    requried: true,
  },
  urlvideo: {
    type: String,
  },
  retailprice: {
    type: Number,
  },
  brandId: {
    type: String,
    required: true,
  },
  categoryId: {
    type: String,
    required: true,
  },
  warrantyPeriod: {
    type: String,
    required: true,
  },
  contactToPurchase: {
    type: Boolean,
    default: false,
  },
  bestseller: {
    type: Boolean,
    default: false,
  },

});
ProductSchema.index({
  productName: 'text'
});
const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;