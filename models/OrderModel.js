const { model } = require("mongoose");

const orderSchema = require("../schemas/OrderSchema");

const OrderModel =  model("order",orderSchema);

module.exports = { OrderModel };