const {Schema} = require("mongoose");

const positionSchema = new Schema({
    product: String,
    name: String,
    qty: Number,
    avg: Number,
    price: Number,
    net: String,
    day: String,
    isLoss: Boolean,
    user: {
        type: Schema.Types.ObjectId,
        ref: "user"
        }
});

module.exports = positionSchema;
