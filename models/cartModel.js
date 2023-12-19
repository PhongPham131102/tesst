const mongoose = require("mongoose");
const cartSchema = mongoose.Schema({
    uid: {
        type: String,
        required: true,
    },
    productId: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model("cart", cartSchema);