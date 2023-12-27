import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const sqlEndPoints = [
  {
    context: 'list',
    httpRequest: 'GET',
    query: (app) => `CALL MF_DataSource.sp_S_customers_by_App("${app}")`
  }
]

const REGION = 'us-east-2';

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
  
  const { queryStringParameters: params, requestContext: {http} } = event
  const [sql] = sqlEndPoints.filter(endpoint => endpoint.httpRequest == http.method)
  
  try{
    
    const queries = {queries: [sql.query(params.app_id)]}
    
    const command = new InvokeCommand(paramsLambdaInvoke(JSON.stringify(queries)));
    const { Payload } = await client.send(command)
    const {result} = parseInvokeResponse(Payload)
    
    const [customers] = result.flat(Infinity)
    
    return {
      statusCode: 200,
      body: JSON.stringify(customers)
    }
  
  } catch (error) {
    
    console.log(error)
    
    return {
      statusCode: 500,
      body: JSON.stringify(`Error on Server: ${error}`)
    } 
  }
};
