const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const InvoiceDetail = require("../models/invoiceDetailModel");
const StatusInvoiceDetail = require("../models/statusInvoiceDetailModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const generateUniqueInvoiceCode = async () => {
  while (true) {
    const randomNumber = Math.floor(100000000 + Math.random() * 900000000);
    const invoiceCode = `#${randomNumber}`;

    const existingInvoice = await Invoice.findOne({ code: invoiceCode });

    if (!existingInvoice) {
      return invoiceCode;
    }
  }
};

//@desc create a invoice
//@route POST /api/invoices/passenger-create
//@access public
const createInvoice = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const { fullName, shippingAddress, shippingPhone, total, listProduct } =
    req.body;
  const invoiceCode = await generateUniqueInvoiceCode();
  const invoice = new Invoice({
    code: invoiceCode,
    fullName,
    userId: uid,
    shippingAddress,
    shippingPhone,
    total,
  });

  try {
    const savedInvoice = await invoice.save();
    for (const product of listProduct) {
      const { sku, quantity, sellingPrice } = product;

      const invoiceDetail = new InvoiceDetail({
        codeInvoice: savedInvoice.code,
        sku,
        quantity,
        sellingPrice,
      });
      await invoiceDetail.save();
    }
    const statusInvoiceDetail = new StatusInvoiceDetail({
      codeInvoice: savedInvoice.code,
      confirmInvoice: false,
      isShipping: false,
      isSuccess: false,
      isCancel: false,
    });

    await statusInvoiceDetail.save();
    await Cart.deleteMany({ uid });
    res.status(200).json({ invoiceCode });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).send("Internal Server Error");
  }
});
//@desc create a invoice
//@route POST /api/invoices/local-user-create
//@access public
const createInvoiceUserLocal = asyncHandler(async (req, res) => {
  const { fullName, shippingAddress, shippingPhone, total, listProduct } =
    req.body;
  const invoiceCode = await generateUniqueInvoiceCode();
  const invoice = new Invoice({
    code: invoiceCode,
    fullName,
    shippingAddress,
    shippingPhone,
    total,
  });

  try {
    const savedInvoice = await invoice.save();
    for (const product of listProduct) {
      const { sku, quantity, sellingPrice } = product;

      const invoiceDetail = new InvoiceDetail({
        codeInvoice: savedInvoice.code,
        sku,
        quantity,
        sellingPrice,
      });
      await invoiceDetail.save();
    }
    const statusInvoiceDetail = new StatusInvoiceDetail({
      codeInvoice: savedInvoice.code,
      confirmInvoice: true,
      isShipping: false,
      isSuccess: false,
      isCancel: false,
    });

    await statusInvoiceDetail.save();
    res.status(200).json({ invoiceCode });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Xử lý middleware cho phân trang
function paginateResults(model, page, pageSize, uid) {
  const skip = (page - 1) * pageSize;
  return model.find({ userId: uid }).skip(skip).limit(pageSize);
}

const getInvoice = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 8;

  try {
    const totalInvoices = await Invoice.countDocuments({ userId: uid });
    if (Math.ceil(totalInvoices / pageSize) < page) {
      res.status(404).send();
      return;
    }
    const invoices = await paginateResults(Invoice, page, pageSize, uid);

    const statusDetails = await StatusInvoiceDetail.find({
      codeInvoice: { $in: invoices.map((inv) => inv.code) },
    });
    const statusMap = new Map();
    statusDetails.forEach((status) => {
      statusMap.set(status.codeInvoice, status);
    });
    invoices.sort((a, b) => b.createdAt - a.createdAt);
    const invoicesWithStatus = invoices.map((inv) => {
      return {
        ...inv._doc,
        status: statusMap.get(inv.code) || {},
      };
    });
    res.json({
      totalPages: Math.ceil(totalInvoices / pageSize),
      currentPage: page,
      invoices: invoicesWithStatus,
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy dữ liệu hóa đơn" });
  }
});
const detailorder = asyncHandler(async (req, res) => {
  try {
    const code = req.params.code;
    const order = await Invoice.findOne({ _id: code });
    const statusOrder = await StatusInvoiceDetail.findOne({
      codeInvoice: order.code,
    });
    const invoiceDetail = await InvoiceDetail.find({
      codeInvoice: order.code,
    });
    const skuList = invoiceDetail.map((item) => item.sku);
    const products = await Product.find({ sku: { $in: skuList } }).select({
      sku: 1,
      productName: 1,
      originalPrice: 1,
      sellingPrice: 1,
      status: 1,
      urlImage: 1,
      contactToPurchase: 1,
    });
    const combinedItems = invoiceDetail.map((cartItem) => {
      const matchingProduct = products.find(
        (product) => product.sku === cartItem.sku
      );
      return {
        invoiceDetail,
        product: matchingProduct,
      };
    });
    res
      .status(200)
      .json({ order, statusOrder, invoiceDetail, products: combinedItems });
  } catch (e) {
    console.log(e);
  }
});
const cancelInvoice = asyncHandler(async (req, res) => {
  const code = req.params.code;
  const order = await Invoice.findOne({ _id: code });
  const statusOrder = await StatusInvoiceDetail.findOne({
    codeInvoice: order.code,
  });
  if (statusOrder.isShipping || statusOrder.isSuccess) {
    res.status(400).send();
    return;
  }
  statusOrder.isCancel = true;
  statusOrder.confirmInvoice = false;
  statusOrder.isShipping = false;
  statusOrder.isSuccess = false;
  statusOrder.save();
  res.status(200).json({ statusOrder });
});

const getAllInvoices = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const invoices = await Invoice.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    const totalInvoices = await Invoice.countDocuments();

    const invoiceIds = invoices.map((invoice) => invoice.code);

    const [statusOrders, invoiceDetails] = await Promise.all([
      StatusInvoiceDetail.find({ codeInvoice: { $in: invoiceIds } }),
      InvoiceDetail.find({ codeInvoice: { $in: invoiceIds } }),
    ]);

    const skuList = invoiceDetails.map((item) => item.sku);
    const products = await Product.find({ sku: { $in: skuList } }).select({
      sku: 1,
      productName: 1,
      originalPrice: 1,
      sellingPrice: 1,
      status: 1,
      contactToPurchase: 1,
      urlImage: 1,
    });

    const combinedInvoices = invoices.map((invoice) => {
      const matchingStatusOrder = statusOrders.find(
        (statusOrder) => statusOrder.codeInvoice === invoice.code
      );
      const matchingInvoiceDetails = invoiceDetails.filter(
        (invoiceDetail) => invoiceDetail.codeInvoice === invoice.code
      );

      // Map the sku to its corresponding product
      const productMap = new Map(
        products.map((product) => [product.sku, product])
      );

      // Find matching products for each invoice detail
      const invoiceDetailWithProducts = matchingInvoiceDetails.map(
        (invoiceDetail) => {
          const product = productMap.get(invoiceDetail.sku) || {};
          return { ...invoiceDetail.toObject(), product };
        }
      );

      return {
        order: invoice,
        statusOrder: matchingStatusOrder || {},
        invoiceDetail: invoiceDetailWithProducts,
      };
    });

    res.status(200).json({
      invoices: combinedInvoices,
      page,
      pageSize,
      totalInvoices,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Lỗi khi lấy dữ liệu hóa đơn" });
  }
});
const getdetailinvoice = asyncHandler(async (req, res) => {
  try {
    const codeInvoice = req.params.code;
    console.log("codeInvoice", codeInvoice);

    // Decode the codeInvoice to get the original value
    const decodedCodeInvoice = decodeURIComponent(codeInvoice);

    // Find all invoice details that match the provided codeInvoice
    const invoiceDetails = await InvoiceDetail.find({
      codeInvoice: decodedCodeInvoice,
    });

    if (!invoiceDetails || invoiceDetails.length === 0) {
      return res.status(404).json({
        message: "No invoice details found for the provided codeInvoice.",
      });
    }

    res.status(200).json(invoiceDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
const getInvoiceByCode = asyncHandler(async (req, res) => {
  try {
    const invoiceCode = req.params.code; // Retrieve the invoice code from the route parameter

    // Find the specific invoice by its code
    const invoice = await Invoice.findOne({ code: invoiceCode });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Fetch related data just like in the getAllInvoices endpoint
    const [statusOrder, invoiceDetails] = await Promise.all([
      StatusInvoiceDetail.findOne({ codeInvoice: invoiceCode }),
      InvoiceDetail.find({ codeInvoice: invoiceCode }),
    ]);

    const skuList = invoiceDetails.map((item) => item.sku);
    const products = await Product.find({ sku: { $in: skuList } }).select({
      sku: 1,
      productName: 1,
      originalPrice: 1,
      sellingPrice: 1,
      status: 1,
      contactToPurchase: 1,
      urlImage: 1,
    });

    // Combine the data into a single response
    const matchingStatusOrder = statusOrder || {};
    const matchingInvoiceDetails = invoiceDetails || [];

    // Map the sku to its corresponding product
    const productMap = new Map(
      products.map((product) => [product.sku, product])
    );

    // Find matching products for each invoice detail
    const invoiceDetailWithProducts = matchingInvoiceDetails.map(
      (invoiceDetail) => {
        const product = productMap.get(invoiceDetail.sku) || {};
        return { ...invoiceDetail.toObject(), product };
      }
    );

    const response = {
      order: invoice,
      statusOrder: matchingStatusOrder,
      invoiceDetail: invoiceDetailWithProducts,
    };

    res.status(200).json(response);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Lỗi khi lấy dữ liệu hóa đơn" });
  }
});
const SearchInvoice = asyncHandler(async (req, res) => {
  try {
    const code = req.params.code;
    const orders = await Invoice.find({
      code: { $regex: new RegExp(code, "i") },
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy hóa đơn" });
    }

    // Chuyển danh sách hóa đơn thành mảng (array)
    const orderList = orders;

    const result = await Promise.all(
      orderList.map(async (order) => {
        const statusOrder = await StatusInvoiceDetail.findOne({
          codeInvoice: order.code,
        });
        const invoiceDetail = await InvoiceDetail.find({
          codeInvoice: order.code,
        });

        const skuList = invoiceDetail.map((item) => item.sku);
        const products = await Product.find({ sku: { $in: skuList } }).select({
          sku: 1,
          productName: 1,
          originalPrice: 1,
          sellingPrice: 1,
          status: 1,
          urlImage: 1,
          contactToPurchase: 1,
        });

        const combinedItems = invoiceDetail.map((cartItem) => {
          const matchingProduct = products.find(
            (product) => product.sku === cartItem.sku
          );
          return {
            invoiceDetail: cartItem,
            product: matchingProduct,
          };
        });

        return { order, statusOrder, invoiceDetail, products: combinedItems };
      })
    );

    res.status(200).json(result);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Lỗi khi lấy dữ liệu hóa đơn" });
  }
});
const updateStatus = asyncHandler(async (req, res) => {
  const codeInvoice = "#" + req.params.codeInvoice;
  console.log("codeInvoice", codeInvoice);
  try {
    const statusOrder = await StatusInvoiceDetail.findOne({ codeInvoice });
    if (!statusOrder) {
      return res.status(404).json({ error: "Status order not found" });
    }
    // Update the status based on the request body
    if (req.body.isCancel !== undefined) {
      statusOrder.isCancel = req.body.isCancel;
    }
    if (req.body.confirmInvoice !== undefined) {
      statusOrder.confirmInvoice = req.body.confirmInvoice;
    }
    if (req.body.isShipping !== undefined) {
      statusOrder.isShipping = req.body.isShipping;
    }
    if (req.body.isSuccess !== undefined) {
      statusOrder.isSuccess = req.body.isSuccess;
    }

    // Save the updated status
    await statusOrder.save();

    return res.status(200).json({ statusOrder });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});
/// api get theo confirmInvoice
const getInvoicesByConfirmInvoice = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const confirmInvoice = false;
    const isSuccess = false;
    const isShipping = false;
    const isCancel = false;

    // Calculate the total number of documents that match the query
    const totalItems = await StatusInvoiceDetail.countDocuments({
      confirmInvoice: false,
      isCancel: false,
    });

    const statusInvoiceDetails = await StatusInvoiceDetail.aggregate([
      {
        $match: {
          confirmInvoice,
          isSuccess,
          isShipping,
          isCancel,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "codeInvoice",
          foreignField: "codeInvoice",
          as: "product",
        },
      },
      {
        $lookup: {
          from: "invoice-details",
          localField: "codeInvoice",
          foreignField: "codeInvoice",
          as: "invoiceDetails",
        },
      },
    ])
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const responses = await Promise.all(
      statusInvoiceDetails.map(async (statusInvoiceDetail) => {
        const invoiceCode = statusInvoiceDetail.codeInvoice;
        const invoice = await Invoice.findOne({ code: invoiceCode });
        const statusOrder = statusInvoiceDetail;
        const invoiceDetails = await InvoiceDetail.find({
          codeInvoice: invoiceCode,
        });

        const skuList = invoiceDetails.map((item) => item.sku);
        const products = await Product.find({ sku: { $in: skuList } }).select({
          sku: 1,
          productName: 1,
          originalPrice: 1,
          sellingPrice: 1,
          status: 1,
          contactToPurchase: 1,
          urlImage: 1,
        });

        const matchingStatusOrder = statusOrder || {};
        const matchingInvoiceDetails = invoiceDetails || [];

        const productMap = new Map(
          products.map((product) => [product.sku, product])
        );

        const invoiceDetailWithProducts = matchingInvoiceDetails.map(
          (invoiceDetail) => {
            const product = productMap.get(invoiceDetail.sku) || {};
            return { ...invoiceDetail.toObject(), product };
          }
        );

        const response = {
          order: invoice.toObject(), // Convert to object
          statusOrder: matchingStatusOrder,
          invoiceDetail: invoiceDetailWithProducts,
          confirmInvoice: true, // Set confirmInvoice to true in the response
        };

        return response;
      })
    );

    res.status(200).json({
      responses,
      page,
      pageSize,
      totalItems,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching StatusInvoiceDetail" });
  }
});

/// api get theo isCancel
const getInvoicesByIsCancel = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const isCancel = true;

    const skipCount = (page - 1) * pageSize;

    // Calculate the total number of documents that match the query
    const totalItems = await StatusInvoiceDetail.countDocuments({
      isCancel: true,
    });

    const statusInvoiceDetails = await StatusInvoiceDetail.aggregate([
      {
        $match: { isCancel },
      },
      {
        $skip: skipCount,
      },
      {
        $limit: pageSize,
      },
      {
        $lookup: {
          from: "products",
          localField: "codeInvoice",
          foreignField: "codeInvoice",
          as: "product",
        },
      },
      {
        $lookup: {
          from: "invoice-details",
          localField: "codeInvoice",
          foreignField: "codeInvoice",
          as: "invoiceDetails",
        },
      },
    ]);

    const responses = await Promise.all(
      statusInvoiceDetails.map(async (statusInvoiceDetail) => {
        const invoiceCode = statusInvoiceDetail.codeInvoice;
        const invoice = await Invoice.findOne({ code: invoiceCode });
        const statusOrder = statusInvoiceDetail;
        const invoiceDetails = await InvoiceDetail.find({
          codeInvoice: invoiceCode,
        });

        const skuList = invoiceDetails.map((item) => item.sku);
        const products = await Product.find({ sku: { $in: skuList } }).select({
          sku: 1,
          productName: 1,
          originalPrice: 1,
          sellingPrice: 1,
          status: 1,
          contactToPurchase: 1,
          urlImage: 1,
        });

        const matchingStatusOrder = statusOrder || {};
        const matchingInvoiceDetails = invoiceDetails || [];

        const productMap = new Map(
          products.map((product) => [product.sku, product])
        );

        const invoiceDetailWithProducts = matchingInvoiceDetails.map(
          (invoiceDetail) => {
            const product = productMap.get(invoiceDetail.sku) || {};
            return { ...invoiceDetail.toObject(), product };
          }
        );

        const response = {
          order: invoice.toObject(),
          statusOrder: matchingStatusOrder,
          invoiceDetail: invoiceDetailWithProducts,
          isCancel: true,
        };

        return response;
      })
    );

    res.status(200).json({
      responses,
      page,
      pageSize,
      totalItems,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching StatusInvoiceDetail" });
  }
});

/// api get theo isShipping
const getInvoicesByisShipping = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const isShipping = false;
    const confirmInvoice = true;
    const isSuccess = false;

    const skipCount = (page - 1) * pageSize;

    const statusInvoiceDetails = await StatusInvoiceDetail.aggregate([
      {
        $match: { isShipping, confirmInvoice, isSuccess }, // Filter by isShipping, confirmInvoice, and isSuccess
      },
      {
        $lookup: {
          from: "products",
          localField: "codeInvoice",
          foreignField: "codeInvoice",
          as: "product",
        },
      },
      {
        $lookup: {
          from: "invoice-details",
          localField: "codeInvoice",
          foreignField: "codeInvoice",
          as: "invoiceDetails",
        },
      },
      {
        $skip: skipCount,
      },
      {
        $limit: pageSize,
      },
    ]);

    const totalItems = await StatusInvoiceDetail.countDocuments({
      isShipping,
      confirmInvoice,
      isSuccess,
    });

    const responses = await Promise.all(
      statusInvoiceDetails.map(async (statusInvoiceDetail) => {
        const invoiceCode = statusInvoiceDetail.codeInvoice;
        const invoice = await Invoice.findOne({ code: invoiceCode });
        const statusOrder = statusInvoiceDetail;
        const invoiceDetails = await InvoiceDetail.find({
          codeInvoice: invoiceCode,
        });

        const skuList = invoiceDetails.map((item) => item.sku);
        const products = await Product.find({ sku: { $in: skuList } }).select({
          sku: 1,
          productName: 1,
          originalPrice: 1,
          sellingPrice: 1,
          status: 1,
          contactToPurchase: 1,
          urlImage: 1,
        });

        const matchingStatusOrder = statusOrder || {};
        const matchingInvoiceDetails = invoiceDetails || [];

        const productMap = new Map(
          products.map((product) => [product.sku, product])
        );

        const invoiceDetailWithProducts = matchingInvoiceDetails.map(
          (invoiceDetail) => {
            const product = productMap.get(invoiceDetail.sku) || {};
            return { ...invoiceDetail.toObject(), product };
          }
        );

        const response = {
          order: invoice.toObject(), // Convert to object
          statusOrder: matchingStatusOrder,
          invoiceDetail: invoiceDetailWithProducts,
          isShipping: false, // Set isShipping to false in the response
        };

        return response;
      })
    );

    res.status(200).json({
      responses,
      page,
      pageSize,
      totalItems,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching StatusInvoiceDetail" });
  }
});

/// api get theo isSuccess
const getInvoicesByIsSuccess = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const isSuccess = false;
    const isShipping = true;
    const confirmInvoice = true;

    const skipCount = (page - 1) * pageSize;

    // Calculate the total number of documents that match the query
    const totalItems = await StatusInvoiceDetail.countDocuments({
      isSuccess,
      isShipping,
      confirmInvoice,
    });

    const statusInvoiceDetails = await StatusInvoiceDetail.aggregate([
      {
        $match: { isSuccess, isShipping, confirmInvoice },
      },
      {
        $lookup: {
          from: "products",
          localField: "codeInvoice",
          foreignField: "codeInvoice",
          as: "product",
        },
      },
      {
        $lookup: {
          from: "invoice-details",
          localField: "codeInvoice",
          foreignField: "codeInvoice",
          as: "invoiceDetails",
        },
      },
      {
        $skip: skipCount,
      },
      {
        $limit: pageSize,
      },
    ]);

    const responses = await Promise.all(
      statusInvoiceDetails.map(async (statusInvoiceDetail) => {
        const invoiceCode = statusInvoiceDetail.codeInvoice;
        const invoice = await Invoice.findOne({ code: invoiceCode });
        const statusOrder = statusInvoiceDetail;
        const invoiceDetails = await InvoiceDetail.find({
          codeInvoice: invoiceCode,
        });

        const skuList = invoiceDetails.map((item) => item.sku);
        const products = await Product.find({ sku: { $in: skuList } }).select({
          sku: 1,
          productName: 1,
          originalPrice: 1,
          sellingPrice: 1,
          status: 1,
          contactToPurchase: 1,
          urlImage: 1,
        });

        const matchingStatusOrder = statusOrder || {};
        const matchingInvoiceDetails = invoiceDetails || [];

        const productMap = new Map(
          products.map((product) => [product.sku, product])
        );

        const invoiceDetailWithProducts = matchingInvoiceDetails.map(
          (invoiceDetail) => {
            const product = productMap.get(invoiceDetail.sku) || {};
            return { ...invoiceDetail.toObject(), product };
          }
        );

        // Set conditions in the response
        const response = {
          order: invoice.toObject(),
          statusOrder: matchingStatusOrder,
          invoiceDetail: invoiceDetailWithProducts,
          isSuccess,
          isShipping,
          confirmInvoice,
        };

        return response;
      })
    );
    res.status(200).json({
      responses,
      page,
      pageSize,
      totalItems,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching StatusInvoiceDetail" });
  }
};

///api get tông total 1 tuần
const totalInAWeek = asyncHandler(async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const totalInAWeek = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    if (totalInAWeek.length > 0) {
      res.json({ total: totalInAWeek[0].total });
    } else {
      res.json({ total: 0 });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/// api cho biết số lượng đơn hàng được tạo trong hôm nay
const unconfirmedCount = asyncHandler(async (req, res) => {
  try {
    const unconfirmedCount = await StatusInvoiceDetail.countDocuments({
      confirmInvoice: false,
    });

    res.json({ count: unconfirmedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
///api tính số đơn hủy
const cancelledCount = asyncHandler(async (req, res) => {
  try {
    const cancelledCount = await StatusInvoiceDetail.countDocuments({
      isCancel: true,
    });

    res.json({ count: cancelledCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = {
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
};
