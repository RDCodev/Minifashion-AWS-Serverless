import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { region, FunctionName } from "./config.mjs";

const client = new LambdaClient({ region })

const parseInvokeResponse = (stream) => {
  return Buffer.from(stream).toString()
}

const paramsLambdaInvoke = (Payload) => {

  return {
    FunctionName,
    InvocationType: "RequestResponse",
    Payload
  }
}

export const handler = async (event) => {

  try {

    const { Records: [data] } = event
    const { body } = data

    const command = new InvokeCommand(paramsLambdaInvoke(body));
    const { Payload } = await client.send(command)

    const result = parseInvokeResponse(Payload)

    return { result }

  } catch (error) {
    throw error
  }
};
