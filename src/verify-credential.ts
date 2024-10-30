import { agent } from './veramo/setup.js'

async function main() {
  const result = await agent.verifyCredential({
    credential: {
      credentialSubject: {
        cardNumber: '123123124124',
        cardName: 'Credit card',
        id: 'did:ethr:arbitrum:0x02fe5f746bd6585162fbe7344f89660e055016b8bd1ad530c01d38b338a19b7d82'
      },
      issuer: {
        id: 'did:ethr:arbitrum:0x02fe5f746bd6585162fbe7344f89660e055016b8bd1ad530c01d38b338a19b7d82'
      },
      type: [ 'VerifiableCredential', 'PresentationTestCredential' ],
      '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
      issuanceDate: '2024-10-29T08:58:58.000Z',
      expirationDate: '2024-10-29T08:59:00.000Z',
      proof: {
        type: 'JwtProof2020',
        jwt: 'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3MzAxOTIzNDAsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJQcmVzZW50YXRpb25UZXN0Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJjYXJkTnVtYmVyIjoiMTIzMTIzMTI0MTI0IiwiY2FyZE5hbWUiOiJDcmVkaXQgY2FyZCJ9fSwic3ViIjoiZGlkOmV0aHI6YXJiaXRydW06MHgwMmZlNWY3NDZiZDY1ODUxNjJmYmU3MzQ0Zjg5NjYwZTA1NTAxNmI4YmQxYWQ1MzBjMDFkMzhiMzM4YTE5YjdkODIiLCJuYmYiOjE3MzAxOTIzMzgsImlzcyI6ImRpZDpldGhyOmFyYml0cnVtOjB4MDJmZTVmNzQ2YmQ2NTg1MTYyZmJlNzM0NGY4OTY2MGUwNTUwMTZiOGJkMWFkNTMwYzAxZDM4YjMzOGExOWI3ZDgyIn0.mbtU37ClKoNouPzif2wXY62XpQv2qHxbtcZoVlsbDXtnozHB6xenNtQQ2R4d3mjjWgFm7TzVImzlx-bD1_bn6Q'
      }
    }
  })
  console.log(`Credential verified`, result.verified)
return

  const verifyResult = await agent.verifyPresentation({
    // presentation: {
    //   // "verifiableCredential": [
    //   //   {
    //   //     "credentialSubject": {
    //   //       "you": "123",
    //   //       "id": "did:web:example.com"
    //   //     },
    //   //     "issuer": {
    //   //       "id": "did:ethr:sepolia:0x03c4eb9c2a869a10ab77da76219727261156a6b21ed1e6736412afe10f53465eb1"
    //   //     },
    //   //     "type": [
    //   //       "VerifiableCredential",
    //   //       "PresentationTestCredential"
    //   //     ],
    //   //     "@context": [
    //   //       "https://www.w3.org/2018/credentials/v1"
    //   //     ],
    //   //     "issuanceDate": "2024-10-23T07:54:13.000Z",
    //   //     "proof": {
    //   //       "type": "JwtProof2020",
    //   //       "jwt": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiUHJlc2VudGF0aW9uVGVzdENyZWRlbnRpYWwiXSwiY3JlZGVudGlhbFN1YmplY3QiOnsieW91IjoiUm9jayJ9fSwic3ViIjoiZGlkOndlYjpleGFtcGxlLmNvbSIsIm5iZiI6MTcyOTY3MDA1MywiaXNzIjoiZGlkOmV0aHI6c2Vwb2xpYToweDAyZTdiZjI0YmI4Y2ZlYzRjZTY1NWI1MDJjYjFjNjYwNjQ3MDdlMmYwZjM5NzgxNWFhYjA3ZTg0MWQ5MTUxM2ExNyJ9.99_3J-myWksaNYjPhT30lF6NF60yvpUQXAhdXLKxDCgnM-YtH_ci7NK1YLgPO4_PzPPYpC5naCLZ4VSQfBQvcA"
    //   //     }
    //   //   }
    //   // ],
    //   "holder": "did:ethr:sepolia:0x03c4eb9c2a869a10ab77da76219727261156a6b21ed1e6736412afe10f53465eb1",
    //   // "type": [
    //   //   "VerifiablePresentation",
    //   //   "Test"
    //   // ],
    //   "@context": [
    //     "https://www.w3.org/2018/credentials/v1"
    //   ],
    //   // "issuanceDate": "2024-10-23T07:48:47.000Z",
    //   "proof": {
    //     "type": "JwtProof2020",
    //     "jwt": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2cCI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVQcmVzZW50YXRpb24iLCJUZXN0Il0sInZlcmlmaWFibGVDcmVkZW50aWFsIjpbImV5SmhiR2NpT2lKRlV6STFOa3NpTENKMGVYQWlPaUpLVjFRaWZRLmV5SjJZeUk2ZXlKQVkyOXVkR1Y0ZENJNld5Sm9kSFJ3Y3pvdkwzZDNkeTUzTXk1dmNtY3ZNakF4T0M5amNtVmtaVzUwYVdGc2N5OTJNU0pkTENKMGVYQmxJanBiSWxabGNtbG1hV0ZpYkdWRGNtVmtaVzUwYVdGc0lpd2lWR1Z6ZEVOeVpXUmxiblJwWVd3aVhTd2lZM0psWkdWdWRHbGhiRk4xWW1wbFkzUWlPbnNpZVc5MUlqb2lVbTlqYXlKOWZTd2ljM1ZpSWpvaVpHbGtPbmRsWWpwbGVHRnRjR3hsTG1OdmJTSXNJbTVpWmlJNk1UY3lPVFkyT1RnMk9Td2lhWE56SWpvaVpHbGtPbVYwYUhJNmMyVndiMnhwWVRvd2VEQXlaVGRpWmpJMFltSTRZMlpsWXpSalpUWTFOV0kxTURKallqRmpOall3TmpRM01EZGxNbVl3WmpNNU56Z3hOV0ZoWWpBM1pUZzBNV1E1TVRVeE0yRXhOeUo5Lm9ad0x2TnRKbG1FdElWdDNZSWxtbWh2T050OUZQaHdYYVBsV21nM1p1NHNlSjZERDRLQzhLQjZmOXBzWFZrZFZZVXpzakVYR21Pb2tSaEhjRlJ6dTRRIl19LCJuYmYiOjE3Mjk2Njk4NjksImlzcyI6ImRpZDpldGhyOnNlcG9saWE6MHgwMmU3YmYyNGJiOGNmZWM0Y2U2NTViNTAyY2IxYzY2MDY0NzA3ZTJmMGYzOTc4MTVhYWIwN2U4NDFkOTE1MTNhMTcifQ.0BmXlMwpeuquIP9FPVoijvhwHwy3suZKJUCsYSf4OWZv61p2abT8PcO2Dt5AtcuTalQRbXAa7no_Ebhspr-Fxg"
    //   }
    // }
    presentation: {
      "verifiableCredential": [
        {
          "credentialSubject": {
            "cardNumber": "123123124egnergnerjgnergnejrnj112313224",
            "cardName": "Credit card",
            "id": "did:ethr:sepolia:0x029e439b630ebb250a63a008d7b75c3e954cccd8dcf63583d152b35b0c04cbd210"
          },
          "issuer": {
            "id": "did:ethr:sepolia:0x029e439b630ebb250a63a008d7b75c3e954cccd8dcf63583d152b35b0c04cbd210"
          },
          "type": [
            "VerifiableCredential",
            "PresentationTestCredential2"
          ],
          "@context": [
            "https://www.w3.org/2018/credentials/v1"
          ],
          "issuanceDate": "2024-10-25T03:44:02.000Z",
          "proof": {
            "type": "JwtProof2020",
            "jwt": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiUHJlc2VudGF0aW9uVGVzdENyZWRlbnRpYWwyIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImNhcmROdW1iZXIiOiIxMjMxMjMxMjQxMjQiLCJjYXJkTmFtZSI6IkNyZWRpdCBjYXJkIn19LCJzdWIiOiJkaWQ6ZXRocjpzZXBvbGlhOjB4MDI5ZTQzOWI2MzBlYmIyNTBhNjNhMDA4ZDdiNzVjM2U5NTRjY2NkOGRjZjYzNTgzZDE1MmIzNWIwYzA0Y2JkMjEwIiwibmJmIjoxNzI5ODI3ODQyLCJpc3MiOiJkaWQ6ZXRocjpzZXBvbGlhOjB4MDI5ZTQzOWI2MzBlYmIyNTBhNjNhMDA4ZDdiNzVjM2U5NTRjY2NkOGRjZjYzNTgzZDE1MmIzNWIwYzA0Y2JkMjEwIn0.qJo29IyKAlLmTpSAl_SJZlt5AYgfkYjuX_WRdiMCZc0hLaYtqvORCnmkmr9XRuiCIT55jdFcLl6ymvM6nOmLRw"
          }
        }
      ],
      "holder": "did:ethr:sepolia:0x029e439b630ebb250a63a008d7b75c3e954cccd8dcf63583d152b35b0c04cbd210",
      "type": [
        "VerifiablePresentation",
        "PresentationTestCredential"
      ],
      "@context": [
        "https://www.w3.org/2018/credentials/v1"
      ],
      "issuanceDate": "2024-10-25T03:44:02.000Z",
      "proof": {
        "type": "JwtProof2020",
        "jwt": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2cCI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVQcmVzZW50YXRpb24iLCJQcmVzZW50YXRpb25UZXN0Q3JlZGVudGlhbCJdLCJ2ZXJpZmlhYmxlQ3JlZGVudGlhbCI6WyJleUpoYkdjaU9pSkZVekkxTmtzaUxDSjBlWEFpT2lKS1YxUWlmUS5leUoyWXlJNmV5SkFZMjl1ZEdWNGRDSTZXeUpvZEhSd2N6b3ZMM2QzZHk1M015NXZjbWN2TWpBeE9DOWpjbVZrWlc1MGFXRnNjeTkyTVNKZExDSjBlWEJsSWpwYklsWmxjbWxtYVdGaWJHVkRjbVZrWlc1MGFXRnNJaXdpVUhKbGMyVnVkR0YwYVc5dVZHVnpkRU55WldSbGJuUnBZV3d5SWwwc0ltTnlaV1JsYm5ScFlXeFRkV0pxWldOMElqcDdJbU5oY21ST2RXMWlaWElpT2lJeE1qTXhNak14TWpReE1qUWlMQ0pqWVhKa1RtRnRaU0k2SWtOeVpXUnBkQ0JqWVhKa0luMTlMQ0p6ZFdJaU9pSmthV1E2WlhSb2NqcHpaWEJ2YkdsaE9qQjRNREk1WlRRek9XSTJNekJsWW1JeU5UQmhOak5oTURBNFpEZGlOelZqTTJVNU5UUmpZMk5rT0dSalpqWXpOVGd6WkRFMU1tSXpOV0l3WXpBMFkySmtNakV3SWl3aWJtSm1Jam94TnpJNU9ESTNPRFF5TENKcGMzTWlPaUprYVdRNlpYUm9janB6WlhCdmJHbGhPakI0TURJNVpUUXpPV0kyTXpCbFltSXlOVEJoTmpOaE1EQTRaRGRpTnpWak0yVTVOVFJqWTJOa09HUmpaall6TlRnelpERTFNbUl6TldJd1l6QTBZMkprTWpFd0luMC5xSm8yOUl5S0FsTG1UcFNBbF9TSlpsdDVBWWdma1lqdVhfV1JkaU1DWmMwaExhWXRxdk9SQ25ta21yOVhSdWlDSVQ1NWpkRmNMbDZ5bXZNNm5PbUxSdyJdfSwibmJmIjoxNzI5ODI3ODQyLCJpc3MiOiJkaWQ6ZXRocjpzZXBvbGlhOjB4MDI5ZTQzOWI2MzBlYmIyNTBhNjNhMDA4ZDdiNzVjM2U5NTRjY2NkOGRjZjYzNTgzZDE1MmIzNWIwYzA0Y2JkMjEwIn0.nAxQ-2HcFaFvE4ISiC58MIl18B_KdPPfAOJhfsIAsb9hkXnjIzaRNWEze2gogO2QoTkPRykQU38jfok5T0cIeg"
      }
    }
  })
  console.log('verifyResult:', JSON.stringify(verifyResult));
}

main().catch(console.log)