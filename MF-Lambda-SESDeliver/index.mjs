import { SESClient, SendTemplatedEmailCommand  } from "@aws-sdk/client-ses";
import multipart from 'parse-multipart-data';

const REGION = 'us-east-2';

const client = new SESClient({region: REGION});

const isValidJSON = (data) => {
  try{
    JSON.parse(data)
  } catch (err) {
    return false
  }
  
  return true
}

const parseTemplate = (data) => {
  return data.reduce((arr, value) => {
    
    const template = {}
    
      template[value.name] = Buffer.from(value.data).toString() 
    
    if(isValidJSON(Buffer.from(value.data)) && value.name != 'TemplateData') {
      template[value.name] = JSON.parse(Buffer.from(value.data))
    }

    return Object.assign(arr, template)
  }, {})
}

export const handler = async (event, context, callback) => {
  
  const { headers, body } = event
  //console.log(event)
  //const boundary = headers['Content-Type'].split('=')[1]
  const buffer = Buffer.from(body, 'base64');
  //const data = multipart.parse(buffer, boundary)
  
  //const formData = parseTemplate(data)
  const formData = JSON.parse(buffer.toString())
  
  formData.TemplateData = JSON.stringify(formData.TemplateData)
  
  console.log(formData)
  
  const command = new SendTemplatedEmailCommand(formData);
  try {
    const response = await client.send(command);
    console.log(response)
    return {
      statusCode: 200,
      body: JSON.stringify({"message": response})
    }
  } catch (err) {
    
    console.log(err)
    
    return {
      statusCode: 400,
      body: JSON.stringify({"message": err})
    }
  }
 
};
