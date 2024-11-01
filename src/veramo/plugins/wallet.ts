import { IPluginMethodMap } from "@veramo/core";

export interface IWalletPlugin extends IPluginMethodMap {
  readonly methods: IWalletPlugin;
}

export class WalletPlugin {
  readonly methods: IWalletPlugin;

  constructor() {
    this.methods = {};
  }

  public async createWallet() {}
}
