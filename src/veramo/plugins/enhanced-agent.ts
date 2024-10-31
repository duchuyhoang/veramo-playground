import {
  ContextType,
  CredentialStatusReference,
  DateType,
  DIDResolutionOptions,
  IAgentContext,
  IAgentPlugin,
  ICreateVerifiablePresentationArgs,
  ICredentialPlugin,
  ICredentialStatusVerifier,
  IIdentifier,
  IKey,
  IKeyManager,
  IPluginMethodMap,
  IssuerAgentContext,
  IVerifyPresentationArgs,
  IVerifyResult,
  ProofFormat,
  VerifiableCredential,
  VerifiablePresentation,
  VerificationPolicies,
  VerifierAgentContext,
  W3CVerifiableCredential,
  W3CVerifiablePresentation,
} from "@veramo/core";
import { Resolvable } from 'did-resolver'
import canonicalize from 'canonicalize'
import {
  createVerifiablePresentationJwt,
  normalizePresentation,
  verifyCredential as verifyCredentialJWT,
  verifyPresentation as verifyPresentationJWT,
} from 'did-jwt-vc'
import { decodeJWT, } from 'did-jwt'
import {
  asArray,
  removeDIDParameters,
  isDefined,
  MANDATORY_CREDENTIAL_CONTEXT,
  processEntryToArray,
  OrPromise,
} from '@veramo/utils'
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from "typeorm";

import { JsonSchemaValidator } from '../lib/json-schema-validator.ts';
import { createCredentialEntity, Credential } from "../entities/credential";

const byteEncoder = new TextEncoder();

const enum DocumentFormat {
  JWT,
  JSONLD,
  EIP712,
  BBS,
}

function detectDocumentType(document: W3CVerifiableCredential | W3CVerifiablePresentation): DocumentFormat {
  if (typeof document === 'string' || (<VerifiableCredential>document)?.proof?.jwt) return DocumentFormat.JWT
  if ((<VerifiableCredential>document)?.proof?.type === 'EthereumEip712Signature2021')
    return DocumentFormat.EIP712
  if ((<VerifiableCredential>document)?.proof?.type === 'BbsBlsSignature2020')
    return DocumentFormat.BBS
  return DocumentFormat.JSONLD
}

function pickSigningKey(identifier: IIdentifier, keyRef?: string): IKey {
  let key: IKey | undefined

  if (!keyRef) {
    key = identifier.keys.find(
      (k) => k.type === 'Secp256k1' || k.type === 'Ed25519' || k.type === 'Secp256r1',
    )
    if (!key) throw Error('key_not_found: No signing key for ' + identifier.did)
  } else {
    key = identifier.keys.find((k) => k.kid === keyRef)
    if (!key) throw Error('key_not_found: No signing key for ' + identifier.did + ' with kid ' + keyRef)
  }

  return key as IKey
}

function pickAlgorithm(keyType: string) {
  let alg = 'ES256K'
  if (keyType === 'Ed25519') {
    alg = 'EdDSA'
  } else if (keyType === 'Secp256r1') {
    alg = 'ES256'
  }
  return alg;
}

function wrapSigner(
  context: IAgentContext<Pick<IKeyManager, 'keyManagerSign'>>,
  key: IKey,
  algorithm?: string,
) {
  return async (data: string | Uint8Array): Promise<string> => {
    const result = await context.agent.keyManagerSign({ keyRef: key.kid, data: <string>data, algorithm })
    return result
  }
}

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

async function isRevoked(
  credential: VerifiableCredential,
  context: IAgentContext<ICredentialStatusVerifier>,
): Promise<boolean> {
  if (!credential.credentialStatus) return false

  if (typeof context.agent.checkCredentialStatus === 'function') {
    const status = await context.agent.checkCredentialStatus({ credential })
    return status?.revoked == true || status?.verified === false
  }

  throw new Error(
    `invalid_setup: The credential status can't be verified because there is no ICredentialStatusVerifier plugin installed.`,
  )
}

