const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function deferred() { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; }
function fixture({ delayedWrite = false } = {}) {
  const storage = new Map();
  let queryData = { selectedAccount: null, authToken: "old-token" }, queryFn;
  const writeStarted = deferred(), finishWrite = deferred();
  const mocks = {
    react: { useCallback: f => f, useMemo: f => f() },
    "../config/links": { LEGAL_SITE: "https://example.test" },
    "../components/cluster/cluster-data-access": { useCluster: () => ({ selectedCluster: { network: "mainnet-beta" } }) },
    "@react-native-async-storage/async-storage": {
      getItem: async key => storage.get(key),
      setItem: async (key, value) => { writeStarted.resolve(); if (delayedWrite) await finishWrite.promise; storage.set(key, value); },
      removeItem: async key => storage.delete(key),
    },
    "@tanstack/react-query": {
      useQuery: options => { queryFn = options.queryFn; return { data: queryData, isLoading: false }; },
      useQueryClient: () => ({ setQueryData: (_key, value) => { queryData = value; }, cancelQueries: async () => {} }),
    },
  };
  const source = fs.readFileSync(path.join(__dirname, "../src/utils/useAuthorization.tsx"), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, { module, exports: module.exports, require: id => id in mocks ? mocks[id] : require(id) });
  return { hook: module.exports.useAuthorization(), storage, query: () => queryData, restore: () => queryFn(), writeStarted, finishWrite };
}
const result = { accounts: [{ address: Buffer.alloc(32, 1).toString("base64") }], auth_token: "test-token" };
(async () => {
  let f = fixture();
  await f.hook.authorizeSession({ authorize: async () => result });
  assert.ok(f.storage.has("authorization-cache"));
  await f.hook.clearAuthorization();
  assert.equal(f.query(), null);
  assert.equal(f.storage.has("authorization-cache"), false);
  assert.equal(await f.restore(), null);
  console.log("PASS local disconnect removes wallet cache and stays disconnected after restore");

  f = fixture();
  const response = deferred();
  const pending = f.hook.authorizeSession({ authorize: () => response.promise });
  const rejected = assert.rejects(pending, /cancelled by disconnect/);
  await f.hook.clearAuthorization();
  response.resolve(result);
  await rejected;
  assert.equal(f.query(), null);
  assert.equal(f.storage.size, 0);
  console.log("PASS disconnect invalidates a pending wallet authorization");

  f = fixture({ delayedWrite: true });
  const saving = f.hook.authorizeSession({ authorize: async () => result });
  const cancelledSave = assert.rejects(saving, /cancelled by disconnect/);
  await f.writeStarted.promise;
  const clearing = f.hook.clearAuthorization();
  f.finishWrite.resolve();
  await Promise.all([cancelledSave, clearing]);
  assert.equal(f.query(), null);
  assert.equal(f.storage.size, 0);
  assert.equal(await f.restore(), null);
  console.log("PASS a late authorization storage write cannot restore a disconnected wallet");
})().catch(e => { console.error(e); process.exitCode = 1; });
