// or ESM/TypeScript import
import Ajv, { Options } from "ajv";
// import Ajv2020 from "ajv/lib/2020";
// import Ajv2019 from "ajv/lib/2019";
import addFormats from "ajv-formats";

const byteDecoder = new TextDecoder();

const defaultOpts: Options = {
  verbose: true,
  strict: false,
  allowMatchingProperties: true,
};
const defaultJSONSchemaValidator = new Ajv(defaultOpts);

/** JSON SCHEMA VALIDATOR REGISTRY */
export const JSON_SCHEMA_VALIDATORS_REGISTRY = {
  "http://json-schema.org/draft-07/schema": defaultJSONSchemaValidator,
  //   "https://json-schema.org/draft/2019-09/schema": new Ajv2019(defaultOpts),
  //   "https://json-schema.org/draft/2020-12/schema": new Ajv2020(defaultOpts),
};

/**
 * JSON Schema Validator
 *
 * @public
 * @class JsonSchemaValidator
 */
export class JsonSchemaValidator {
  /**
   * Validate data according to the given schema
   *
   * @param {Uint8Array} dataBytes - payload to validate
   * @param {Uint8Array} schemaBytes - schema to process
   * @returns `Promise<boolean>`
   */
  async validate(
    dataBytes: Uint8Array,
    schemaBytes: Uint8Array
  ): Promise<boolean> {
    const schema = JSON.parse(byteDecoder.decode(schemaBytes));
    const data = JSON.parse(byteDecoder.decode(dataBytes));
    const draft = schema["$schema"]?.replaceAll("#", "");
    let validator: Ajv;
    if (!draft) {
      validator = defaultJSONSchemaValidator;
    }
    const ajv =
      JSON_SCHEMA_VALIDATORS_REGISTRY[
        draft as keyof typeof JSON_SCHEMA_VALIDATORS_REGISTRY
      ];
    // validator = ajv ?? defaultJSONSchemaValidator;

    // console.log("xxx", data);

    // if (validator.formats && !Object.keys(validator.formats).length) {
    //   addFormats(validator as any);
    // }

    // const validate =
    //   (schema.$id ? validator.getSchema(schema.$id) : undefined) ||
    //   (validator as any).compile(schema);
    // const valid = validate(data);
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
      // TODO: extract correct error messages
      throw new Error(JSON.stringify(validate.errors, null, 2));
      // throw new Error(
      //   validate.errors?.map((e: { message: any }) => e.message).join(", ")
      // );
    }
    return true;
  }
}
