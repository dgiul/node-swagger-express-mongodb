#!/usr/bin/env node
/**
 * chatgpt-mcp — a zero-dependency Model Context Protocol (MCP) server that lets
 * Claude Code ask ChatGPT (the OpenAI API) questions on demand.
 *
 * It speaks the MCP stdio transport (JSON-RPC 2.0 over stdin/stdout) directly,
 * so there are no npm dependencies to install. It exposes two tools:
 *
 *   ask_chatgpt     - send an arbitrary question to ChatGPT and get its answer.
 *   chatgpt_review  - hand ChatGPT one of Claude's conclusions and ask it to
 *                     critique / stress-test it (the "feedback" half of the loop).
 *
 * Configuration (environment variables):
 *   OPENAI_API_KEY   (required)  your OpenAI API key.
 *   OPENAI_MODEL     (optional)  model id, default "gpt-4o".
 *   OPENAI_BASE_URL  (optional)  API base, default "https://api.openai.com/v1".
 *                                (Point this at any OpenAI-compatible endpoint.)
 *
 * Nothing here runs automatically: a tool only fires when Claude calls it,
 * which only happens when you ask Claude to. That keeps the loop human-triggered.
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// ---------------------------------------------------------------------------
// Minimal .env loader (zero-dependency). Loads chatgpt-mcp/.env if present so
// the OpenAI API key can live in a local, gitignored file. Existing process
// env vars always win, so an env var set by the MCP client takes precedence.
// ---------------------------------------------------------------------------
(function loadDotEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch (_) { /* ignore .env problems; env vars can still be set directly */ }
})();

const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

const SERVER_INFO = { name: 'chatgpt-mcp', version: '1.0.0' };
const PROTOCOL_VERSION = '2024-11-05';

// ---------------------------------------------------------------------------
// OpenAI call
// ---------------------------------------------------------------------------

/**
 * Call the OpenAI Chat Completions API and return the assistant's text.
 * @param {{system?: string, user: string, model?: string, temperature?: number}} opts
 * @returns {Promise<string>}
 */
