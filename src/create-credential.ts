import { v4 as uuidv4 } from 'uuid';
import { agent } from './veramo/setup.js'
// import {SdrMessageHandler} from '@veramo/selective-disclosure';

async function main() {
  const identifier = await agent.didManagerGetByAlias({ alias: 'i2' })

  const verifiableCredential = await agent.createVerifiableCredential({
    credential: {
      issuer: { id: identifier.did },
      type: ['PresentationTestCredential'],
      credentialSubject: {
        // id: identifier.did,
        cardNumber: '123123124124',
        cardName: 'Credit card',
      },
      expirationDate: '2024-10-29T08:59:00.000Z',
    },
    proofFormat: 'jwt',
  })
  console.log('verifiableCredential', verifiableCredential);

  // const verifiableCredential2 = await agent.createVerifiableCredential({
  //   credential: {
  //     issuer: { id: identifier.did },
  //     type: ['PresentationTestCredential2'],
  //     credentialSubject: {
  //       id: identifier.did,
  //       fName: 'First',
  //       lName: 'Last',
  //     },
  //   },
  //   proofFormat: 'jwt',
  // })
  // console.log('verifiableCredential', verifiableCredential2);


  // const vcFound = agent.dataStoreGetVerifiableCredential({
  //   hash: 'QmdDNtjAeW6JPmHhTGKmBsycxWtpJwGSJFGyczrqQM5opc',
  // })
  // console.log('vcFound', vcFound);
  


  // const result = await agent.dataStoreSaveVerifiableCredential({
  //   verifiableCredential: {
  //     id: uuidv4(),
  //     // id: 'b839aa93-9e85-434a-b0c0-cb3758ed4c1b',
  //     ...verifiableCredential,
  //   },
  // });

  // console.log('result', result);
  // agent.dataStoreSaveVerifiablePresentation
  // const profile = await agent.createProfilePresentation({
  //   holder: identifier.did,
  //   save: true,
  //   send: true,
  // });
  // console.log('profile', profile);


  // console.log(`New credential created`)
  // console.log(JSON.stringify(verifiableCredential, null, 2))
  // // console.log('identifier.keys[0].kid', identifier.keys[0].kid);

  // const verifiablePresentation = await agent.createVerifiablePresentation({
  //   proofFormat: 'jwt',
  //   presentation: {
  //     holder: identifier.did,
  //     type: ['PresentationTestCredential'],
  //     verifiableCredential: [
  //       {
  //         '@context': verifiableCredential['@context'],
  //         issuanceDate: verifiableCredential.issuanceDate,
  //         issuer: verifiableCredential.issuer,
  //         credentialSubject: {
  //           you: verifiableCredential.credentialSubject.you,
  //         },
  //         proof: verifiableCredential.proof
  //       },
  //       {
  //         '@context': verifiableCredential2['@context'],
  //         issuanceDate: verifiableCredential2.issuanceDate,
  //         issuer: verifiableCredential2.issuer,
  //         credentialSubject: {
  //           you: verifiableCredential2.credentialSubject.you,
  //         },
  //         proof: verifiableCredential2.proof
  //       },
  //     ],
  //   },
  // });

  // console.log('========verifiablePresentation========');
  // console.log(JSON.stringify(verifiablePresentation, null, 2));


  // const request = await agent.createSelectiveDisclosureRequest({
  //   data: {
  //     issuer: identifier.did,
  //     claims: [
  //       {
  //         claimType: 'you',
  //         // claimValue
  //       }
  //     ],
  //   }
  // })
  // console.log('request', request);
  // const sdr = await agent.getVerifiableCredentialsForSdr({
  //   sdr: {
  //     claims: [
  //       {
  //         claimType: 'fName',
  //         // claimValue
  //       }
  //     ],
  //   }
  // })
  // console.log('sdr:', JSON.stringify(sdr));

  // agent.message
  // const message = new SdrMessageHandler();
  // message.handle({ raw: request }, agent)
}

main().catch(console.log)