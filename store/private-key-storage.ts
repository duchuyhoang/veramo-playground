import {
  AbstractPrivateKeyStore,
  AbstractSecretBox,
  ImportablePrivateKey,
  ManagedPrivateKey,
} from "@veramo/key-manager";
import PrivateKeyStoreModel from "../shemas/private-key.schema.ts";

// UUID v4
export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class PrivateKeyStore extends AbstractPrivateKeyStore {
  constructor(private secretBox?: AbstractSecretBox) {
    super();
  }

  async importKey(args: ImportablePrivateKey): Promise<ManagedPrivateKey> {
    const payload = { ...args };
    payload.alias = args.alias || uuidv4();
    payload.privateKeyHex = args.privateKeyHex;
    payload.type = args.type;

    const existingKey = await PrivateKeyStoreModel.findOne({
      "key.alias": args.alias,
    });
    if (existingKey && this.secretBox) {
      (existingKey.key as any).privateKeyHex = await this.secretBox.decrypt(
        (existingKey.key as any).privateKeyHex
      );
    }

    if (
      existingKey &&
      (existingKey.key as any).privateKeyHex !== payload.privateKeyHex
    ) {
      throw new Error(
        `key_already_exists: A key with this alias exists but with different data. Please use a different alias.`
      );
    }

    if (this.secretBox && payload.privateKeyHex) {
      payload.privateKeyHex = await this.secretBox.encrypt(
        payload.privateKeyHex
      );
    }

    const privateKey = new PrivateKeyStoreModel({ key: payload });
    await privateKey.save();
    return privateKey.key as any;
  }
  async getKey(args: { alias: string }): Promise<ManagedPrivateKey> {
    console.log("xxxx", args);
    const key: any = await PrivateKeyStoreModel.findOne({
      [`key.alias`]: args.alias,
    });

    console.log("keys:", key.da);

    if (this.secretBox && key.key.privateKeyHex) {
      key.key.privateKeyHex = await this.secretBox.decrypt(
        key.key.privateKeyHex
      );
    }
    return key.key as ManagedPrivateKey;
  }
  async deleteKey(args: { alias: string }): Promise<boolean> {
    await PrivateKeyStoreModel.deleteOne({
      "key.alias": args.alias,
    });
    return true;
  }
  listKeys(args: {}): Promise<ManagedPrivateKey[]> {
    throw new Error("Method not implemented.");
  }
}

export default PrivateKeyStore;
