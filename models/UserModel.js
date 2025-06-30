const { model } = require("mongoose");

const userSchema = require("../schemas/UserSchema");

const UserModel =  model("user",userSchema);

module.exports = { UserModel };