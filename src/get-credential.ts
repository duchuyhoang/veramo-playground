import { agent } from './veramo/setup.js'

async function main() {
  const result = await agent.dataStoreGetVerifiableCredential({
    hash: 'QmSWXqMq2n1tuyL4aQ2uE3eBAojhwCKBfQQJhKHXzYV1dE',
  });
  console.log('result:', result);
}

main().catch(console.log)