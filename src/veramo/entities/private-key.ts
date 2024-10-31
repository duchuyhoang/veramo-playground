import { KeyType } from './key.ts'
import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm'

/**
 * Represents some properties of a {@link @veramo/key-manager#ManagedPrivateKey | ManagedPrivateKey} that are stored in
 * a TypeORM database when using a {@link @veramo/data-store#PrivateKeyStore | PrivateKeyStore} to store private key
 * data.
 *
 * @see {@link @veramo/kms-local#KeyManagementSystem | KeyManagementSystem} for an implementation of a KMS that can
 *   make use of such stored keys.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
@Entity('private-key')
export class PrivateKey extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
    // @ts-ignore
  alias: string

  @Column({ type: 'varchar' })
    // @ts-ignore
  type: KeyType

  @Column({ type: 'varchar' })
    // @ts-ignore
  privateKeyHex: string
}
