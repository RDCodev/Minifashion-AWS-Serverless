import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const sql = `CALL sp_S_mail_metrics()`;
const REGION = `us-east-2`
const client = new LambdaClient({region: REGION})

const parseInvokeResponse = (buffer) => {
  return JSON.parse(Buffer.from(buffer).toString())
}

const paramsLambdaInvoke = (payload) => {
  
  console.log(payload)
  
  return {
    FunctionName: "MF-Lambda-Connection",
    InvocationType: "RequestResponse",
    Payload: payload
  }
}

export const handler = async (event) => {
  const queries = {queries: [sql]}
  
  try {
    const command = new InvokeCommand(paramsLambdaInvoke(JSON.stringify(queries)));
    const { Payload } = await client.send(command)
    const { result } = parseInvokeResponse(Payload)
    const [metrics] = result.flat(Infinity)
    
    return {
      statusCode: 200,
      body: JSON.stringify(metrics)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(`Error on Server: ${error}`)
    } 
  }
};
