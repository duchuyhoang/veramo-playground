import { agent } from "./veramo/setup.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const result = await agent.createSchema({
    title: "Test schema",
    description: "cxaddadaadad",
    fields: [
      {
        name: "phone number",
        type: "boolean",
        description: "ddddd",
        required: false,
      },
      {
        name: "name hxxx",
        type: "date",
        description: "named xald,ad",
        required: true,
      },
      {
        name: "age",
        type: "dateTime",
        description: "age date format",
        required: true,
      },
      {
        name: "xxx",
        type: "number",
        description: "ddd",
        required: true,
      },
    ],
  });
  fs.writeFileSync(
    path.join(__dirname, "../server/public/schema.json"),
    JSON.stringify(result)
  );
  console.log("result:", result);
}

main().catch(console.log);
