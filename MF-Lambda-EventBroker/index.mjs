import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { SQS_URLS } from "./uris.mjs";
import { region, SHOPIFY_METADATA_TOPIC } from "./config.mjs";

//********** CONFIG *********

const client = new SQSClient({ region });

//************** FUNCTIONS ********

const contextAction = (shopifyTopic) => {
  const [context, action] = shopifyTopic.split("/");
  return { context, action };
};

const retrieveSQSURL = (context) => {
  return SQS_URLS.filter(sqs => sqs.context == context)[0];
};

const sendSQSMessage = async (content, sqsUrl) => {

  const params = {
    MessageBody: JSON.stringify(content),
    QueueUrl: sqsUrl
  };

  const input = new SendMessageCommand(params);

  try {

    const data = await client.send(input);

    if(!data) throw new Error('Error on SQS deliver message')
    
  } catch (error) {
    throw error;
  }
};

//********** HANDLER **********
export const handler = async (event) => {

  const [{ body }] = event

  const { detail: { payload, metadata } } = JSON.parse(body);
  const { [SHOPIFY_METADATA_TOPIC]: topic } = metadata;
  const { context, action } = contextAction(topic);

  const { url } = retrieveSQSURL(context);

  try {
    await sendSQSMessage({ action, ...payload }, url);

  } catch (error) {

    throw error
  }

};