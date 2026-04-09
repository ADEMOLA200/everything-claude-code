'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { filterMcpConfig, parseDisabledMcpServers } = require('../../scripts/lib/mcp-config');

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    return true;
  } catch (error) {
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing mcp-config.js ===\n');

  let passed = 0;
  let failed = 0;

  if (test('parseDisabledMcpServers dedupes and trims values', () => {
    assert.deepStrictEqual(
      parseDisabledMcpServers(' github,exa ,github,,playwright '),
      ['github', 'exa', 'playwright']
    );
  })) passed++; else failed++;

  if (test('filterMcpConfig removes disabled servers and preserves others', () => {
    const result = filterMcpConfig({
      mcpServers: {
        github: { command: 'npx' },
        exa: { url: 'https://mcp.exa.ai/mcp' },
        memory: { command: 'npx' },
      },
      _comments: { usage: 'demo' },
    }, ['github', 'memory']);

    assert.deepStrictEqual(result.removed, ['github', 'memory']);
    assert.deepStrictEqual(Object.keys(result.config.mcpServers), ['exa']);
    assert.deepStrictEqual(result.config._comments, { usage: 'demo' });
  })) passed++; else failed++;

  if (test('filterMcpConfig leaves config unchanged when no disabled servers are provided', () => {
    const result = filterMcpConfig({
      mcpServers: {
        github: { command: 'npx' },
      },
    }, []);

    assert.deepStrictEqual(result.removed, []);
    assert.deepStrictEqual(Object.keys(result.config.mcpServers), ['github']);
  })) passed++; else failed++;

  if (test('shared mcp server catalog includes clarvia discovery config', () => {
    const catalogPath = path.join(__dirname, '..', '..', 'mcp-configs', 'mcp-servers.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

    assert.ok(catalog.mcpServers && typeof catalog.mcpServers === 'object', 'Expected mcpServers object in shared catalog');
    assert.ok(catalog.mcpServers.clarvia, 'Expected clarvia server entry in shared catalog');
    assert.strictEqual(catalog.mcpServers.clarvia.command, 'npx');
    assert.deepStrictEqual(catalog.mcpServers.clarvia.args, ['-y', 'clarvia-mcp-server@latest']);
    assert.match(catalog.mcpServers.clarvia.description, /discovery/i, 'Expected clarvia description to mention discovery');
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
