import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"

// ************** CONST *********

const REGION = 'us-east-2';
const SQS_SQL = {
  context: 'sql',
  url: 'https://sqs.us-east-2.amazonaws.com/336674089181/MF-WebhookSQL-Master'
};

//********** CONFIG *********

const client = new SQSClient({ region: REGION });

// *********** VARS *********

const sqlContext = [
  {
    context: 'customers',
    transactions: [
      {
        action: 'create',
        sqlStatement: 'CALL sp_I_customer',
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
  },
  {
    context: 'addresses',
    transactions: [
      {
        action: 'create',
        sqlStatement: 'CALL sp_I_address',
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
  const { action, default_address, addresses, ...params } = content
  const [ contextCustomers, contextAddresses ] = sqlContext
  
  const sqlCustomers = contextCustomers.transactions
    .filter(trans => trans.action == action)
    .map(trans => {
      
      params.accepts_marketing != 'not_subscribed' ?  
        params.accepts_marketing = 1 :
        params.accepts_marketing = 0
      
      return `${trans.sqlStatement}('${Object.values(params).join("\",\"")}')`
    })
  
  const addressesValues =  [
    ...Array(Object.values(addresses).reduce((a, {length}) => Math.max(a, length), 0))
  ].map((_, i) => Object.keys(addresses).reduce((a, k) => ({...a, [k]: addresses[k][i]}), {}));
  
  const sqlAddresses = contextAddresses.transactions
  .filter(trans => trans.action == action)
  .map(trans => {
    return `${
      Object.values(addressesValues)
        .map(value => {
          return `${trans.sqlStatement}  ("${Object.values(value).join("\",\"")}")`    
      })
    }`
  })
  
  return {payload: [...sqlCustomers, ...sqlAddresses]}
}

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

//********** HANDLER **********

export const handler = async (event) => {
  
  const [data] = event;
  const { url } = SQS_SQL;
  const { payload } = retrieveSQLStatements(data);
  
  console.log(payload, event)
  
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
