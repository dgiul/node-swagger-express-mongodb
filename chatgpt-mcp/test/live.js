#!/usr/bin/env node
/**
 * Live end-to-end test: drives the MCP server through a real ask_chatgpt call.
 * Requires a valid OPENAI_API_KEY (in chatgpt-mcp/.env or the environment).
 *
 *   node test/live.js "What is 2+2? Answer in one word."
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');

const question = process.argv.slice(2).join(' ') || 'Reply with exactly: connection OK';
const serverPath = path.join(__dirname, '..', 'server.js');

const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });

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

(async () => {
  await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'live', version: '0' },
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');

  console.log('Asking ChatGPT: ' + question + '\n');
  const res = await rpc('tools/call', { name: 'ask_chatgpt', arguments: { question } });
  const text = res.result && res.result.content && res.result.content[0] && res.result.content[0].text;

  if (res.result && res.result.isError) {
    console.error('Connection test FAILED:\n' + text);
    child.kill();
    process.exit(1);
  }

  console.log(text);
  console.log('\nConnection test PASSED — Claude reached ChatGPT successfully.');
  child.kill();
  process.exit(0);
})();

setTimeout(() => {
  console.error('Live test timed out (network or API issue).');
  child.kill();
  process.exit(1);
}, 30000);
