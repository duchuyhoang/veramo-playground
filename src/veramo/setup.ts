// Core interfaces
import {
  createAgent,
  IDIDManager,
  IResolver,
  IDataStore,
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
import { Entities, KeyStore, DIDStore, PrivateKeyStore, migrations, DataStore, DataStoreORM } from '@veramo/data-store'
// TypeORM is installed with `@veramo/data-store`
import { DataSource } from 'typeorm'

import { SelectiveDisclosure, ISelectiveDisclosure } from '@veramo/selective-disclosure';

import { EnhancedAgentPlugin, IEnhancedAgentPlugin } from './plugins/enhanced-agent.ts';

// ========= ENV =========
// This will be the name for the local sqlite database for demo purposes
const DATABASE_FILE = 'database.sqlite'
// You will need to get a project ID from infura https://www.infura.io
const INFURA_PROJECT_ID = ''
// const INFURA_PROJECT_ID = ''
// This will be the secret key for the KMS (replace this with your secret key)
// const KMS_SECRET_KEY = '';
const KMS_SECRET_KEY = '';
// ========= ENV =========

const dbConnection = new DataSource({
  type: 'sqlite',
  database: DATABASE_FILE,
  synchronize: false,
  migrations,
  migrationsRun: true,
  // logging: ['error', 'info', 'warn'],
  logging: true,
  entities: Entities,
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
    new DataStore(dbConnection),
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
    new EnhancedAgentPlugin(),
  ],
});
