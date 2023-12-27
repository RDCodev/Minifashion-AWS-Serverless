import { SQSClient, SendMessageCommand  } from "@aws-sdk/client-sqs";

// ************** CONST *********

const REGION = 'us-east-2';
const SQS_SQL = {
  context: 'sql',
  url: 'https://sqs.us-east-2.amazonaws.com/336674089181/MF-WebhookSQL-Master'
};

//********** CONFIG *********

const client = new SQSClient({ region: REGION });

//************* VARS **********

const sqlContext = [
  {
    context: 'orders',
    transactions: [
      {
        action: 'create',
        sqlStatement: 'CALL sp_I_order',
        params: []
      },
      {
        action: 'update',
        sqlStatement: '',
        params: []
      },
      {
        action: 'delete',
        sqlStatement: '',
        params: []
      }
    ]
  }
];

//************** FUNCTIONS ********

const retrieveSQLStatements = (content) => { 
  
  const { action, ...params } = content;
  const [contextOrders] = sqlContext;
  
  const sqlOrders = contextOrders.transactions
    .filter(trans => trans.action == action)
    .map(trans => {
      
      let sqlParams = [];
      let auxParams = [];
      
      for (const prop in params){
        
        if(!Array.isArray(params[prop]))
          sqlParams = [...sqlParams, params[prop]];
        
        if(Array.isArray(params[prop]) && auxParams.length){
          const aux = params[prop]
          auxParams = auxParams.map((param, index) => {
            return [...param, aux[index]]
          })
        }
        
        if(Array.isArray(params[prop]) && !auxParams.length)
          auxParams = params[prop].map(param => {
            return [param]
          })
      }
      
      return auxParams.map(param => {
        return `${trans.sqlStatement} ("${[...sqlParams, ...param].join("\",\"")}")`
      })
      
    });
    
  return {payload: [...sqlOrders[0]]}; 
};

const sendSQSMessage = async (content, sqsUrl) => {
  
  const params = {
    MessageBody: JSON.stringify(content),
    QueueUrl: sqsUrl
  };
  
  const input = new SendMessageCommand(params);
  
  try {
    const data = await client.send(input);

    return data;
  } catch (error) {

    throw error;
  }
};

//************* HANDLER *********

export const handler = async (event) => {
  
  //console.log(event)

  const [data] = event;
  
  const { url } = SQS_SQL;
  const { payload } = retrieveSQLStatements(data);
  
  console.log(payload)
  
  try {
    const res = await sendSQSMessage({queries: payload}, url);
    if(res) 
      return {
        statusCode: 200,
        body: JSON.stringify(`SQS ${url} delivered.`),
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(`Error ${error}.`)
    };
  }
};
