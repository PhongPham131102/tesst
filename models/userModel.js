const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        require: [true, "Please fill fullname field"],
    },
    email: {
        type: String,
        required: [true, "Please add the user email address"],
        unique: [true, "Email address already taken"],
    },
    phoneNumber: {
        type: String,
        required: [true, "Please add the user phone number "],
    },
    address: {
        type: String,
        default: "Bạn vui lòng cung cấp địa chỉ giao hàng.",
    },
    avatar: { type: String, default: "public/avatars/avatar.jpg" },
    password: {
        type: String,
        required: [true, "Please add the password"],
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    token: {
        type: String,
        default: "",
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model("user", userSchema);