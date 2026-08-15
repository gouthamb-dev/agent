/**
 * Lambda streaming handler — pipes AgentCore Runtime response directly
 * to the browser as SSE, token by token.
 *
 * Uses Lambda Function URL with RESPONSE_STREAM invoke mode.
 * The AgentCore response is already SSE-formatted — we just pipe it through.
 */

import { Readable, Writable } from 'stream';
import { promisify } from 'util';
import { pipeline as pipelineAsync } from 'stream';
import { randomUUID } from 'crypto';
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from '@aws-sdk/client-bedrock-agentcore';

const pipeline = promisify(pipelineAsync);
const AGENT_ARN = process.env.AGENT_RUNTIME_ARN!;
const agentCore = new BedrockAgentCoreClient();

interface UserRequest {
  prompt: string;
  runtimeSessionId?: string;
}

// @ts-ignore — awslambda is injected by the Lambda runtime
export const handler = awslambda.streamifyResponse(
  async (event: any, responseStream: NodeJS.WritableStream, _context: any) => {

    const httpResponseMetadata = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    };

    // @ts-ignore
    responseStream = awslambda.HttpResponseStream.from(
      responseStream as Writable,
      httpResponseMetadata,
    );

    // Parse request
    let userRequest: UserRequest;
    try {
      if (event.isBase64Encoded && event.body) {
        userRequest = JSON.parse(Buffer.from(event.body, 'base64').toString('utf-8'));
      } else if (event.body) {
        userRequest = JSON.parse(event.body);
      } else {
        userRequest = { prompt: 'hello' };
      }
    } catch {
      userRequest = { prompt: 'hello' };
    }

    // Health check
    const path = event.rawPath || event.path || '/';
    if (path === '/ping' || (path === '/' && !event.body)) {
      responseStream.write('data: {"status":"ok"}\n\n');
      responseStream.end();
      return;
    }

    if (!userRequest.prompt) {
      responseStream.write('data: {"error":"Missing prompt"}\n\n');
      responseStream.end();
      return;
    }

    // Session ID (33+ chars)
    const sessionId = userRequest.runtimeSessionId || randomUUID() + '-' + randomUUID().slice(0, 12);

    try {
      const command = new InvokeAgentRuntimeCommand({
        agentRuntimeArn: AGENT_ARN,
        runtimeSessionId: sessionId,
        payload: new TextEncoder().encode(JSON.stringify({ prompt: userRequest.prompt })),
        qualifier: 'DEFAULT',
      });

      const agentResponse = await agentCore.send(command);

      // Pipe the AgentCore stream directly to the response
      // AgentCore response is already SSE-formatted (data: {...}\n\n)
      await pipeline(
        agentResponse.response as Readable,
        responseStream as unknown as Writable,
      );
    } catch (e: any) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      responseStream.write(`data: {"error":"${errorMsg.replace(/"/g, '\\"')}"}\n\n`);
      responseStream.end();
    }
  },
);