async function getConnectedDb(dbConnection: OrPromise<DataSource>): Promise<DataSource> {
  if (dbConnection instanceof Promise) {
    return await dbConnection
  }
  if (!dbConnection.isInitialized) {
    return await (<DataSource>dbConnection).initialize();
  }
  return dbConnection;
}

type IssuerType = { id: string;[x: string]: any }
type CredentialSubject = {
  [x: string]: any
}

interface CredentialPayload {
  issuer: IssuerType;
  credentialSubject: CredentialSubject;
  type?: string[]
  '@context'?: ContextType;
  issuanceDate?: DateType;
  expirationDate?: DateType;
  credentialStatus?: CredentialStatusReference;
}


interface IIssueCredentialRequest {
  schemaUrl: string;
  holder: string;
  credential: CredentialPayload;
  proofFormat?: ProofFormat;

  /**
   * Any other options that can be forwarded to the lower level libraries
   */
  [x: string]: any
}

interface IRevokeCredentialRequest {
  issuerDID: string;
  credentialId: string;
}

interface IRevocationResult {
  revoked: boolean
  error?: string;
}

interface IVerifyCredentialRequest {
  credential: VerifiableCredential;
  policies?: VerificationPolicies;
  resolutionOptions?: DIDResolutionOptions;
}

interface IStoreVerifiableCredentialRequest {
  verifiableCredential: VerifiableCredential;
}

interface IStoreVerifiableCredentialResponse {
  id: string;
  hash: string;
}

export interface IEnhancedAgentPlugin extends IPluginMethodMap {
  issueVerifiableCredential: (
    request: IIssueCredentialRequest,
    context: IAgentContext<ICredentialPlugin>
  ) => Promise<VerifiableCredential>;
  revokeVerifiableCredential: (
    request: IRevokeCredentialRequest,
    context: IAgentContext<ICredentialPlugin>,
  ) => Promise<IRevocationResult>;
  verifyVerifiableCredential: (
    request: IVerifyCredentialRequest,
    context: IAgentContext<ICredentialPlugin>,
  ) => Promise<IVerifyResult>;
  storeVerifiableCredential: (
    request: IStoreVerifiableCredentialRequest,
    context: IAgentContext<ICredentialPlugin>,
  ) => Promise<IStoreVerifiableCredentialResponse>;
  // createVP: (
  //   args: ICreateVerifiablePresentationArgs,
  //   context: IssuerAgentContext,
  // ) => Promise<VerifiablePresentation>;
  // verifyVP: (
  //   payload: IVerifyPresentationArgs,
  //   context: VerifierAgentContext,
  // ) => Promise<IVerifyResult>;
}

export class EnhancedAgentPlugin implements IAgentPlugin {
  readonly methods: IEnhancedAgentPlugin;
  private dbConnection: OrPromise<DataSource>;

  constructor({ dbConnection }: { dbConnection: OrPromise<DataSource> }) {
    this.dbConnection = dbConnection;

    this.methods = {
      issueVerifiableCredential: this.issueVerifiableCredential.bind(this),
      revokeVerifiableCredential: this.revokeVerifiableCredential.bind(this),
      verifyVerifiableCredential: this.verifyVerifiableCredential.bind(this),
      storeVerifiableCredential: this.storeVerifiableCredential.bind(this),
      // createVP: this.createVerifiablePresentation.bind(this),
      // verifyVC: this.verifyCredential.bind(this),
      // verifyVP: this.verifyPresentation.bind(this),
    };
  }

