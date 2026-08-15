import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class SysCLIAgentInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get AgentCore Runtime ARN from context or use placeholder
    const agentRuntimeArn = this.node.tryGetContext('agentRuntimeArn')
      || process.env.AGENT_RUNTIME_ARN
      || '';

    // --- Lambda Proxy (streams AgentCore response to browser) ---

    const proxyFn = new lambda.Function(this, 'AgentProxy', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/dist')),
      timeout: cdk.Duration.seconds(120),
      memorySize: 256,
      environment: {
        AGENT_RUNTIME_ARN: agentRuntimeArn,
      },
    });

    // Grant Lambda permission to invoke AgentCore
    proxyFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock-agentcore:InvokeAgentRuntime'],
      resources: [
        agentRuntimeArn,
        `${agentRuntimeArn}/*`,
        `${agentRuntimeArn}/runtime-endpoint/*`,
      ],
    }));

    // Lambda Function URL (public, streaming)
    const fnUrl = proxyFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
      cors: {
        allowedOrigins: ['*'],
        allowedHeaders: ['Content-Type'],
        allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.GET],
      },
    });

    // --- S3 Bucket for Frontend ---

    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: this.node.tryGetContext('frontendBucket') || undefined,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // --- CloudFront Distribution ---

    const distribution = new cloudfront.Distribution(this, 'FrontendCDN', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 404, responsePagePath: '/index.html', responseHttpStatus: 200 },
      ],
    });

    // --- Outputs ---

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: fnUrl.url,
      description: 'Lambda Function URL (proxy to AgentCore) — use as frontend endpoint',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront URL for the frontend',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket for frontend assets',
    });
  }
}
