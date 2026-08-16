import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class ProxyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const agentRuntimeArn = this.node.tryGetContext('agentRuntimeArn')
      || process.env.AGENT_RUNTIME_ARN
      || '';

    const proxyMode = this.node.tryGetContext('proxyMode') || 'direct';
    const modelId = this.node.tryGetContext('modelId') || 'us.amazon.nova-lite-v1:0';

    const proxyFn = new lambda.Function(this, 'Proxy', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../proxy/dist')),
      timeout: cdk.Duration.seconds(120),
      memorySize: 256,
      environment: {
        PROXY_MODE: proxyMode,
        MODEL_ID: modelId,
        AGENT_RUNTIME_ARN: agentRuntimeArn,
        SYSTEM_PROMPT: this.node.tryGetContext('systemPrompt') || '',
      },
    });

    proxyFn.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'bedrock-agentcore:InvokeAgentRuntime',
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'],
    }));

    const fnUrl = proxyFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
      cors: {
        allowedOrigins: ['*'],
        allowedHeaders: ['Content-Type'],
        allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.GET],
      },
    });

    new cdk.CfnOutput(this, 'ProxyUrl', {
      value: fnUrl.url,
      description: 'Lambda Function URL — use as AGENT_ENDPOINT_URL',
    });
  }
}
