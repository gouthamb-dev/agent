#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProxyStack } from './proxy-stack';

const app = new cdk.App();

new ProxyStack(app, 'agent-proxy', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
