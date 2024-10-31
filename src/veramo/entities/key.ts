import { KeyMetadata, TKeyType } from '@veramo/core-types'
import { Entity, Column, PrimaryColumn, BaseEntity, ManyToOne, Relation } from 'typeorm'
import { Identifier } from './identifier.ts'

export type KeyType = TKeyType

@Entity('key')
export class Key extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  // @ts-ignore
  kid: string

  @Column({ type: 'varchar' })
  // @ts-ignore
  kms: string

  @Column({ type: 'varchar' })
  // @ts-ignore
  type: KeyType

  @Column({ type: 'varchar' })
  // @ts-ignore
  publicKeyHex: string

  @Column({
    type: 'simple-json',
    nullable: true,
    transformer: {
      to: (value: any): KeyMetadata | null => {
        return value
      },
      from: (value: KeyMetadata | null): object | null => {
        return value
      },
    },
  })
  meta?: KeyMetadata | null

  @ManyToOne((type) => Identifier, (identifier) => identifier?.keys, { onDelete: 'CASCADE' })
  identifier?: Relation<Identifier>
}
