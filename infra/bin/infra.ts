#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SysCLIAgentInfraStack } from '../lib/infra-stack';

const app = new cdk.App();

new SysCLIAgentInfraStack(app, 'sys-cli-agent-infra', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
