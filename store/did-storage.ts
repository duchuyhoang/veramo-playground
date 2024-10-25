import { IIdentifier } from "@veramo/core";
import { AbstractDIDStore } from "@veramo/did-manager";
import DidModel from "../shemas/did.schema.ts";

class DIDStore extends AbstractDIDStore {
  async getDID(args: any): Promise<IIdentifier> {
    console.log("did", args);
    const filter = Object.entries(args).reduce(
      (prev, [key, value]) => ({
        ...prev,
        [`identifier.${key}`]: value,
      }),
      {}
    );
    console.log("ff", filter);
    const data = await DidModel.findOne(filter);
    console.log(data);
    return data?.identifier as any;
  }

  async deleteDID(args: { did: string }): Promise<boolean> {
    await DidModel.deleteOne({
      "identifier.did": args.did,
    });
    return true;
  }

  async listDIDs({
    alias,
    provider,
  }: {
    alias?: string | undefined;
    provider?: string | undefined;
  }): Promise<IIdentifier[]> {
    const datas = await DidModel.find({
      ...(alias && { "identifier.alias": alias }),
      ...(provider && { "identifier.provider": provider }),
    });
    return (datas || []).map((data) => data.identifier) as any;
  }
  async importDID(args: IIdentifier): Promise<boolean> {
    const newDid = new DidModel({
      identifier: args,
    });
    await newDid.save();
    return true;
  }
}

export default DIDStore;
