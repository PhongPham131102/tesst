const mongoose = require("mongoose");
const categorySchema = mongoose.Schema({
    categoryID: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    parentCategoryID: {
        type: String,
        default: " "
    },
    ListIDProduct: {
        type: [String],
        default: []
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model("category", categorySchema);