  public async issueVerifiableCredential(
    request: IIssueCredentialRequest,
    context: IAgentContext<ICredentialPlugin>
  ): Promise<VerifiableCredential> {
    const { schemaUrl, proofFormat, holder, credential, ...otherOptions } = request;

    const schema = await loadJsonLd(schemaUrl);

    const credentialId = uuidv4();
    const credentialContext = processEntryToArray(credential['@context'], MANDATORY_CREDENTIAL_CONTEXT);
    const credentialSchema = [
      {
        id: schemaUrl,
        // -- TODO -- Detect schema type
        type: 'JsonSchemaValidator2018',
      },
    ];
    const credentialSubject = {
      id: holder,
      ...credential.credentialSubject,
    };
    const issuanceDate = credential.issuanceDate || new Date().toISOString();
    // for checking revocation
    const credentialStatus = {
      ...credential.credentialStatus,
      id: credentialId,
      type: 'RevocationList2020Status',
    };

    const credentialPayload = {
      ...credential,
      id: credentialId,
      '@context': credentialContext,
      type: credential.type,
      credentialSchema,
      credentialSubject,
      issuanceDate,
      credentialStatus,
    };

    const encodedCred = byteEncoder.encode(JSON.stringify(credentialPayload));
    const encodedSchema = byteEncoder.encode(JSON.stringify(schema));
    await new JsonSchemaValidator().validate(encodedCred, encodedSchema);

    // -- TODO -- check holder

    const verifiableCredential = await context.agent.createVerifiableCredential({
      credential: credentialPayload,
      proofFormat: proofFormat || 'jwt',
      fetchRemoteContexts: true,
    });

    return verifiableCredential;
  }

  public async revokeVerifiableCredential(
    request: IRevokeCredentialRequest,
    context: IAgentContext<ICredentialPlugin>,
  ): Promise<IRevocationResult> {
    // -- TODO -- find, validate & update revokedAt
    return {
      revoked: false,
      error: 'Fail',
    };
  }

  public async verifyVerifiableCredential(
    request: IVerifyCredentialRequest,
    context: IAgentContext<ICredentialPlugin>,
  ): Promise<IVerifyResult> {
    let {
      credential,
      policies,
      resolutionOptions,
      // ...otherOptions
    } = request
    let verifiedCredential: VerifiableCredential;
    let verificationResult: IVerifyResult = { verified: false };

    const type: DocumentFormat = detectDocumentType(credential)
    if (type == DocumentFormat.JWT) {
      let jwt: string = typeof credential === 'string' ? credential : credential.proof.jwt

      const resolver = {
        resolve: (didUrl: string) =>
          context.agent.resolveDid({
            didUrl,
            options: resolutionOptions,
          }),
      } as Resolvable
      try {
        // needs broader credential as well to check equivalence with jwt
        verificationResult = await verifyCredentialJWT(jwt, resolver, {
          // ...otherOptions,
          policies: {
            ...policies,
            nbf: policies?.nbf ?? policies?.issuanceDate,
            iat: policies?.iat ?? policies?.issuanceDate,
            exp: policies?.exp ?? policies?.expirationDate,
            aud: policies?.aud ?? policies?.audience,
          },
        })
        verifiedCredential = verificationResult.verifiableCredential

        // if credential was presented with other fields, make sure those fields match what's in the JWT
        if (typeof credential !== 'string' && credential.proof.type === 'JwtProof2020') {
          const credentialCopy = JSON.parse(JSON.stringify(credential))
          delete credentialCopy.proof.jwt

          const verifiedCopy = JSON.parse(JSON.stringify(verifiedCredential))
          delete verifiedCopy.proof.jwt

          if (canonicalize(credentialCopy) !== canonicalize(verifiedCopy)) {
            verificationResult.verified = false
            verificationResult.error = new Error(
              'invalid_credential: Credential JSON does not match JWT payload',
            )
          }
        }
      } catch (e: any) {
        let { message, errorCode } = e
        return {
          verified: false,
          error: {
            message,
            errorCode: errorCode ? errorCode : message.split(':')[0],
          },
        }
      }
    } else if (type == DocumentFormat.EIP712) {
      if (typeof context.agent.verifyCredentialEIP712 !== 'function') {
        throw new Error(
          'invalid_setup: your agent does not seem to have ICredentialIssuerEIP712 plugin installed',
        )
      }

      try {
        const result = await context.agent.verifyCredentialEIP712(request)
        if (result) {
          verificationResult = {
            verified: true,
          }
        } else {
          verificationResult = {
            verified: false,
            error: {
              message: 'invalid_signature: The signature does not match any of the issuer signing keys',
              errorCode: 'invalid_signature',
            },
          }
        }
        verifiedCredential = <VerifiableCredential>credential
      } catch (e: any) {
        // debug('encountered error while verifying EIP712 credential: %o', e)
        const { message, errorCode } = e
        return {
          verified: false,
          error: {
            message,
            errorCode: errorCode ? errorCode : e.message.split(':')[0],
          },
        };
      }
    } else if (type == DocumentFormat.JSONLD) {
      if (typeof context.agent.verifyCredentialLD !== 'function') {
        throw new Error(
          'invalid_setup: your agent does not seem to have ICredentialIssuerLD plugin installed',
        );
      }

      verificationResult = await context.agent.verifyCredentialLD({ ...request });
      verifiedCredential = <VerifiableCredential>credential
    } else if (type == DocumentFormat.BBS) {
      // -- TODO -- verify with BBS
      verifiedCredential = {} as any;
      verificationResult.verified = true;
    } else {
      throw new Error('invalid_argument: Unknown credential type.')
    }

    if (policies?.credentialStatus !== false && (await isRevoked(verifiedCredential, context as any))) {
      verificationResult = {
        verified: false,
        error: {
          message: 'revoked: The credential was revoked by the issuer',
          errorCode: 'revoked',
        },
      }
    }

    return verificationResult;
  }

