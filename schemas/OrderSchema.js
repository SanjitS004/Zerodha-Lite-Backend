const { Schema } = require("mongoose");

const orderSchema = new Schema({
  name: String,
  qty:Number,
  price: Number,
  mode: {
    type:String,
    enum:["buy","sell"]
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "user"
    }
});

module.exports =  orderSchema;
