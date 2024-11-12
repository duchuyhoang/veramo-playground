import { VerifiableCredential, VerifiablePresentation } from '@veramo/core';

// export interface VerifiablePresentation {
//   id?: string;
//   holder: string;
//   issuanceDate?: string;
//   expirationDate?: string;
//   '@context': string[];
//   type: string[];
//   verifier?: string[];
//   verifiableCredential: VerifiableCredential[];
//   proof: {
//     type?: string;
//     [x: string]: any;
//   };
//   [x: string]: any;
// }

export interface GenericInput {
  request?: {
    // Inspired by Veramo as it's not covered by the DIDComm spec
    issuers?: [{ did: string; url: string }];
    credentialContext?: string;
    credentialType?: string;
    claimType?: string;
    claimValues?: {
      [x: string]: any;
    };
    info?: string;
  };
  credential?: VerifiableCredential;
  presentation?: VerifiablePresentation;
  [x: string]: any;
}

export interface GenericMessage {
  id?: string;
  type?: string;
  from?: string;
  to?: [string];
  createdTime?: number;
  expiresTime?: number;
  threadId?: string;
  body?: {
    request?: {
      // Inspired by Veramo as it's not covered by the DIDComm spec
      issuers?: [{ did: string; url: string }];
      credentialContext?: string;
      credentialType?: string;
      claimType?: string;
      claimValues?: {
        [x: string]: any;
      };
      info?: string;
    };
    credential?: VerifiableCredential;
    presentation?: VerifiablePresentation;
    [x: string]: any;
  };
}

export interface GenericResult {
  success: boolean;
  error?: string;
}

export function isGenericResult(obj: any): obj is GenericResult {
  return obj.success !== undefined;
}

export enum RevocationStatus {
  PENDING = 'pending',
  REVOKED = 'revoked',
  NOT_REVOKED = 'not revoked',
}
