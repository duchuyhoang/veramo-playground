import { agent } from './veramo/setup.js'

async function main() {
  const alias = 'i3';
  const [id] = await agent.didManagerFind({ alias })
  if (id) {
    await agent.didManagerDelete({ did: id.did })
  }
  const identifier = await agent.didManagerCreate({ alias })
  console.log(`New identifier created`)
  console.log(JSON.stringify(identifier, null, 2))
}

main().catch(console.log)