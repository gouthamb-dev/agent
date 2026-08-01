import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface BedrockAgentCoreStackProps extends cdk.StackProps {
  /** Optional custom repository name. Default: 'strands-bedrock-agentcore'. */
  repositoryName?: string;
  /** Optional Foundation Model ID on Bedrock. Default: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'. */
  modelId?: string;
}

/**
 * AWS CDK Stack deploying Strands Agents on AWS Bedrock AgentCore.
 * Provisions ECR Container Repository, IAM Roles, Bedrock Model Invocation Policies,
 * and CloudWatch Logs.
 */
export class BedrockAgentCoreStack extends cdk.Stack {
  public readonly ecrRepository: ecr.Repository;
  public readonly agentExecutionRole: iam.Role;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props?: BedrockAgentCoreStackProps) {
    super(scope, id, props);

    const repoName = props?.repositoryName || 'strands-bedrock-agentcore';
    const modelId = props?.modelId || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

    // 1. ECR Container Repository for Strands Agent Runtime
    this.ecrRepository = new ecr.Repository(this, 'AgentCoreRepository', {
      repositoryName: repoName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });

    // 2. CloudWatch Log Group for Observability & OpenTelemetry
    this.logGroup = new logs.LogGroup(this, 'AgentCoreLogGroup', {
      logGroupName: `/aws/bedrock-agentcore/${repoName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 3. IAM Execution Role with Amazon Bedrock Invocation Permissions
    this.agentExecutionRole = new iam.Role(this, 'AgentCoreExecutionRole', {
      assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
      description: 'IAM execution role for Strands Agents runtime on AWS Bedrock AgentCore',
    });

    // Bedrock Invocation Policy
    this.agentExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          'bedrock:GetFoundationModel',
        ],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/${modelId}`,
          `arn:aws:bedrock:${this.region}:${this.account}:custom-model/*`,
        ],
      }),
    );

    // ECR Image Pull Policy
    this.ecrRepository.grantPull(this.agentExecutionRole);

    // Outputs for CLI & AgentCore Integration
    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR Repository URI for pushing Strands AgentCore Docker container images',
    });

    new cdk.CfnOutput(this, 'AgentCoreExecutionRoleArn', {
      value: this.agentExecutionRole.roleArn,
      description: 'IAM Execution Role ARN for Bedrock AgentCore Runtime configuration',
    });

    new cdk.CfnOutput(this, 'CloudWatchLogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'CloudWatch Log Group Name for Strands Agent tracing and logs',
    });
  }
}