  public async storeVerifiableCredential(
    request: IStoreVerifiableCredentialRequest,
    context: IAgentContext<ICredentialPlugin>,
  ): Promise<IStoreVerifiableCredentialResponse> {
    const connection = await getConnectedDb(this.dbConnection);
    const verifiableCredential = await connection
      .getRepository(Credential)
      .save(createCredentialEntity(request.verifiableCredential));
    return {
      id: verifiableCredential.id || '',
      hash: verifiableCredential.hash,
    };
  }

  async createVerifiablePresentation(
    args: ICreateVerifiablePresentationArgs,
    context: IssuerAgentContext,
  ): Promise<VerifiablePresentation> {
    let {
      presentation,
      proofFormat,
      domain,
      challenge,
      removeOriginalFields,
      keyRef,
      // save,
      now,
      ...otherOptions
    } = args
    const presentationContext: string[] = processEntryToArray(
      args?.presentation?.['@context'],
      MANDATORY_CREDENTIAL_CONTEXT,
    )
    const presentationType = processEntryToArray(args?.presentation?.type, 'VerifiablePresentation')
    presentation = {
      ...presentation,
      '@context': presentationContext,
      type: presentationType,
    }

    if (!isDefined(presentation.holder)) {
      throw new Error('invalid_argument: presentation.holder must not be empty')
    }

    if (presentation.verifiableCredential) {
      presentation.verifiableCredential = presentation.verifiableCredential.map((cred) => {
        // map JWT credentials to their canonical form
        if (typeof cred !== 'string' && cred.proof.jwt) {
          return cred.proof.jwt
        } else {
          return cred
        }
      });
    }

    const holder = removeDIDParameters(presentation.holder)

    let identifier: IIdentifier
    try {
      identifier = await context.agent.didManagerGet({ did: holder })
    } catch (e) {
      throw new Error('invalid_argument: presentation.holder must be a DID managed by this agent')
    }
    const key = pickSigningKey(identifier, keyRef)

    let verifiablePresentation: VerifiablePresentation

    if (proofFormat === 'lds') {
      if (typeof context.agent.createVerifiablePresentationLD === 'function') {
        verifiablePresentation = await context.agent.createVerifiablePresentationLD({ ...args, presentation })
      } else {
        throw new Error(
          'invalid_setup: your agent does not seem to have ICredentialIssuerLD plugin installed',
        )
      }
    } else if (proofFormat === 'EthereumEip712Signature2021') {
      if (typeof context.agent.createVerifiablePresentationEIP712 === 'function') {
        verifiablePresentation = await context.agent.createVerifiablePresentationEIP712({
          ...args,
          presentation,
        })
      } else {
        throw new Error(
          'invalid_setup: your agent does not seem to have ICredentialIssuerEIP712 plugin installed',
        )
      }
    } else if (proofFormat === 'jwt') {
      // only add issuanceDate for JWT
      now = typeof now === 'number' ? new Date(now * 1000) : now
      if (!Object.getOwnPropertyNames(presentation).includes('issuanceDate')) {
        presentation.issuanceDate = (now instanceof Date ? now : new Date()).toISOString()
      }

      // debug('Signing VP with', identifier.did)
      const alg = pickAlgorithm(key.type);

      const signer = wrapSigner(context, key, alg)
      const jwt = await createVerifiablePresentationJwt(
        presentation as any,
        { did: identifier.did, signer, alg },
        { removeOriginalFields, challenge, domain, ...otherOptions },
      )
      //FIXME: flagging this as a potential privacy leak.
      // debug(jwt)
      console.log(11111, normalizePresentation(jwt));

      verifiablePresentation = normalizePresentation(jwt)
    } else {
      throw new Error('invalid_argument: Unknown proofFormat type.');
    }
    // if (save) {
    //   await context.agent.dataStoreSaveVerifiablePresentation({ verifiablePresentation })
    // }
    return verifiablePresentation
  }

