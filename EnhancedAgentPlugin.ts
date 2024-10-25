import {
  CredentialPayload,
  IAgentContext,
  IAgentPlugin,
  ICreateVerifiableCredentialArgs,
  ICredentialPlugin,
  IDIDManager,
  IKeyManager,
  IPluginMethod,
  IPluginMethodMap,
  VerifiableCredential,
} from "@veramo/core";
import { JsonSchemaValidator } from "./lib/jsonSchemaValidator.ts";
import { uuidv4 } from "./store/private-key-storage.ts";

const byteEncoder = new TextEncoder();

async function loadJsonLd(url: string) {
  try {
    // Fetch the JSON-LD document from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load JSON-LD from URL: ${response.statusText}`
      );
    }

    // Parse the response as JSON
    const jsonData = await response.json();
    return jsonData;

    // Process the JSON-LD data (you can expand, compact, or frame it)
    // const expandedData = await jsonld.expand(jsonData as any);

    // console.log("Expanded JSON-LD:", expandedData);
    // return expandedData; // or return the processed data as needed
  } catch (error) {
    console.error("Error loading JSON-LD:", error);
  }
}
export interface IEnhancedAgentPlugin extends IPluginMethodMap {
  createCredentialWithSchema: (
    payload: {
      schemaUrl: string;
      credential: ICreateVerifiableCredentialArgs;
      issuerDID: string;
    },
    context: IAgentContext<ICredentialPlugin>
  ) => Promise<VerifiableCredential>;
}

export class EnhancedAgentPlugin implements IAgentPlugin {
  readonly methods: IEnhancedAgentPlugin;

  constructor() {
    this.methods = {
      createCredentialWithSchema: this.createCredentialWithSchema.bind(this),
    };
  }

  public async createCredentialWithSchema(
    {
      issuerDID,
      schemaUrl,
      credential,
    }: {
      issuerDID: string;
      schemaUrl: string;
      credential: ICreateVerifiableCredentialArgs;
    },
    context: IAgentContext<ICredentialPlugin>
  ) {
    const schema = await loadJsonLd(schemaUrl);

    const credentialPayload: CredentialPayload = {
      id: uuidv4(),
      type: ["VerifiableCredential"].concat(
        // ["#/definitions/$VerifiedPhoneNumber"]
        //
        schema?.title ? [schema?.title.replace(/\s/g, "")] : []
      ),
      issuanceDate: new Date().toISOString(),
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      credentialSchema: [
        {
          id: schemaUrl,
          //   TODO,
          // Detect schema type
          type: "JsonSchemaValidator2018",
        },
      ],
      credentialStatus: {
        id: "http://localhost:3000/revocation/114141",
        type: "RevocationList2020Status",
      },
      ...credential.credential,
      issuer: { id: issuerDID },
    };

    console.log("payloasd", credentialPayload);

    const encodedCred = byteEncoder.encode(JSON.stringify(credentialPayload));
    const encodedSchema = byteEncoder.encode(JSON.stringify(schema));
    await new JsonSchemaValidator().validate(encodedCred, encodedSchema);
    const newCredential = await context.agent.createVerifiableCredential({
      credential: credentialPayload,
      proofFormat: "jwt",
      fetchRemoteContexts: true,
    });
    return newCredential;
  }
}
