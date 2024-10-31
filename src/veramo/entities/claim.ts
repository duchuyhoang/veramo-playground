import { Entity, Column, BaseEntity, ManyToOne, PrimaryColumn, Relation } from 'typeorm'
import { Identifier } from './identifier.ts'
import { Credential } from './credential.ts'

/**
 * Represents the properties of a claim extracted from a Verifiable Credential `credentialSubject`, and stored in a
 * TypeORM database for querying.
 *
 * @see {@link @veramo/core-types#IDataStoreORM} for the interface defining how this can be queried.
 * @see {@link @veramo/data-store#DataStoreORM} for the implementation of the query interface.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
@Entity('claim')
export class Claim extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  // @ts-ignore
  hash: string;

  @ManyToOne((type) => Identifier, (identifier) => identifier.issuedClaims, {
    eager: true,
    onDelete: 'CASCADE',
  })
  // @ts-ignore
  issuer: Relation<Identifier>;

  @ManyToOne((type) => Identifier, (identifier) => identifier.receivedClaims, { eager: true })
  // @ts-ignore
  subject: Relation<Identifier>;

  @ManyToOne((type) => Credential, (credential) => credential.claims, { onDelete: 'CASCADE' })
  // @ts-ignore
  credential: Relation<Credential>;

  @Column({ type: 'datetime' })
  // @ts-ignore
  issuanceDate: Date

  @Column({ type: 'datetime', nullable: true })
  expirationDate?: Date | null;

  @Column('simple-array')
  // @ts-ignore
  context: string[];

  @Column('simple-array')
  // @ts-ignore
  credentialType: string[];

  @Column({ type: 'varchar' })
  // @ts-ignore
  type: string;

  @Column('text', { nullable: true })
  value?: string | null;

  @Column({ type: 'boolean' })
  // @ts-ignore
  isObj: boolean;
}
