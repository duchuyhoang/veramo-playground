import {
  IAgentPlugin,
  IDataStore,
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
} from '@veramo/core-types'
import { schema } from '@veramo/core-types'
import { Message, Presentation, Claim } from '@veramo/data-store';
import { createMessage, createMessageEntity } from '../entities/message'
import { createCredentialEntity, Credential } from '../entities/credential'
import { createPresentationEntity } from '../entities/presentation'
import { DataSource } from 'typeorm'
import { OrPromise } from '@veramo/utils'
import { getConnectedDb } from '../data-storage/utils';

export class DataStorageAgentPlugin implements IAgentPlugin {
  readonly methods: IDataStore
  readonly schema = schema.IDataStore
  private dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    this.dbConnection = dbConnection

    this.methods = {
      dataStoreSaveMessage: this.dataStoreSaveMessage.bind(this),
      dataStoreGetMessage: this.dataStoreGetMessage.bind(this),
      dataStoreDeleteMessage: this.dataStoreDeleteMessage.bind(this),
      dataStoreDeleteVerifiableCredential: this.dataStoreDeleteVerifiableCredential.bind(this),
      dataStoreSaveVerifiableCredential: this.dataStoreSaveVerifiableCredential.bind(this),
      dataStoreGetVerifiableCredential: this.dataStoreGetVerifiableCredential.bind(this),
      dataStoreSaveVerifiablePresentation: this.dataStoreSaveVerifiablePresentation.bind(this),
      dataStoreGetVerifiablePresentation: this.dataStoreGetVerifiablePresentation.bind(this),
    }
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
