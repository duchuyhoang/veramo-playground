import { Schema, model } from "mongoose";

const DIDSchema = new Schema({
  identifier: Schema.Types.Mixed,
});

const DidModel = model("did", DIDSchema, "did");

export default DidModel;
