const constansts = require("../constants");
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    switch (statusCode) {
        case constansts.VALIDATION_ERROR:
            res.json({
                title: "Validation Failed!",
                message: err.message,
                // stackTrace: err.stack,
            });
            break;
        case constansts.NOT_FOUND:
            res.json({
                title: "Not Found",
                message: err.message,
                // stackTrace: err.stack,
            });
            break;
        case constansts.UNAUTHORIZED:
            res.json({
                title: "unauthorized",
                message: err.message,
                // stackTrace: err.stack,
            });
            break;
        case constansts.FORBIDDEN:
            res.json({
                title: "Forbiden",
                message: err.message,
                // stackTrace: err.stack,
            });
            break;
        case constansts.SERVER_ERROR:
            res.json({
                title: "Server error",
                message: err.message,
                // stackTrace: err.stack,
            });
            break;
        default:
            console.log("No error, all good");
            break;
    }
};
module.exports = errorHandler;