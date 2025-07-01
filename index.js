require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser"); 

const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require("mongoose");
const {HoldingModel} = require("./models/HoldingModel");
const {PositionModel} = require("./models/PositionModel");
const {OrderModel} =require("./models/OrderModel");
const MONGO_URL = process.env.MONGO_URL;
const {userVerification}  = require("./middlewares/AuthMiddleware");
const authRoute = require("./routes/AuthRoute");
const { UserModel } = require("./models/UserModel");

app.use(
  cors({
    origin: ["https://zerodha-lite-frontend.onrender.com"], // frontend address
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // important for cookies
  })
);
app.use(bodyParser.json());
app.use(cookieParser());

main()
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log("Connection failed!", err);
  });
async function main() {
  await mongoose.connect(MONGO_URL);
}

app.use("/auth", authRoute);


app.get("/dashboard", userVerification, (req, res) => {
 
  res.status(200).json({ message: "Access granted" });
});

app.get("/allHoldings", userVerification, async(req, res) => {
  try {
    const userId = req.userId;
    const holdings = await HoldingModel.find({ user: userId });
    res.json(holdings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch holdings" });
  }

});
app.get("/allPositions", userVerification ,async(req, res) => {
  try {
    const userId = req.userId;
    const positions = await PositionModel.find({ user: userId });
    res.json(positions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch positions" });
  }
});

app.get("/orders", userVerification, async (req, res) => {
  try {
    const userId = req.userId; // ✅ comes from JWT middleware
   
    const orders = await OrderModel.find({ user: userId }); 
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

app.post("/buyOrder", userVerification, async (req, res) => {
  try {
    const userId = req.userId; 
    const name = req.body.name;
    const qty = Number(req.body.qty);
    const price = parseFloat(req.body.price);
    const mode = req.body.mode;

    const newOrder = new OrderModel({
      name,
      qty,
      price,
      mode,
      user: userId, // ✅ associate order with user
    });

    const existingHolding = await HoldingModel.findOne({ name, user: userId });

    if (existingHolding) {
      const totalQty = existingHolding.qty + qty;
      const newAvg =
        (existingHolding.avg * existingHolding.qty + price * qty) / totalQty;

      existingHolding.qty = totalQty;
      existingHolding.avg = newAvg;
      existingHolding.price = price;
     

      await existingHolding.save();
    } else {
      const fluctuation = Math.floor(Math.random() * 1000) / 100 - 5; 
      // -5.00 to +5.00 in ₹
      
      const ltp = parseFloat((price + fluctuation).toFixed(2));
      const net = parseFloat(((ltp - price) * qty).toFixed(2));
    
      const newHolding = new HoldingModel({
        name,
        qty,
        avg: price,
        price: ltp,
        net,
        day: "+2.33%",  // this can also be calculated
        isLoss: net < 0,
        user: userId,
      });

      await newHolding.save();
    }

    await newOrder.save();
    res.status(200).json({
      success: true,
      message: "Order Bought!",
    });
  } catch (err) {
    console.error("Error buying order:", err);
    res.status(500).send("Failed to buy order.");
  }
});

// app.delete("/clearUsers", async (req, res) => {
//   await UserModel.deleteMany({});
//   res.send("Users cleared");
// });

app.post("/sellOrder", userVerification, async (req, res) => {
  try {
    const { name, qty, price, mode } = req.body;
    const userId = req.userId;

    const sellQty = Number(qty);
    const sellPrice = Number(price);

    // Find user's holding for the stock
    const holding = await HoldingModel.findOne({ name, user: userId });

    if (!holding) {
      return res.status(404).json({ success: false, message: "No such holding to sell." });
    }

    if (holding.qty < sellQty) {
      return res.status(400).json({ success: false, message: "Not enough quantity to sell." });
    }

    const avgPrice = holding.avg;
    const totalSellValue = sellQty * sellPrice;
    const totalCost = sellQty * avgPrice;
    const pnl = totalSellValue - totalCost;

    const isLoss = pnl < 0;
    const net = pnl;
    const day = "1.89%"; 

   
    const order = new OrderModel({
      name,
      qty: sellQty,
      price: sellPrice,
      mode,
      user: userId,
    });
    await order.save();

    // Update holding
    if (holding.qty === sellQty) {
      await HoldingModel.deleteOne({ name, user: userId });
    } else {
      holding.qty -= sellQty;
      await holding.save();
    }

    // Only update Position if price is different
    await PositionModel.findOneAndUpdate(
      { name, user: userId },
      {
        product: "CNC",
        price: sellPrice,
        net,
        avg: avgPrice,
        qty: sellQty,
        day,
        isLoss,
        user: userId,
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Order Sold!",
    });
  } catch (err) {
    console.error("Sell error:", err);
    return res.status(500).json({ success: false, message: "Sell failed." });
  }
});

app.listen(PORT, (req, res) => {
  console.log("App is listening to 5000");
});
