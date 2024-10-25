import mongoose from "mongoose";
import agent from "./agent.ts";
import { IIdentifier } from "@veramo/core";

const IDENTIFIER_ALIAS = "issuer";

const getIdentifier = async () => {
  const identifier = await agent.didManagerGetOrCreate({
    alias: IDENTIFIER_ALIAS,
    kms: "local",
  });

  return identifier;
};

const createCredential = async (identifier: IIdentifier) => {
  const verifiableCredential = await agent.createVerifiableCredential({
    credential: {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/bbs/v1",
      ],

      credentialSchema: [
        {
          id: "https://schema.trinsic.cloud/dentity-dev/bronze",
          type: "JsonSchemaValidator2018",
        },
      ],
      issuanceDate: "2024-10-24T06:57:50.000Z",
      issuer: { id: identifier.did },
      credentialSubject: {
        id: "did:web:example.com",
        you: "Rock",
      },
    },
    fetchRemoteContexts: true,

    proofFormat: "jwt",
  });
  console.log(`New credential created`);
  console.log(JSON.stringify(verifiableCredential, null, 2));
};

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/veramo-playground");
  const issuer_identifier = await getIdentifier();
  // console.log("Issuer:", issuer_identifier);

  const customCredential = await agent.createCredentialWithSchema({
    schemaUrl: "https://schema.trinsic.cloud/dentity-dev/bronze",
    // schemaUrl: "https://schema.trinsic.cloud/dentity-dev/verified-phone-number",
    issuerDID: issuer_identifier.did,
    credential: {
      credential: {
        type: ["VerifiableCredential", "Bronze"],
        // "@context": [
        //   "https://www.w3.org/2018/credentials/v1",
        //   "https://w3id.org/bbs/v1",
        // ],
        // "@context": ["https://www.w3.org/2018/credentials/v1"],
        issuer: { id: issuer_identifier.did },
        credentialSubject: {
          id: "did:web:example.com",
          credentialIssuer: "Twilio",
          credentialType: "Verified Phone Number",
          holderFullName: "daadda",
          phoneNumber: "+1 (548) 554-3044",
        },
        issuanceDate: new Date().toISOString(),

        // credentialSchema: [
        //   {
        //     id: "https://schema.trinsic.cloud/dentity-dev/bronze",
        //     type: "JsonSchemaValidator2018",
        //   },
        // ],
        // issuanceDate: "2023-06-07T04:11:20Z",
      },
      proofFormat: "jwt",
      fetchRemoteContexts: true,
    },
  });
  console.log("Custom credential with schema", customCredential);

  const status = await agent.checkCredentialStatus({
    credential: customCredential,
  });
  
  agent.createSelectiveDisclosureRequest()

  console.log("revo status", status);

  // await createCredential(issuer_identifier);

  // const verifiableCredential = await agent.createVerifiableCredential({
  //   credential: {
  //     issuer: { id: issuer_identifier.did },
  //     credentialSubject: {
  //       id: "did:web:example.com",
  //       you: "Rock",
  //     },
  //     credentialSchema: [
  //       {
  //         id: "https://schema.trinsic.cloud/dentity-dev/bronze",
  //         type: "JsonSchemaValidator2018",
  //       },
  //     ],
  //   },

  //   proofFormat: "jwt",
  // });

  // console.log("Credential:", verifiableCredential);

  // agent.
}

main().catch(console.log);
