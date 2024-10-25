import { Schema, model } from "mongoose";

const PrivateKeyStoreSchema = new Schema({
  key: Schema.Types.Mixed,
});

const PrivateKeyStoreModel = model(
  "private-key-store",
  PrivateKeyStoreSchema,
  "private-key-store"
);

export default PrivateKeyStoreModel;
