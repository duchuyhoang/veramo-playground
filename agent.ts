import {
  IDIDManager,
  IResolver,
  IDataStore,
  IDataStoreORM,
  IKeyManager,
  ICredentialPlugin,
  TAgent,
  IAgentOptions,
  createAgent,
  VerifiableCredential,
  ICreateVerifiableCredentialArgs,
  ICredentialStatusVerifier,
  CredentialStatus,
  // createAgent
} from "@veramo/core";
import { CredentialStatusPlugin } from "@veramo/credential-status";

import { DIDManager } from "@veramo/did-manager";
import { EthrDIDProvider } from "@veramo/did-provider-ethr";
import DIDStore from "./store/did-storage.ts";
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { Resolver } from "did-resolver";
import { getResolver as ethrDidResolver } from "ethr-did-resolver";
import { getResolver as webDidResolver } from "web-did-resolver";
import { CredentialPlugin } from "@veramo/credential-w3c";
import { KeyManager } from "@veramo/key-manager";
import KeyStoreStorage from "./store/key-store-storage.ts";
import PrivateKeyStore from "./store/private-key-storage.ts";
import { KeyManagementSystem, SecretBox } from "@veramo/kms-local";
import {
  EnhancedAgentPlugin,
  IEnhancedAgentPlugin,
} from "./EnhancedAgentPlugin.ts";
import fetch from "node-fetch";
const INFURA_PROJECT_ID = "";

const RPC_URL = `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`;

const didRegistry = "0x03d5003bf0e79c5f5223588f347eba39afbc3818";

const KMS_SECRET_KEY =
  "29ee7ae3adcdac32f396678a0e2650214d631706bfa3d835939a565bc3b7ba5f";

const agent = await createAgent<
  IDIDManager &
    IKeyManager &
    IDataStore &
    IDataStoreORM &
    IResolver &
    ICredentialPlugin &
    ICredentialStatusVerifier &
    IEnhancedAgentPlugin
  // {
  //   _createCredentialWithSchema: (
  //     schema: string,
  //     payload: ICreateVerifiableCredentialArgs
  //   ) => Promise<VerifiableCredential>;
  //   sayHello: (m1: string, m2: number) => void;
  // }
>({
  plugins: [
    new KeyManager({
      store: new KeyStoreStorage(),
      kms: {
        local: new KeyManagementSystem(
          new PrivateKeyStore(new SecretBox(KMS_SECRET_KEY))
        ),
      },
    }),
    new DIDManager({
      store: new DIDStore(),
      defaultProvider: "did:ethr:sepolia",
      providers: {
        "did:ethr:sepolia": new EthrDIDProvider({
          defaultKms: "local",
          network: "sepolia",
          rpcUrl: RPC_URL,
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...ethrDidResolver({ infuraProjectId: INFURA_PROJECT_ID }),
        ...webDidResolver(),
      }),
    }),
    new CredentialPlugin(),
    new CredentialStatusPlugin({
      RevocationList2020Status: async (credential, did) => {
        console.log("chec status id", (credential as any).id);
        const res = await fetch(
          `http://localhost:3000/revocation/${(credential as any).id}`
        );
        const data: any = await res.json();
        return {
          revoked: data?.status.revoked,
        };
      },
    }),
    new EnhancedAgentPlugin(),
  ],
});

const byteEncoder = new TextEncoder();

// agent._createCredentialWithSchema = async function (
//   schemaUrl: string,
//   payload: ICreateVerifiableCredentialArgs
// ) {
//   const schema = await loadJsonLd(schemaUrl);
//   const encodedCred = byteEncoder.encode(JSON.stringify(payload.credential));
//   const encodedSchema = byteEncoder.encode(JSON.stringify(schema));
//   await new JsonSchemaValidator().validate(encodedCred, encodedSchema);
//   const cre = await this.createVerifiableCredential(payload);
//   return cre;
// } as any;

export default agent;
