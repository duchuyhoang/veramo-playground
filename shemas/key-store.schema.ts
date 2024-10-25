import { Schema, model } from "mongoose";

const KeyStoreSchema = new Schema({
  key: Schema.Types.Mixed,
});

const KeyStoreModel = model("key-store", KeyStoreSchema, "key-store");

export default KeyStoreModel;
