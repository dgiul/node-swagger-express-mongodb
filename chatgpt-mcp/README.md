# chatgpt-mcp — connect Claude to ChatGPT with an API key

A **standalone, zero-dependency** [MCP](https://modelcontextprotocol.io) server that
lets Claude (Claude Code, Claude Desktop, or any MCP client) ask **ChatGPT**
questions through the OpenAI API using your own API key.

It is **not tied to any host project** — it only talks to the OpenAI API. Copy
this folder anywhere; it stands on its own. Nothing runs automatically: ChatGPT
is only contacted when you tell Claude to use one of these tools, so the loop
stays **human-triggered**.

## What you get

Two tools Claude can call on demand:

| Tool | What it does |
| --- | --- |
| `ask_chatgpt` | Send ChatGPT any question (with optional context) and get its answer. |
| `chatgpt_review` | Hand ChatGPT one of Claude's conclusions and ask it to critique / stress-test it. |

This enables a **feedback loop**: you ask Claude something → Claude answers →
you say *"run that by ChatGPT"* → Claude calls `chatgpt_review` → Claude reads
ChatGPT's critique and tells you where it agrees or pushes back. All triggered
by you, in plain language.

## Requirements

- Node.js 18+ (no `npm install` needed — zero dependencies).
- An OpenAI API key (`sk-...`) from https://platform.openai.com/api-keys.

## Setup (2 steps)

**1. Add your API key.** Copy the example env file and paste your key:

```bash
cd chatgpt-mcp
cp .env.example .env
# edit .env and set OPENAI_API_KEY=sk-...
```

`.env` is gitignored, so your key is never committed.

**2. Register the server with your MCP client.**

Claude Code (available in *all* your projects):

```bash
claude mcp add chatgpt --scope user -- node /absolute/path/to/chatgpt-mcp/server.js
```

Or pass the key inline instead of using `.env`:

```bash
claude mcp add chatgpt --scope user -e OPENAI_API_KEY=sk-... -- node /absolute/path/to/chatgpt-mcp/server.js
```

Claude Desktop — add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "chatgpt": {
      "command": "node",
      "args": ["/absolute/path/to/chatgpt-mcp/server.js"],
      "env": { "OPENAI_API_KEY": "sk-..." }
    }
  }
}
```

Verify it connected:

```bash
claude mcp get chatgpt      # should show Status: Connected
```

## Using it (how to trigger the loop)

Just talk to Claude. Examples:

- *"Ask ChatGPT how it would design the pagination for this endpoint."*
  → Claude calls `ask_chatgpt`.
- *"Here's my plan. Run it by ChatGPT and tell me if it disagrees."*
  → Claude calls `chatgpt_review`, then assesses ChatGPT's verdict.
- *"Get a second opinion from ChatGPT on this bug diagnosis, focus on edge cases."*
  → Claude calls `chatgpt_review` with `focus: "edge cases"`.

`chatgpt_review` asks ChatGPT to end with a one-line verdict — **AGREE**,
**AGREE WITH CAVEATS**, or **DISAGREE** — so the back-and-forth is easy to read.

## Configuration

| Env var | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | yes | — | Your OpenAI API key. |
| `OPENAI_MODEL` | no | `gpt-4o` | Model id (e.g. `gpt-4o-mini`, `gpt-4.1`, `o3`, `gpt-5`). |
| `OPENAI_BASE_URL` | no | `https://api.openai.com/v1` | Any OpenAI-compatible endpoint. |

Env vars set by the MCP client take precedence over `.env`.

## Test it

Protocol plumbing (no API key / no network needed):

```bash
npm run smoke
```

Live end-to-end (needs a valid key in `.env`):

```bash
node test/live.js "What is 2+2? Answer in one word."
```

## How it works

`server.js` speaks the MCP stdio transport (newline-delimited JSON-RPC 2.0)
directly and calls the OpenAI Chat Completions API over HTTPS. No SDKs, no
build step, no dependency on the surrounding repository.
