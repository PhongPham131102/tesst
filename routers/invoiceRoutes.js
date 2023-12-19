const express = require("express");
const router = express.Router();
const validateTokenHandler = require("../middleware/validateTokenHandler");
const {
  createInvoice,
  createInvoiceUserLocal,
  getInvoice,
  detailorder,
  cancelInvoice,
  getAllInvoices,
  getdetailinvoice,
  getInvoiceByCode,
  SearchInvoice,
  updateStatus,
  getInvoicesByConfirmInvoice,
  getInvoicesByisShipping,
  getInvoicesByIsSuccess,
  getInvoicesByIsCancel,
  totalInAWeek,
  unconfirmedCount,
  cancelledCount,
} = require("../controllers/invoiceController");
const validateTokenAdmin=require("../middleware/validateTokenAdmin");
router.post("/passenger-create", validateTokenHandler, createInvoice);
router.get("/get-invoice", validateTokenHandler, getInvoice);
router.get("/get-detail-invoice/:code", detailorder);
router.post("/local-user-create", createInvoiceUserLocal);
router.put("/cancel-invoice/:code", cancelInvoice);

//Duong
router.get("/get-allInvoice", getAllInvoices);
router.get("/totalInAWeek", totalInAWeek);
router.get("/cancelledCount", cancelledCount);
router.get("/unconfirmedCount", unconfirmedCount);
router.get("/detailinvoice/:code", getdetailinvoice);
router.get("/SearchInvoice/:code", SearchInvoice);
router.get("/getInvoiceByCode/:code", getInvoiceByCode);
router.get("/getInvoicesByConfirmInvoice", getInvoicesByConfirmInvoice);
router.get("/getInvoicesByisShipping", getInvoicesByisShipping);
router.get("/getInvoicesByIsSuccess", getInvoicesByIsSuccess);
router.get("/getInvoicesByIsCancel", getInvoicesByIsCancel);
router.put("/updateinvoice/:codeInvoice", validateTokenAdmin, updateStatus);
module.exports = router;
