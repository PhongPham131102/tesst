const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const fs = require("fs-extra");
const path = require("path");
//@desc register a user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body;
  if (!fullName || !email || !phoneNumber || !password) {
    res.status(400);
    throw Error("all fields are mandatory!");
  }
  const user = await User.findOne({ email });
  if (user) {
    res.status(400);
    throw Error("User already register");
  }
  //Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    fullName,
    phoneNumber,
    email,
    password: hashedPassword,
  });
  if (newUser) {
    res.status(201).json({
      newUser,
    });
  } else {
    res.status(400);
    throw new Error("User data not valid");
  }
});
//@desc login a user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mendatory!");
  }
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
        },
      },
      process.env.ACCESS_TOKEN_SECERT,
      {
        expiresIn: "30d",
      }
    );
    res.status(200).json({
      accessToken,
    });
  } else {
    res.status(401);
    throw new Error("email or password is not valid");
  }
});
//@desc current a user
//@route GET /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json({
    user,
  });
});
const forgetpassword = asyncHandler(async (req, res) => {
  const { newPassword, email } = req.body;
  const user = await User.findOne({ email });
  user.password = await bcrypt.hash(newPassword, 10);
  user.save();
  res.status(200).send();
});
const changepassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findOne({ _id: req.user.id });
  if (await bcrypt.compare(currentPassword, user.password)) {
    user.password = await bcrypt.hash(newPassword, 10);
    user.save();
    res.status(200).send();
  } else {
    res.status(400).send();
  }
});
const updateinfor = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  console.log(uid);
  const { phone, name, image } = req.body;

  if (!phone || !name) {
    return res.status(400).json({
      message: "phone or name or image field are mandatory!",
    });
  }

  try {
    const userUpdate = {
      fullName: name,
      phoneNumber: phone,
    };

    if (image) {
      let base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const imageType = image.split(";")[0].split("/")[1];
      let avatar = `public/${uid}.${imageType}`;
      await fs.ensureDir(path.dirname(avatar));
      fs.writeFileSync(avatar, buffer);

      userUpdate.avatar = avatar;
    }

    const result = await User.findByIdAndUpdate(uid, userUpdate, { new: true });

    return res.status(200).json({
      message: "Thông tin người dùng đã được cập nhật.",
      user: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi cập nhật thông tin người dùng.",
      error: error.message,
    });
  }
});
const changeaddress = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const { address } = req.body;
  const result = await User.findByIdAndUpdate(uid, { address }, { new: true });
  if (result) {
    res.status(201).json(result);
  } else {
    res.status(400);
    throw new Error("Cập nhật không thành công.");
  }
});
const checkemail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    res.status(200).send();
  } else {
    res.status(400).send();
  }
});

function generateOTP(length) {
  const characters = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters.charAt(randomIndex);
  }

  return otp;
}
const sendmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tracnghiemlaptrinhcaothang@gmail.com",
      pass: "fgdvaolkthsflgci",
    },
  });
  otp = generateOTP(4);
  const mailOptions = {
    from: '"Dụng Cụ Y Khoa Lưu Gia" <tracnghiemlaptrinhcaothang@gmail.com>',
    to: email,
    subject: "Mã khôi phục tài khoản dụng cụ y khoa Lưu Gia",
    html: `<div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
        <form style="min-width: 200px; padding: 20px;">
            <div style="display: flex; margin: 0 auto; justify-content: center;">
             </div>
            <div style="padding-top: 20px;">
                <p style="color: #1E1E1E; font-size: 20px; font-style: normal; font-weight: 400; padding-bottom: 30px;">
                    Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn.<br>
                    Nhập mã đặt lại mật khẩu sau đây:
                </p>
                <div>
                    <p  style="color: #1E1E1E; font-size:32px; font-weight: 700;">${otp}</p>
                </div>
            </div>
            <div style="display: flex; justify-content: center; align-items: center; padding-top: 20px;">
                <hr>
                <div style="display: flex; flex-direction: column; align-items: center; color: #7E7A7A; font-size: 15px; font-weight: 400;">
                    <p style="color: #218806; font-size: 22px; font-weight: 700;">Dụng Cụ Y Khoa Lưu Gia</p>
                    <p>198 Đ. Tô Hiến Thành Phường 15 Quận 10 Thành phố Hồ Chí Minh</p>
                    <p>Thư này được gửi đến ${email}.</p>
                    <p>Để bảo vệ tài khoản của bạn, vui lòng không chuyển tiếp email này.</p>
                </div>
            </div>
        </form>
    </div>`,
  };
  // Gửi email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return res.status(200).json({ otp });
  } catch (error) {
    console.log(error);
  }
 
});
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mendatory!");
  }
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      {
        user: {
          username: user.fullName,
          email: user.email,
          id: user.id,
          isAdmin: user.isAdmin,
        },
      },
      process.env.ACCESS_TOKEN_SECERT,
      {
        expiresIn: "30d",
      }
    );
    res.status(200).json({
      accessToken,
    });
  } else {
    res.status(401);
    throw new Error("email or password is not valid");
  }
});
const Getall = asyncHandler(async (req, res) => {
  try {
    const users = await User.find(); // Lấy tất cả người dùng từ cơ sở dữ liệu
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
const gettotalUser = asyncHandler(async (req, res) => {
  try {
    const totalUserCount = await User.countDocuments();

    res.status(200).json({ totalUserCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = {
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
};
