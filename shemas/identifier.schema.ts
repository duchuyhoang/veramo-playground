import { Schema, model } from "mongoose";

const IdentifierSchema = new Schema({
  identifier: Schema.Types.Mixed,
});

const IdentifierModel = model("did", IdentifierSchema, "did");

export default IdentifierModel;
