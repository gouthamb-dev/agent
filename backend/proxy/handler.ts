/**
 * Lambda streaming proxy — supports TWO modes:
 * 
 * 1. DIRECT mode (default): Calls Bedrock ConverseStream directly with resume in system prompt.
 *    - Faster (~0.5-1s), cheaper, simpler
 *    - Best for: portfolio Q&A
 * 
 * 2. AGENTCORE mode: Pipes through AgentCore Runtime (Strands agent with tools).
 *    - Slower (~2-3s), but supports tool use (scheduling, DB writes, etc.)
 *    - Best for: complex multi-step actions
 * 
 * Set PROXY_MODE env var to "direct" or "agentcore". Default: "direct".
 */

import { Readable, Writable } from 'stream';
import { promisify } from 'util';
import { pipeline as pipelineAsync } from 'stream';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from '@aws-sdk/client-bedrock-agentcore';

const pipeline = promisify(pipelineAsync);

const PROXY_MODE = process.env.PROXY_MODE || 'direct';
const MODEL_ID = process.env.MODEL_ID || 'us.amazon.nova-lite-v1:0';
const AGENT_ARN = process.env.AGENT_RUNTIME_ARN || '';

// Load system prompt from markdown file (bundled with the Lambda)
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT
  || readFileSync(join(__dirname, 'system-prompt.md'), 'utf-8');

const bedrockRuntime = new BedrockRuntimeClient();
const agentCore = new BedrockAgentCoreClient();

interface UserRequest {
  prompt: string;
  lang?: string;
  runtimeSessionId?: string;
}

// @ts-ignore
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
        userRequest = { prompt: '' };
      }
    } catch {
      userRequest = { prompt: '' };
    }

    // Health check
    const path = event.rawPath || event.path || '/';
    if (path === '/ping' || (path === '/' && !event.body)) {
      responseStream.write(`data: {"status":"ok","mode":"${PROXY_MODE}"}\n\n`);
      responseStream.end();
      return;
    }

    if (!userRequest.prompt) {
      responseStream.write('data: {"error":"Missing prompt"}\n\n');
      responseStream.end();
      return;
    }

    try {
      if (PROXY_MODE === 'agentcore') {
        await handleAgentCore(userRequest, responseStream);
      } else {
        await handleDirect(userRequest, responseStream);
      }
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      responseStream.write(`data: {"error":"${msg.replace(/"/g, '\\"')}"}\n\n`);
      responseStream.end();
    }
  },
);


/**
 * DIRECT mode — calls Bedrock ConverseStream with resume baked into system prompt.
 * Streams text deltas as SSE events.
 */
async function handleDirect(req: UserRequest, stream: NodeJS.WritableStream) {
  // Build system prompt with language instruction if non-English
  let systemPrompt = SYSTEM_PROMPT;
  if (req.lang && req.lang !== 'en') {
    systemPrompt += `\n\n## Language Override\nThe user has requested responses in language code "${req.lang}". You MUST respond entirely in this language. Technical terms (AWS services, certifications, tool names) may stay in English where no standard translation exists.`;
  }

  const command = new ConverseStreamCommand({
    modelId: MODEL_ID,
    system: [{ text: systemPrompt }],
    messages: [
      { role: 'user', content: [{ text: req.prompt }] },
    ],
    inferenceConfig: {
      maxTokens: 2048,
      temperature: 0.7,
    },
  });

  const response = await bedrockRuntime.send(command);

  if (response.stream) {
    for await (const event of response.stream) {
      if (event.contentBlockDelta?.delta?.text) {
        const text = event.contentBlockDelta.delta.text;
        const sseEvent = JSON.stringify({
          event: { contentBlockDelta: { delta: { text }, contentBlockIndex: 0 } }
        });
        stream.write(`data: ${sseEvent}\n\n`);
      }
    }
  }

  stream.end();
}


/**
 * AGENTCORE mode — pipes AgentCore Runtime stream directly to the client.
 */
async function handleAgentCore(req: UserRequest, stream: NodeJS.WritableStream) {
  const sessionId = req.runtimeSessionId || randomUUID() + '-' + randomUUID().slice(0, 12);

  // Build payload with language preference
  const payload: Record<string, string> = { prompt: req.prompt };
  if (req.lang && req.lang !== 'en') {
    payload.prompt = `[Respond in language: ${req.lang}]\n\n${req.prompt}`;
  }

  const command = new InvokeAgentRuntimeCommand({
    agentRuntimeArn: AGENT_ARN,
    runtimeSessionId: sessionId,
    payload: new TextEncoder().encode(JSON.stringify(payload)),
    qualifier: 'DEFAULT',
  });

  const agentResponse = await agentCore.send(command);

  await pipeline(
    agentResponse.response as Readable,
    stream as unknown as Writable,
  );
}
