const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const Visit = require("./models/visitModel");
const errorHandler = require("./middleware/errorHandler");
const connectDb = require("./configs/dbConnection");
dotenv.config();
connectDb();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/api/users", require("./routers/userRoutes"));
app.use("/api/brands", require("./routers/brandRoutes"));
app.use("/api/products", require("./routers/productRoutes"));
app.use("/api/categories", require("./routers/categoryRoutes"));
app.use("/api/cart", require("./routers/cartRoutes"));
app.use("/api/invoices", require("./routers/invoiceRoutes"));
app.use("/api/reviews", require("./routers/reviewRouter"));
app.use(errorHandler);
app.get("/api/visits/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let visit = await Visit.findOne({ date: today });
    if (!visit) {
      visit = new Visit({ date: today, count: 1 });
    } else {
      visit.count += 1;
    }
    await visit.save();
    res.json({ today: visit ? visit.count : 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/visits/total", async (req, res) => {
  try {
    const total = await Visit.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$count" },
        },
      },
    ]);
    res.json({ total: total[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
const port = process.env.PORT || 5000;
app.use(express.static(path.join(__dirname, 'build')));

// Handle requests to the root URL
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.listen(port, () => {
  console.log(`running on port : ${port}`);
});
