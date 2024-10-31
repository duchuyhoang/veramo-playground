import { VerifiableCredential } from '@veramo/core-types'
import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Relation,
} from 'typeorm'
import { Claim } from './claim.ts';
import { Presentation } from './presentation.ts';
import { Message } from './message.ts';
import { Identifier } from './identifier.ts';
import { asArray, computeEntryHash, extractIssuer } from '@veramo/utils'

@Entity('credential')
export class Credential extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  // @ts-ignore
  hash: string;

  // @ts-ignore
  private _raw: VerifiableCredential;

  set raw(raw: VerifiableCredential) {
    this._raw = raw
    this.hash = computeEntryHash(raw);
  }

  @Column('simple-json')
  get raw(): VerifiableCredential {
    return this._raw;
  }

  @ManyToOne((type) => Identifier, (identifier) => identifier.issuedCredentials, {
    cascade: ['insert'],
    eager: true,
    onDelete: 'CASCADE',
  })
  // @ts-ignore
  issuer: Relation<Identifier>;

  @ManyToOne((type) => Identifier, (identifier) => identifier?.receivedCredentials, {
    cascade: ['insert'],
    eager: true,
  })
  // @ts-ignore
  subject: Relation<Identifier>;

  @Column({ type: 'varchar', unique: true })
  // @ts-ignore
  id?: string;

  @Column({ type: 'datetime' })
  // @ts-ignore
  issuanceDate: Date;

  @Column({ type: 'datetime', nullable: true })
  expirationDate?: Date | null;

  @Column({ type: 'boolean', default: false })
  // @ts-ignore
  revoked: boolean;

  @Column({ type: 'datetime', nullable: true })
  revokedAt?: Date;

  @Column('simple-array')
  // @ts-ignore
  context: string[];

  @Column('simple-array')
  // @ts-ignore
  type: string[];

  @OneToMany((type) => Claim, (claim) => claim.credential, {
    cascade: ['insert'],
  })
  // @ts-ignore
  claims: Relation<Claim[]>;

  @ManyToMany((type) => Presentation, (presentation) => presentation.credentials)
  // @ts-ignore
  presentations: Relation<Presentation[]>;

  @ManyToMany((type) => Message, (message) => message.credentials)
  // @ts-ignore
  messages: Relation<Message[]>;
}

export const createCredentialEntity = (vci: VerifiableCredential): Credential => {
  const vc = vci
  const credential = new Credential()
  credential.context = asArray(vc['@context'])
  credential.type = asArray(vc.type || [])
  credential.id = vc.id

  if (vc.issuanceDate) {
    credential.issuanceDate = new Date(vc.issuanceDate)
  }

  if (vc.expirationDate) {
    credential.expirationDate = new Date(vc.expirationDate)
  }

  const issuer = new Identifier()
  issuer.did = extractIssuer(vc)
  credential.issuer = issuer

  if (vc.credentialSubject.id) {
    const subject = new Identifier()
    subject.did = vc.credentialSubject.id
    credential.subject = subject
  }
  credential.claims = []
  for (const type in vc.credentialSubject) {
    if (vc.credentialSubject.hasOwnProperty(type)) {
      const value = vc.credentialSubject[type]

      if (type !== 'id') {
        const isObj = typeof value === 'function' || (typeof value === 'object' && !!value)
        const claim = new Claim()
        claim.hash = computeEntryHash(JSON.stringify(vc) + type)
        claim.type = type
        claim.value = isObj ? JSON.stringify(value) : value
        claim.isObj = isObj
        claim.issuer = credential.issuer
        claim.subject = credential.subject
        claim.expirationDate = credential.expirationDate
        claim.issuanceDate = credential.issuanceDate
        claim.credentialType = credential.type
        claim.context = credential.context
        credential.claims.push(claim)
      }
    }
  }

  credential.raw = vci
  return credential
}
