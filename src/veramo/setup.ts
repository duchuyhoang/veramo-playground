import 'reflect-metadata';
// Core interfaces
import {
  createAgent,
  IDIDManager,
  IResolver,
  IDataStoreORM,
  IKeyManager,
  ICredentialPlugin,
  ICredentialIssuer,
} from '@veramo/core'
// Core identity manager plugin
import { DIDManager } from '@veramo/did-manager'
// Ethr did identity provider
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
// // Ion did identity provider
// import { IonDIDProvider } from '@veramo/did-provider-ion';
// Core key manager plugin
import { KeyManager } from '@veramo/key-manager'
// Custom key management system for RN
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
// W3C Verifiable Credential plugin
import { CredentialPlugin, ICredentialVerifier } from '@veramo/credential-w3c'
// Custom resolvers
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { getResolver as webDidResolver } from 'web-did-resolver'
// Storage plugin using TypeOrm
import { DataStoreORM } from '@veramo/data-store'
import { SelectiveDisclosure, ISelectiveDisclosure } from '@veramo/selective-disclosure';
import { CredentialStatusPlugin } from '@veramo/credential-status';
// TypeORM is installed with `@veramo/data-store`
import { DataSource } from 'typeorm'

import { DataStorageAgentPlugin, IDataStore } from './plugins/data-storage-agent.ts';
import { EnhancedAgentPlugin, IEnhancedAgentPlugin } from './plugins/enhanced-agent';
// import { DataStorageAgentPlugin } from './plugins/data-storage-agent.ts';

import { DIDStore } from './data-storage/did-store.ts';
import { KeyStore } from './data-storage/key-store.ts';
import { PrivateKeyStore } from './data-storage/private-key-store.ts';

import { checkCredentialRevocation } from './lib/status-validator.ts';

import { Key } from './entities/key';
import { Identifier } from './entities/identifier';
import { Message } from './entities/message';
import { Claim } from './entities/claim';
import { Presentation } from './entities/presentation';
import { Service } from './entities/service';
import { PrivateKey } from './entities/private-key';
import { PreMigrationKey } from './entities/pre-migration-key';
import { Credential } from './entities/credential.ts';

// ========= ENV =========
// This will be the name for the local sqlite database for demo purposes
const DATABASE_FILE = 'database-3.sqlite'
// You will need to get a project ID from infura https://www.infura.io
const INFURA_PROJECT_ID = '8eedf26328a04375be8ed88c14b8ad37'
// const INFURA_PROJECT_ID = '3586660d179141e3801c3895de1c2eba'
// This will be the secret key for the KMS (replace this with your secret key)
// const KMS_SECRET_KEY = 'tnVnLxXLI6UQcFaw7K2j0Pcoa5ip7UhlNB135SlWQVuzkwQ6UljI2Q';
const KMS_SECRET_KEY = '11b574d316903ced6cc3f4787bbcc3047d9c72d1da4d83e36fe714ef785d10c1';
// ========= ENV =========

const entities = [
  Key,
  Identifier,
  Message,
  Claim,
  Credential,
  Presentation,
  Service,
  PrivateKey,
  PreMigrationKey,
];

const dbConnection = new DataSource({
  type: 'sqlite',
  database: DATABASE_FILE,
  synchronize: true,
  // migrations,
  // migrationsRun: true,
  // logging: ['error', 'info', 'warn'],
  // logging: true,
  entities,
}).initialize();

export const agent = createAgent<
  IDIDManager
  & IKeyManager
  & IDataStore
  & IDataStoreORM
  & IResolver
  & ICredentialPlugin
  & ICredentialIssuer
  & ICredentialVerifier
  & ISelectiveDisclosure
  & IEnhancedAgentPlugin
>({
  plugins: [
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(KMS_SECRET_KEY))),
      },
    }),
    new DataStorageAgentPlugin(dbConnection),
    new DataStoreORM(dbConnection),
    new DIDManager({
      store: new DIDStore(dbConnection),
      // defaultProvider: 'did:ethr:arbitrum',
      defaultProvider: 'did:ethr:sepolia',
      providers: {
        'did:ethr:sepolia': new EthrDIDProvider({
          defaultKms: 'local',
          network: 'sepolia',
          rpcUrl: 'https://sepolia.infura.io/v3/' + INFURA_PROJECT_ID,
        }),
        // 'did:ethr:arbitrum': new EthrDIDProvider({
        //   defaultKms: 'local',
        //   network: 'arbitrum',
        //   rpcUrl: 'https://arbitrum-sepolia.infura.io/v3/' + INFURA_PROJECT_ID,
        // }),
        // 'did:ion': new IonDIDProvider({
        //   defaultKms: 'local',
        // }),
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...ethrDidResolver({ infuraProjectId: INFURA_PROJECT_ID }),
        ...webDidResolver(),
      }),
    }),
    new CredentialPlugin(),
    new SelectiveDisclosure(),
    new CredentialStatusPlugin({
      RevocationList2020Status: checkCredentialRevocation.bind(this, dbConnection),
    }),
    new EnhancedAgentPlugin({ dbConnection }),
  ],
});
