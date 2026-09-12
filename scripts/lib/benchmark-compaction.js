const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { redactSecrets } = require('./benchmark-utils');

function samePath(left, right) {
  return typeof left === 'string' && typeof right === 'string'
    && path.resolve(left) === path.resolve(right);
}

// Compact the persisted exec thread, then close the server before exec resume continues it.
// An RPC acknowledgement alone is not evidence that compaction took place.
function compactCodexThread({
  threadId,
  workspace,
  env,
  configOverrides,
  expectedModel,
  expectedProvider,
  expectedReasoning,
  outputPath,
  timeoutMs,
  heartbeatMs = 0,
  onHeartbeat = () => {},
  spawn = childProcess.spawn,
}) {
  if (!threadId || !env?.CODEX_HOME || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Native compaction requires a persistent thread, its original Codex home, and a timeout');
  }
  const startedAt = Date.now();
  const args = [
    '--dangerously-bypass-hook-trust',
    ...configOverrides.flatMap((override) => ['-c', override]),
    'app-server', '--stdio',
  ];

  return new Promise((resolve) => {
    const output = fs.openSync(outputPath, 'wx');
    const child = spawn('codex', args, { cwd: workspace, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let buffer = '';
    let stderr = '';
    let finishing = false;
    let closed = false;
    let acknowledged = false;
    let compactRequested = false;
    let compactItemCompleted = false;
    let compactTurnCompleted = false;
    let shutdownTimer;
    let killTimer;
    let shutdownEscalated = false;
    const result = {
      completed: false,
      threadId,
      turnId: null,
      itemId: null,
      timedOut: false,
      error: null,
      events: outputPath,
      runtime: null,
      tokenUsage: null,
    };

    function finish(error = null) {
      if (finishing || closed) return;
      finishing = true;
      clearTimeout(timeout);
      if (heartbeat) clearInterval(heartbeat);
      result.error = error;
      result.completed = !error && acknowledged && compactItemCompleted && compactTurnCompleted;
      child.stdin.end();
      // EOF normally shuts down stdio. Bound shutdown as well as the model operation.
      shutdownTimer = setTimeout(() => {
        shutdownEscalated = true;
        child.kill('SIGTERM');
        killTimer = setTimeout(() => child.kill('SIGKILL'), 2000);
      }, 1000);
    }

    function send(message) {
      if (!finishing && !closed) child.stdin.write(JSON.stringify(message) + '\n');
    }

    function maybeComplete() {
      if (acknowledged && compactItemCompleted && compactTurnCompleted) finish();
    }

    function onMessage(message) {
      if (finishing || closed) return;
      if (message.error && [1, 2, 3].includes(message.id)) {
        finish(redactSecrets('Compaction RPC failed: ' + (message.error.message || 'unknown error')));
        return;
      }
      if (message.id === 1 && message.result) {
        if (!samePath(message.result.codexHome, env.CODEX_HOME)) {
          finish('Compaction server did not reuse the original isolated Codex home');
          return;
        }
        send({ method: 'initialized', params: {} });
        send({
          id: 2,
          method: 'thread/resume',
          params: { threadId, excludeTurns: true, sandbox: 'workspace-write' },
        });
        return;
      }
      if (message.id === 2 && message.result) {
        const state = message.result;
        result.runtime = {
          model: state.model,
          modelProvider: state.modelProvider,
          reasoningEffort: state.reasoningEffort,
          cwd: state.cwd,
          sandbox: state.sandbox,
          approvalPolicy: state.approvalPolicy,
        };
        if (state.thread?.id !== threadId || !samePath(state.cwd, workspace)
            || (expectedModel && state.model !== expectedModel)
            || (expectedProvider && state.modelProvider !== expectedProvider)
            || (expectedReasoning && state.reasoningEffort !== expectedReasoning)
            || state.sandbox?.type !== 'workspaceWrite') {
          finish('Compaction resumed a different thread or execution environment');
          return;
        }
        compactRequested = true;
        send({ id: 3, method: 'thread/compact/start', params: { threadId } });
        return;
      }
      if (compactRequested && message.id === 3 && message.result) {
        acknowledged = true;
        maybeComplete();
        return;
      }
      const params = message.params;
      if (!compactRequested || !params || params.threadId !== threadId) return;
      if (message.method === 'item/started' && params.item?.type === 'contextCompaction') {
        if (typeof params.turnId !== 'string' || !params.turnId
            || typeof params.item.id !== 'string' || !params.item.id) {
          finish('Compaction lifecycle is missing its turn or item ID');
          return;
        }
        if (result.turnId && (result.turnId !== params.turnId || result.itemId !== params.item.id)) {
          finish('A different compaction lifecycle replaced the active operation');
          return;
        }
        result.turnId = params.turnId;
        result.itemId = params.item.id;
      } else if (message.method === 'item/completed'
          && params.item?.type === 'contextCompaction'
          && params.turnId === result.turnId && params.item.id === result.itemId) {
        compactItemCompleted = true;
      } else if (message.method === 'turn/completed' && params.turn?.id === result.turnId) {
        if (params.turn.status !== 'completed') {
          finish(redactSecrets('Compaction turn ' + params.turn.status + ': '
            + (params.turn.error?.message || 'no completed compaction')));
          return;
        }
        compactTurnCompleted = true;
      } else if (message.method === 'error' && params.willRetry === false
          && (!params.turnId || !result.turnId || params.turnId === result.turnId)) {
        finish(redactSecrets(params.error?.message || 'Compaction failed'));
        return;
      } else if (message.method === 'thread/tokenUsage/updated'
          && (!result.turnId || params.turnId === result.turnId)) {
        result.tokenUsage = params.tokenUsage;
      }
      maybeComplete();
    }

    child.stdout.on('data', (chunk) => {
      fs.writeSync(output, chunk);
      buffer += chunk.toString('utf8');
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (!line.trim()) continue;
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          finish('Compaction server emitted invalid JSONL');
          continue;
        }
        onMessage(message);
      }
    });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
    child.stdin.on('error', (error) => finish(redactSecrets(error.message)));
    child.on('error', (error) => finish(redactSecrets(error.message)));
    child.on('close', (status, signal) => {
      closed = true;
      clearTimeout(timeout);
      clearTimeout(shutdownTimer);
      clearTimeout(killTimer);
      if (heartbeat) clearInterval(heartbeat);
      fs.closeSync(output);
      if (!finishing) {
        result.error = 'Compaction server closed before a matching compaction completed';
      }
      const expectedShutdown = shutdownEscalated && status === null
        && ['SIGTERM', 'SIGKILL'].includes(signal);
      if ((status !== 0 || signal) && !expectedShutdown) {
        result.completed = false;
        result.error ||= 'Compaction server exited unexpectedly (status=' + status + ', signal=' + signal + ')';
      }
      resolve({
        ...result,
        status,
        signal,
        stderr: redactSecrets(stderr),
        shutdownEscalated,
        durationMs: Date.now() - startedAt,
      });
    });
    const timeout = setTimeout(() => {
      result.timedOut = true;
      finish('Native compaction timed out');
    }, timeoutMs);
    const heartbeat = heartbeatMs > 0 ? setInterval(
      () => onHeartbeat(Date.now() - startedAt), heartbeatMs,
    ) : null;
    send({
      id: 1,
      method: 'initialize',
      params: { clientInfo: { name: 'engineering_flow_benchmark', version: '1.0.0' } },
    });
  });
}

module.exports = { compactCodexThread };
