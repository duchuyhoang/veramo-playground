import { IKey, ManagedKeyInfo } from "@veramo/core";
import { AbstractKeyStore } from "@veramo/key-manager";
import KeyStoreModel from "../shemas/key-store.schema.ts";

class KeyStoreStorage extends AbstractKeyStore {
  async importKey(args: Partial<IKey>): Promise<boolean> {
    const newKey = new KeyStoreModel({
      key: args,
    });
    console.log("sa", args);
    await newKey.save();
    return true;
  }
  async getKey({ kid }: { kid: string }): Promise<IKey> {
    const data = await KeyStoreModel.findOne({
      "key.kid": kid,
    });
    return data?.key as any;
  }
  async deleteKey(args: { kid: string }): Promise<boolean> {
    await KeyStoreModel.deleteOne({
      "key.kid": args.kid,
    });
    return true;
  }
  async listKeys(args: {}): Promise<ManagedKeyInfo[]> {
    const filter = Object.entries(args).reduce(
      (prev, [key, value]) => ({
        ...prev,
        [`key.${key}`]: value,
      }),
      {}
    );

    const datas = await KeyStoreModel.find(filter);
    return datas.map((data) => data.key) as any;
  }
}

export default KeyStoreStorage;
