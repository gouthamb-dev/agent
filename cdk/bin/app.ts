import * as cdk from 'aws-cdk-lib';
import { BedrockAgentCoreStack } from '../lib/agentcore-stack.js';

const app = new cdk.App();

new BedrockAgentCoreStack(app, 'StrandsBedrockAgentCoreStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
  },
  description: 'AWS Bedrock AgentCore Infrastructure Stack for Strands Agents framework deployment',
});

app.synth();
