const mongoose = require("mongoose");
const specificationProductSchema = mongoose.Schema({
    sku: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model(
    "specificationProduct",
    specificationProductSchema
);