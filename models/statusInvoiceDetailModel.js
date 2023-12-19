const mongoose = require("mongoose");
const statusInvoiceDetailSchema = mongoose.Schema({
    codeInvoice: {
        type: String,
        required: true,
    },
    confirmInvoice: {
        type: Boolean,
        required: true,
    },
    isShipping: {
        type: Boolean,
        required: true,
    },
    isSuccess: {
        type: Boolean,
        required: true,
    },
    isCancel: {
        type: Boolean,
        required: true,
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model(
    "StatusInvoiceDetail",
    statusInvoiceDetailSchema
);