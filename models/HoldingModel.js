const { model } = require("mongoose");

const holdingSchema = require("../schemas/HoldingSchema");

const HoldingModel = model("holding",holdingSchema);

module.exports = { HoldingModel };