const express = require("express");
const router = express.Router();
const validateToken = require("../middleware/validateTokenHandler");
const {
    registerUser,
    loginUser,
    currentUser,
    changepassword,
    updateinfor,
    changeaddress,
    checkemail,
    sendmail,
    forgetpassword,
    loginAdmin,
    Getall,
    gettotalUser,
} = require("../controllers/userController");
router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/updateinfor", validateToken, updateinfor);
router.post("/changepassword", validateToken, changepassword);
router.post("/forgetpassword", forgetpassword);
router.get("/current", validateToken, currentUser);
router.post("/checkemail", checkemail);
router.post("/sendmail", sendmail);
router.put("/changeaddress", validateToken, changeaddress);

//Duong
router.post("/loginAdmin", loginAdmin);
router.get("/getall", Getall);
router.get("/totalUser/count", gettotalUser);
module.exports = router;