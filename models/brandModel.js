const mongoose = require("mongoose");
const brandSchema = mongoose.Schema({
    idBrand: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    urlImage: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model("brand", brandSchema);