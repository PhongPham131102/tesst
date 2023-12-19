const mongoose = require("mongoose");
const invoiceSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: [true, "code already taken"],
    },
    fullName: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        default: "",
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    shippingPhone: {
        type: String,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model("Invoice", invoiceSchema);