import {
  IAgentPlugin,
  IDataStoreDeleteVerifiableCredentialArgs,
  IDataStoreGetMessageArgs,
  IDataStoreDeleteMessageArgs,
  IDataStoreGetVerifiableCredentialArgs,
  IDataStoreGetVerifiablePresentationArgs,
  IDataStoreSaveMessageArgs,
  IDataStoreSaveVerifiableCredentialArgs,
  IDataStoreSaveVerifiablePresentationArgs,
  IMessage,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core-types';
import { schema } from '@veramo/core-types';
import { Message } from '@veramo/data-store';
import { OrPromise } from '@veramo/utils';
import { IPluginMethodMap } from '@veramo/core';
import { DataSource, In, IsNull, MoreThan } from 'typeorm';

import { getConnectedDb } from '../data-storage/utils';
import { createMessage, createMessageEntity } from '../entities/message';
import { createCredentialEntity, Credential } from '../entities/credential';
import { Claim } from '../entities/claim';
import { createPresentationEntity, Presentation } from '../entities/presentation';

interface IGetVerifiableCredentialsRequest {
  credentialIds?: string[];
  holder?: string;
}

interface IGetVerifiableCredentialRequest {
  credentialId: string;
}

interface IStoreVerifiableCredentialRequest {
  verifiableCredential: VerifiableCredential;
}

interface IStoreVerifiableCredentialResponse {
  id: string;
  hash: string;
  issuerId: string;
}

interface IDeleteVerifiableCredentialRequest {
  credentialId: string;
}

interface IStoreVerifiablePresentationRequest {
  verifiablePresentation: VerifiablePresentation;
}

interface IStoreVerifiablePresentationResponse {
  id: string;
  hash: string;
  verifierId: string;
}


export interface IDataStore extends IPluginMethodMap {
  getVerifiableCredentials: (request: IGetVerifiableCredentialsRequest) =>
    Promise<VerifiableCredential[]>;

  getVerifiableCredential: (request: IGetVerifiableCredentialRequest) =>
    Promise<VerifiableCredential>;

  storeVerifiableCredential: (request: IStoreVerifiableCredentialRequest) =>
    Promise<IStoreVerifiableCredentialResponse>;

  deleteVerifiableCredential: (request: IDeleteVerifiableCredentialRequest) =>
    Promise<boolean>;

  storeVerifiablePresentation: (request: IStoreVerifiablePresentationRequest) =>
    Promise<IStoreVerifiablePresentationResponse>;

  // /**
  //  * Saves message to the data store
  //  * @param args - message
  //  * @returns a promise that resolves to the id of the message
  //  */
  // dataStoreSaveMessage(args: IDataStoreSaveMessageArgs): Promise<string>

  // /**
  //  * Gets message from the data store
  //  * @param args - arguments for getting message
  //  * @returns a promise that resolves to the message
  //  */
  // dataStoreGetMessage(args: IDataStoreGetMessageArgs): Promise<IMessage>

  // /**
  //  * Deletes message from the data store
  //  * @param args - arguments for deleting message
  //  * @returns a promise that resolves to a boolean
  //  */
  // dataStoreDeleteMessage(args: IDataStoreDeleteMessageArgs): Promise<boolean>

  // /**
  //  * Saves verifiable credential to the data store
  //  * @param args - verifiable credential
  //  * @returns a promise that resolves to the hash of the VerifiableCredential
  //  */
  // dataStoreSaveVerifiableCredential(args: IDataStoreSaveVerifiableCredentialArgs): Promise<string>

  // /**
  //  * Deletes verifiable credential from the data store
  //  * @param args - verifiable credential
  //  * @returns a promise that resolves to a boolean
  //  */
  // dataStoreDeleteVerifiableCredential(args: IDataStoreDeleteVerifiableCredentialArgs): Promise<boolean>

  // /**
  //  * Gets verifiable credential from the data store
  //  * @param args - arguments for getting verifiable credential
  //  * @returns a promise that resolves to the verifiable credential
  //  */
  // dataStoreGetVerifiableCredential(args: IDataStoreGetVerifiableCredentialArgs): Promise<VerifiableCredential>

  // /**
  //  * Saves verifiable presentation to the data store
  //  * @param args - verifiable presentation
  //  * @returns a promise that resolves to the hash of the VerifiablePresentation
  //  */
  // dataStoreSaveVerifiablePresentation(args: IDataStoreSaveVerifiablePresentationArgs): Promise<string>

  // /**
  //  * Gets verifiable presentation from the data store
  //  * @param args - arguments for getting Verifiable Presentation
  //  * @returns a promise that resolves to the Verifiable Presentation
  //  */
  // dataStoreGetVerifiablePresentation(
  //   args: IDataStoreGetVerifiablePresentationArgs,
  // ): Promise<VerifiablePresentation>
}


export class DataStorageAgentPlugin implements IAgentPlugin {
  readonly methods: IDataStore
  readonly schema = schema.IDataStore
  private dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    this.dbConnection = dbConnection

    this.methods = {
      getVerifiableCredentials: this.getVerifiableCredentials.bind(this),
      getVerifiableCredential: this.getVerifiableCredential.bind(this),
      storeVerifiableCredential: this.storeVerifiableCredential.bind(this),
      deleteVerifiableCredential: this.deleteVerifiableCredential.bind(this),
      storeVerifiablePresentation: this.storeVerifiablePresentation.bind(this),
      // dataStoreSaveMessage: this.dataStoreSaveMessage.bind(this),
      // dataStoreGetMessage: this.dataStoreGetMessage.bind(this),
      // dataStoreDeleteMessage: this.dataStoreDeleteMessage.bind(this),
      // dataStoreDeleteVerifiableCredential: this.dataStoreDeleteVerifiableCredential.bind(this),
      // dataStoreSaveVerifiableCredential: this.dataStoreSaveVerifiableCredential.bind(this),
      // dataStoreGetVerifiableCredential: this.dataStoreGetVerifiableCredential.bind(this),
      // dataStoreSaveVerifiablePresentation: this.dataStoreSaveVerifiablePresentation.bind(this),
      // dataStoreGetVerifiablePresentation: this.dataStoreGetVerifiablePresentation.bind(this),
    }
  }

  async getVerifiableCredentials(
    request: IGetVerifiableCredentialsRequest
  ): Promise<VerifiableCredential[]> {
    const { credentialIds, holder } = request;
    const commonQuery = {
      id: credentialIds ? In(credentialIds) : undefined,
      revoked: false,
      subject: holder ? { did: holder } : undefined
    };
    const credentialEntities = await (await getConnectedDb(this.dbConnection))
      .getRepository(Credential)
      .find({
        where: [
          { ...commonQuery, expirationDate: MoreThan(new Date()) },
          { ...commonQuery, expirationDate: IsNull() },
        ],
      });
    if (credentialIds && credentialEntities.length !== credentialIds.length) {
      throw new Error('not_found or revoked: Verifiable credentials not found or revoked');
    }

    return credentialEntities.map((credentialEntity) => credentialEntity.raw);
  }

  async getVerifiableCredential(
    request: IGetVerifiableCredentialRequest
  ): Promise<VerifiableCredential> {
    const credentialEntity = await (await getConnectedDb(this.dbConnection))
      .getRepository(Credential)
      .findOneBy({ id: request.credentialId });
    if (!credentialEntity) throw new Error('not_found: Verifiable credential not found')

    return credentialEntity.raw;
  }

  async storeVerifiableCredential(
    request: IStoreVerifiableCredentialRequest,
  ): Promise<IStoreVerifiableCredentialResponse> {
    const connection = await getConnectedDb(this.dbConnection);
    const verifiableCredential = await connection
      .getRepository(Credential)
      .save(createCredentialEntity(request.verifiableCredential));
    return {
      id: verifiableCredential.id || '',
      hash: verifiableCredential.hash,
      issuerId: verifiableCredential.issuer.did,
    };
  }

  async deleteVerifiableCredential(
    request: IDeleteVerifiableCredentialRequest
  ): Promise<boolean> {
    const connection = await getConnectedDb(this.dbConnection);
    const verifiableCredential = await connection
      .getRepository(Credential)
      .findOne({ where: { id: request.credentialId }, select: ['hash'] });
    if (!verifiableCredential) {
      throw new Error('Credential not found');
    }

    await Promise.all([
      (await getConnectedDb(this.dbConnection))
        .getRepository(Claim)
        .delete({ credential: { hash: verifiableCredential.hash } }),
      (await getConnectedDb(this.dbConnection))
        .getRepository(Credential)
        .delete(verifiableCredential.hash),
    ]);

    return true;
  }

  async storeVerifiablePresentation(args: IStoreVerifiablePresentationRequest): Promise<IStoreVerifiablePresentationResponse> {
    const verifiablePresentation = await (await getConnectedDb(this.dbConnection))
      .getRepository(Presentation)
      .save(createPresentationEntity(args.verifiablePresentation))
    return {
      id: verifiablePresentation.id || '',
      hash: verifiablePresentation.hash,
      verifierId: (verifiablePresentation.verifier || [])[0]?.did || '',
    };
  }

  async dataStoreSaveMessage(args: IDataStoreSaveMessageArgs): Promise<string> {
    const message = await (await getConnectedDb(this.dbConnection))
      .getRepository(Message)
      .save(createMessageEntity(args.message) as any)
    return message.id
  }

  async dataStoreGetMessage(args: IDataStoreGetMessageArgs): Promise<IMessage> {
    const messageEntity = await (await getConnectedDb(this.dbConnection)).getRepository(Message).findOne({
      where: { id: args.id },
      relations: ['credentials', 'presentations'],
    })
    if (!messageEntity) throw new Error('not_found: Message not found')

    return createMessage(messageEntity as any)
  }

  async dataStoreDeleteMessage(args: IDataStoreDeleteMessageArgs): Promise<boolean> {
    const messageEntity = await (await getConnectedDb(this.dbConnection)).getRepository(Message).findOne({
      where: { id: args.id },
      relations: ['credentials', 'presentations'],
    })
    if (!messageEntity) {
      return false
    }

    await (await getConnectedDb(this.dbConnection)).getRepository(Message).remove(messageEntity)

    return true
  }

  async dataStoreDeleteVerifiableCredential(
    args: IDataStoreDeleteVerifiableCredentialArgs,
  ): Promise<boolean> {
    const credentialEntity = await (await getConnectedDb(this.dbConnection))
      .getRepository(Credential)
      .findOneBy({ hash: args.hash })
    if (!credentialEntity) {
      return false
    }

    const claims = await (await getConnectedDb(this.dbConnection))
      .getRepository(Claim)
      .find({ where: { credential: { hash: credentialEntity.hash } } })

    await (await getConnectedDb(this.dbConnection)).getRepository(Claim).remove(claims)

    await (await getConnectedDb(this.dbConnection)).getRepository(Credential).remove(credentialEntity)

    return true
  }

  async dataStoreSaveVerifiableCredential(args: IDataStoreSaveVerifiableCredentialArgs): Promise<string> {
    const verifiableCredential = await (await getConnectedDb(this.dbConnection))
      .getRepository(Credential)
      .save(createCredentialEntity(args.verifiableCredential))
    return verifiableCredential.hash
  }

  async dataStoreGetVerifiableCredential(
    args: IDataStoreGetVerifiableCredentialArgs,
  ): Promise<VerifiableCredential> {
    const credentialEntity = await (await getConnectedDb(this.dbConnection))
      .getRepository(Credential)
      .findOneBy({ hash: args.hash })
    if (!credentialEntity) throw new Error('not_found: Verifiable credential not found')

    return credentialEntity.raw
  }

  async dataStoreSaveVerifiablePresentation(args: IDataStoreSaveVerifiablePresentationArgs): Promise<string> {
    const verifiablePresentation = await (await getConnectedDb(this.dbConnection))
      .getRepository(Presentation)
      .save(createPresentationEntity(args.verifiablePresentation) as any)
    return verifiablePresentation.hash
  }

  async dataStoreGetVerifiablePresentation(
    args: IDataStoreGetVerifiablePresentationArgs,
  ): Promise<VerifiablePresentation> {
    const presentationEntity = await (await getConnectedDb(this.dbConnection))
      .getRepository(Presentation)
      .findOneBy({ hash: args.hash })
    if (!presentationEntity) throw new Error('not_found: Verifiable presentation not found')

    return presentationEntity.raw
  }
}