function callOpenAI(opts) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      reject(new Error(
        'OPENAI_API_KEY is not set. Add it to the MCP server env (see chatgpt-mcp/README.md).'
      ));
      return;
    }

    const messages = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: opts.user });

    const payload = JSON.stringify({
      model: opts.model || DEFAULT_MODEL,
      messages,
      temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.4,
    });

    let url;
    try {
      url = new URL(OPENAI_BASE_URL + '/chat/completions');
    } catch (e) {
      reject(new Error('Invalid OPENAI_BASE_URL: ' + OPENAI_BASE_URL));
      return;
    }

    const transport = url.protocol === 'http:' ? http : https;
    const req = transport.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            let detail = body;
            try {
              detail = JSON.parse(body).error.message || body;
            } catch (_) { /* keep raw body */ }
            reject(new Error('OpenAI API error ' + res.statusCode + ': ' + detail));
            return;
          }
          try {
            const parsed = JSON.parse(body);
            const text = parsed.choices &&
              parsed.choices[0] &&
              parsed.choices[0].message &&
              parsed.choices[0].message.content;
            if (typeof text !== 'string') {
              reject(new Error('Unexpected OpenAI response shape: ' + body.slice(0, 500)));
              return;
            }
            resolve(text.trim());
          } catch (e) {
            reject(new Error('Failed to parse OpenAI response: ' + e.message));
          }
        });
      }
    );

    req.on('error', (e) => reject(new Error('Network error calling OpenAI: ' + e.message)));
    req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'ask_chatgpt',
    description:
      'Ask ChatGPT (OpenAI) a question and return its answer. Use this to get a ' +
      'second opinion, cross-check reasoning, or gather ChatGPT feedback. ' +
      'Only runs when you call it — it is never automatic.',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The question or request to send to ChatGPT.',
        },
        context: {
          type: 'string',
          description:
            'Optional background (code, prior conclusions, constraints) to give ChatGPT before the question.',
        },
        system: {
          type: 'string',
          description:
            'Optional system prompt to steer ChatGPT\'s role/tone. Defaults to a concise technical reviewer persona.',
        },
        model: {
          type: 'string',
          description: 'Optional OpenAI model id override (default from OPENAI_MODEL env, else gpt-4o).',
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'chatgpt_review',
    description:
      "Give ChatGPT one of Claude's conclusions and ask it to critique and stress-test it. " +
      'This is the "feedback" half of a Claude<->ChatGPT loop: ChatGPT points out gaps, ' +
      'risks, and disagreements so Claude can then assess ChatGPT\'s response.',
    inputSchema: {
      type: 'object',
      properties: {
        conclusion: {
          type: 'string',
          description: "Claude's conclusion, plan, code, or answer that should be reviewed.",
        },
        topic: {
          type: 'string',
          description: 'Optional short description of what the conclusion is about / the original question.',
        },
        focus: {
          type: 'string',
          description: 'Optional specific angle to focus the critique on (e.g. "security", "edge cases", "API design").',
        },
        model: {
          type: 'string',
          description: 'Optional OpenAI model id override.',
        },
      },
      required: ['conclusion'],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

async function handleAskChatgpt(args) {
  const system = args.system ||
    'You are ChatGPT, acting as a sharp, concise technical peer reviewer for another ' +
    'AI assistant (Claude). Answer directly. If you disagree or see a flaw, say so plainly ' +
    'and explain why. Prefer specifics over generalities.';

  let user = args.question;
  if (args.context && args.context.trim()) {
    user = 'Context:\n' + args.context.trim() + '\n\n---\n\nQuestion:\n' + args.question;
  }

  const answer = await callOpenAI({ system, user, model: args.model });
  const modelUsed = args.model || DEFAULT_MODEL;
  return 'ChatGPT (' + modelUsed + ') says:\n\n' + answer;
}

async function handleChatgptReview(args) {
  const system =
    'You are ChatGPT, reviewing a conclusion produced by another AI assistant (Claude). ' +
    'Your job is to stress-test it: identify errors, unstated assumptions, missing edge ' +
    'cases, risks, and anything you would do differently. Be direct and specific. ' +
    'End with a one-line verdict: AGREE, AGREE WITH CAVEATS, or DISAGREE.';

  const parts = [];
  if (args.topic && args.topic.trim()) parts.push('Topic / original question:\n' + args.topic.trim());
  if (args.focus && args.focus.trim()) parts.push('Focus your critique on: ' + args.focus.trim());
  parts.push("Claude's conclusion to review:\n" + args.conclusion);
  const user = parts.join('\n\n---\n\n');

  const answer = await callOpenAI({ system, user, model: args.model, temperature: 0.5 });
  const modelUsed = args.model || DEFAULT_MODEL;
  return 'ChatGPT review (' + modelUsed + '):\n\n' + answer;
}

async function dispatchTool(name, args) {
  switch (name) {
    case 'ask_chatgpt':
      return handleAskChatgpt(args || {});
    case 'chatgpt_review':
      return handleChatgptReview(args || {});
    default:
      throw new Error('Unknown tool: ' + name);
  }
}

// ---------------------------------------------------------------------------
// JSON-RPC / MCP plumbing over stdio
// ---------------------------------------------------------------------------

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handleMessage(msg) {
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;

  try {
    switch (method) {
      case 'initialize':
        sendResult(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });
        return;

      case 'notifications/initialized':
        // Client acknowledgement — no response expected.
        return;

      case 'ping':
        sendResult(id, {});
        return;

      case 'tools/list':
        sendResult(id, { tools: TOOLS });
        return;

      case 'tools/call': {
        const toolName = params && params.name;
        const toolArgs = (params && params.arguments) || {};
        try {
          const text = await dispatchTool(toolName, toolArgs);
          sendResult(id, { content: [{ type: 'text', text }] });
        } catch (toolErr) {
          // Report tool failures as tool results (isError) so the model sees them.
          sendResult(id, {
            content: [{ type: 'text', text: 'Error: ' + toolErr.message }],
            isError: true,
          });
        }
        return;
      }

      default:
        if (!isNotification) sendError(id, -32601, 'Method not found: ' + method);
        return;
    }
  } catch (e) {
    if (!isNotification) sendError(id, -32603, 'Internal error: ' + e.message);
  }
}

// Read newline-delimited JSON-RPC messages from stdin.
let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch (e) {
      // Ignore malformed lines rather than crashing the server.
      continue;
    }
    handleMessage(msg);
  }
});

process.stdin.on('end', () => process.exit(0));

// Announce readiness on stderr (stdout is reserved for the protocol).
process.stderr.write('[chatgpt-mcp] ready (model=' + DEFAULT_MODEL + ', base=' + OPENAI_BASE_URL + ')\n');
