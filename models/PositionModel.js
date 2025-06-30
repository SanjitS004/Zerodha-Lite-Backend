const { model } = require("mongoose");

const positionSchema = require("../schemas/PositionSchema");

const PositionModel =  model("position",positionSchema);

module.exports = { PositionModel };