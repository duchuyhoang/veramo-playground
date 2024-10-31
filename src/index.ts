// import { IIdentifier } from '@veramo/core';
import { agent } from './veramo/setup.ts'

// export interface VeramoProvider {
//   deriveVerifiableCredential(credential): Promise<any>;


//   transferVerifiableCredential(credential): Promise<any>;

//   createPresentationRequest(request): Promise<Buffer | GenericResult>; // For now only Buffer


//   issueVerifiablePresentation(presentation): Promise<VerifiablePresentation>;


//   verifyVerifiablePresentation(presentation): Promise<GenericResult>;


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
  return verifiableCredential;
}

async function verifyCredential(credentialId: string) {
  const vc = await agent.getVerifiableCredential({ credentialId });
  const result = await agent.verifyVerifiableCredential({
    credential: vc
  });
  console.log('result', result);

}

async function main() {
  // const credential = await issueVC();
  // const record = await agent.storeVerifiableCredential({
  //   verifiableCredential: credential,
  // });

  // // await agent.revokeVerifiableCredential({
  // //   credentialId: record.id,
  // //   issuerDID: record.issuerId,
  // // });

  // await verifyCredential(record.id);
  // await agent.deleteVerifiableCredential({ credentialId: 'e1af4937-193d-4099-b5aa-577aa54fd432' });
}

main().catch(console.log)