  public async verifyPresentation(args: IVerifyPresentationArgs, context: VerifierAgentContext): Promise<IVerifyResult> {
    let { presentation, domain, challenge, fetchRemoteContexts, policies, ...otherOptions } = args
    const type: DocumentFormat = detectDocumentType(presentation)
    if (type === DocumentFormat.JWT) {
      // JWT
      let jwt: string
      if (typeof presentation === 'string') {
        jwt = presentation
      } else {
        jwt = presentation.proof.jwt
      }
      const resolver = {
        resolve: (didUrl: string) =>
          context.agent.resolveDid({
            didUrl,
            options: otherOptions?.resolutionOptions,
          }),
      } as Resolvable

      let audience = domain
      if (!audience) {
        const { payload } = await decodeJWT(jwt)
        if (payload.aud) {
          // automatically add a managed DID as audience if one is found
          const intendedAudience = asArray(payload.aud)
          const managedDids = await context.agent.didManagerFind()
          const filtered = managedDids.filter((identifier) => intendedAudience.includes(identifier.did))
          if (filtered.length > 0) {
            audience = filtered[0].did
          }
        }
      }

      try {
        return await verifyPresentationJWT(jwt, resolver, {
          challenge,
          domain,
          audience,
          policies: {
            ...policies,
            nbf: policies?.nbf ?? policies?.issuanceDate,
            iat: policies?.iat ?? policies?.issuanceDate,
            exp: policies?.exp ?? policies?.expirationDate,
            aud: policies?.aud ?? policies?.audience,
          },
          ...otherOptions,
        })
      } catch (e: any) {
        let { message, errorCode } = e
        return {
          verified: false,
          error: {
            message,
            errorCode: errorCode ? errorCode : message.split(':')[0],
          },
        }
      }
    } else if (type === DocumentFormat.EIP712) {
      // JSON-LD
      if (typeof context.agent.verifyPresentationEIP712 !== 'function') {
        throw new Error(
          'invalid_setup: your agent does not seem to have ICredentialIssuerEIP712 plugin installed',
        )
      }
      try {
        const result = await context.agent.verifyPresentationEIP712(args)
        if (result) {
          return {
            verified: true,
          }
        } else {
          return {
            verified: false,
            error: {
              message: 'invalid_signature: The signature does not match any of the issuer signing keys',
              errorCode: 'invalid_signature',
            },
          }
        }
      } catch (e: any) {
        const { message, errorCode } = e
        return {
          verified: false,
          error: {
            message,
            errorCode: errorCode ? errorCode : e.message.split(':')[0],
          },
        }
      }
    } else if (type === DocumentFormat.BBS) {
      return {
        verified: true,
      }
    } else {
      // JSON-LD
      if (typeof context.agent.verifyPresentationLD === 'function') {
        const result = await context.agent.verifyPresentationLD({ ...args, now: policies?.now })
        return result
      } else {
        throw new Error(
          'invalid_setup: your agent does not seem to have ICredentialIssuerLD plugin installed',
        )
      }
    }
  }
}
