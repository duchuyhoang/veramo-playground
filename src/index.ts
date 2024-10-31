// import { IIdentifier } from '@veramo/core';
import { agent } from './veramo/setup.ts'

// export interface VeramoProvider {
//   deriveVerifiableCredential(credential): Promise<any>;


//   transferVerifiableCredential(credential): Promise<any>;

//   createPresentationRequest(request): Promise<Buffer | GenericResult>; // For now only Buffer

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
  const presentation = await agent.issueVerifiablePresentation({
    holder: 'did:ethr:sepolia:0x03c2c98567c066f6cd38cf0ce8856849f2d99d3ce98ee4364f1f7ff56baa156ef8',
    credentialIds: ['601e664d-e9ab-4f48-95de-963a17466a84', '6e40131c-c202-4d14-80ad-f0c4bf67f431'],
  });

  const res = await agent.verifyVerifiablePresentation({
    presentation
  });
  console.log('res', res);
  
  
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