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
    context: 'product',
    transactions: [
      {
        action: 'create',
        sqlStatement: 'CALL sp_I_product',
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
    context: 'variants',
    transactions: [
      {
        action: 'create',
        sqlStatement: 'INSERT INTO mf_products_variants VALUES',
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

//const freezeObject = (object) => Object.freeze(object)

const retrieveSQLStatements = (content) => {
  
  const { action, variants: [variants], ...params} = content;
  const [ contextProducts, contextVariants ] = sqlContext
  
  const sqlProducts = contextProducts.transactions
  .filter(trans => trans.action == action)
  .map(trans => {
      return `${trans.sqlStatement} ("${Object.values(params).join("\",\"")}")`
  })
  
  const variantsValues =  [
    ...Array(Object.values(variants).reduce((a, {length}) => Math.max(a, length), 0))
  ].map((_, i) => Object.keys(variants).reduce((a, k) => ({...a, [k]: variants[k][i]}), {}));
  
  const sqlVariants = contextVariants.transactions
  .filter(trans => trans.action == action)
  .map(trans => {
    return `${ trans.sqlStatement} ${
      Object.values(variantsValues)
        .map(value => {
          return `("${Object.values(value).join("\",\"")}")`    
      }).join(',')
    }`
  })
  
  return { payload: [...sqlProducts, ...sqlVariants] };
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

//********** HANDLER **********

export const handler = async (event, context) => {
  
  console.log(event)
  
  const [data] = event;
  
  const { url } = SQS_SQL;
  const { payload } = retrieveSQLStatements(data);
  
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
