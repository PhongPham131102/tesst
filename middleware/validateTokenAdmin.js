const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const validateToken = asyncHandler(async (req, res, next) => {
    let token;
    let authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
        token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401);
            next(new Error("User is not authorized or token is missing"));
        }
        jwt.verify(token, process.env.ACCESS_TOKEN_SECERT, (err, decoded) => {
            if (err) {
                res.status(401);
                throw new Error("User is not authorized");
            }
            req.user = decoded.user;

            // Kiểm tra trường isAdmin từ thông tin người dùng
            if (decoded.user.isAdmin === true) {
                req.isAdmin = true;
                next();
            } else {
                res.status(401);
                next(new Error("User is not authorized or token is missing"));             
            }
        });
    } else {
        res.status(401);
        next(new Error("Token is missing or you don't use Bearer"));
    }
});

module.exports = validateToken;


