#!/usr/bin/env node
/**
 * Smoke test for chatgpt-mcp: spawns the server, runs the MCP handshake, lists
 * tools, and verifies a tool call fails cleanly when no API key is set.
 * Does NOT make any network / OpenAI calls, so it needs no API key.
 *
 *   node test/smoke.js
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.js');

// Run with a guaranteed-empty key so the tool-call test hits the clean error path.
const child = spawn(process.execPath, [serverPath], {
  env: Object.assign({}, process.env, { OPENAI_API_KEY: '' }),
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';
const pending = new Map();
let nextId = 1;

child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});

function rpc(method, params) {
  return new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

function assert(cond, label) {
  if (!cond) {
    console.error('FAIL: ' + label);
    child.kill();
    process.exit(1);
  }
  console.log('ok   - ' + label);
}

(async () => {
  const init = await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'smoke', version: '0' },
  });
  assert(init.result && init.result.serverInfo.name === 'chatgpt-mcp', 'initialize returns serverInfo');
  assert(init.result.protocolVersion, 'initialize returns protocolVersion');

  notify('notifications/initialized', {});

  const list = await rpc('tools/list', {});
  const names = (list.result.tools || []).map((t) => t.name);
  assert(names.includes('ask_chatgpt'), 'tools/list includes ask_chatgpt');
  assert(names.includes('chatgpt_review'), 'tools/list includes chatgpt_review');

  const call = await rpc('tools/call', { name: 'ask_chatgpt', arguments: { question: 'hi' } });
  assert(call.result && call.result.isError === true, 'tool call without API key returns isError');
  assert(
    /OPENAI_API_KEY/.test(call.result.content[0].text),
    'error message names the missing OPENAI_API_KEY'
  );

  console.log('\nAll smoke checks passed.');
  child.kill();
  process.exit(0);
})();

setTimeout(() => {
  console.error('FAIL: smoke test timed out');
  child.kill();
  process.exit(1);
}, 10000);
