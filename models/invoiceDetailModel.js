const mongoose = require("mongoose");
const invoiceDetailSchema = mongoose.Schema({
    codeInvoice: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    sellingPrice: {
        type: Number,
        required: true,
    }
}, {
    timestamps: true,
});
module.exports = mongoose.model("InvoiceDetail", invoiceDetailSchema);