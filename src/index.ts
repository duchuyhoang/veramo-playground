import { IIdentifier } from '@veramo/core';
import { agent } from './veramo/setup.js'

// export interface VeramoProvider {
//   verifyVerifiableCredential(credential): Promise<GenericResult>;


//   verifyVerifiablePresentation(presentation): Promise<GenericResult>;


//   createPresentationRequest(request): Promise<Buffer | GenericResult>; // For now only Buffer


//   deriveVerifiableCredential(credential): Promise<any>;


//   storeVerifiableCredential(credential): Promise<CredentialStorageResult>;


//   transferVerifiableCredential(credential): Promise<any>;


//   deleteVerifiableCredential(identifier): Promise<CredentialDeleteResult>;


//   issueVerifiablePresentation(presentation): Promise<VerifiablePresentation>;


//   presentPresentation(request): Promise<GenericResult>;
// }

async function getIdentifiers() {
  const issuerAlias = 'issuer';
  const holderAlias = 'holder';

  const [issuer, holder] = await Promise.all([
    agent.didManagerGetByAlias({ alias: issuerAlias })
      .catch(() => agent.didManagerCreate({ alias: issuerAlias })),
    agent.didManagerGetByAlias({ alias: holderAlias })
      .catch(() => agent.didManagerCreate({ alias: holderAlias })),
  ]);

  return { issuer, holder };
}

async function issueVC() {
  const { issuer, holder } = await getIdentifiers();

  const verifiableCredential = await agent.issueVerifiableCredential({
    schemaUrl: 'https://schema.trinsic.cloud/dentity-dev/bronze',
    holder: holder.did,
    credential: {
      issuer: { id: issuer.did },
      type: ['Bronze'],
      credentialSubject: {
        credentialIssuer: "Twilio",
        credentialType: "Verified Phone Number",
        holderFullName: "daadda",
        phoneNumber: "+1 (548) 554-3044",
      },
      // expirationDate: '2024-10-31T00:00:00.000Z',
    },
  });
  console.log('verifiableCredential', verifiableCredential);
}

async function revokeCredential() {

}

async function main() {
  // await issueVC();
}

main().catch(console.log)