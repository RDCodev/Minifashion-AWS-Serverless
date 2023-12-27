import { SESClient, CreateTemplateCommand } from '@aws-sdk/client-ses';
import multipart from 'parse-multipart-data';

const REGION = 'us-east-2';

const client = new SESClient({region: REGION});

const parseTemplate = (data) => {
  return data.reduce((arr, value) => {
    
    const template = {}
    template[value.name] = Buffer.from(value.data).toString() 

    return Object.assign(arr, template)
  }, {})
}

export const handler = async (event, context, callback) => {
  
  const { headers, body } = event 
  const boundary = headers['Content-Type'].split('=')[1]
  const buffer = Buffer.from(body, 'base64');
  
  const data = multipart.parse(buffer, boundary)
  
  const template = {
    Template: parseTemplate(data)
  }
  
  const res =  {
    statusCode: 200,
    body: null
  };
  
  try{
    
    console.log(template)
    
    const command = new CreateTemplateCommand(template);
    const response = await client.send(command)
    
    res.body =  JSON.stringify({"message": response})
  } catch (err){
    res.body =  JSON.stringify({"message": err, template})
  } finally {
     callback(null, res);
  }
 
};
