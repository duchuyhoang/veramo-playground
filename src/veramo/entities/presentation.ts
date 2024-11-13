import { VerifiableCredential, VerifiablePresentation } from '@veramo/core-types'

import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm'
import { Identifier } from './identifier.ts'
import { Message } from './message.ts'
import { createCredentialEntity, Credential } from './credential.ts'
import { asArray, computeEntryHash } from '@veramo/utils'
import { normalizeCredential } from 'did-jwt-vc'

/**
 * Represents some common properties of a Verifiable Presentation that are stored in a TypeORM database for querying.
 *
 * @see {@link @veramo/core-types#IDataStoreORM.dataStoreORMGetVerifiablePresentations | dataStoreORMGetVerifiablePresentations} for the interface defining how this can be queried.
 *
 * @see {@link @veramo/data-store#DataStoreORM | DataStoreORM} for the implementation of the query interface.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
@Entity('presentation')
export class Presentation extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  // @ts-ignore
  hash: string;

  // @ts-ignore
  private _raw: IVerifiablePresentation;

  set raw(raw: VerifiablePresentation) {
    this._raw = raw;
    this.hash = computeEntryHash(raw);
  }

  @Column({ type: 'simple-json' })
  get raw(): VerifiablePresentation {
    return this._raw;
  }

  @ManyToOne((type) => Identifier, (identifier) => identifier.issuedPresentations, {
    cascade: ['insert'],
    eager: true,
    onDelete: 'CASCADE',
  })
  // @ts-ignore
  holder: Relation<Identifier>;

  @ManyToMany((type) => Identifier, (identifier) => identifier?.receivedPresentations, {
    cascade: ['insert'],
    eager: true,
    nullable: true,
  })
  @JoinTable()
  // @ts-ignore
  verifier?: Relation<Identifier[]>;

  @Column({ type: 'varchar' })
  id?: string;

  @Column({ type: 'datetime' })
  // @ts-ignore
  issuanceDate: Date;

  @Column({ type: 'datetime', nullable: true })
  expirationDate?: Date | null;

  @Column('simple-array')
  // @ts-ignore
  context: string[];

  @Column('simple-array')
  // @ts-ignore
  type: string[];

  @ManyToMany((type) => Credential, (credential) => credential.presentations, {
    cascade: true,
  })
  @JoinTable()
  // @ts-ignore
  credentials: Relation<Credential[]>;

  @ManyToMany((type) => Message, (message) => message.presentations)
  // @ts-ignore
  messages: Relation<Message[]>;
}

export const createPresentationEntity = (vpi: VerifiablePresentation): Presentation => {
  const vp = vpi
  const presentation = new Presentation()
  presentation.context = asArray(vp['@context'])
  presentation.type = asArray(vp.type || [])
  presentation.id = vp.id

  if (vp.issuanceDate) {
    presentation.issuanceDate = new Date(vp.issuanceDate)
  }

  if (vp.expirationDate) {
    presentation.expirationDate = new Date(vp.expirationDate)
  }

  const holder = new Identifier()
  holder.did = vp.holder
  presentation.holder = holder

  presentation.verifier = asArray(vp.verifier || []).map((verifierDid) => {
    const id = new Identifier()
    id.did = verifierDid
    return id
  })

  presentation.raw = vpi

  presentation.credentials = (vp.verifiableCredential || [])
    .map((cred) => {
      if (typeof cred === 'string') {
        return normalizeCredential(cred)
      } else {
        return <VerifiableCredential>cred
      }
    })
    .map(createCredentialEntity)
  return presentation
}
