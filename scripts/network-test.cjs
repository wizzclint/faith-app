const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const web3 = require("@solana/web3.js");
function load(file, mocks, env = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, { module, exports: module.exports, require: id => id in mocks ? mocks[id] : require(id), process: { env }, Buffer, console });
  return module.exports;
}
(async () => {
  const { resolveNetwork, solanaNetwork } = load("src/config/network.ts", {});
  assert.equal(solanaNetwork.cluster, "devnet");
  for (const cluster of ["devnet", "testnet", "mainnet-beta"]) {
    assert.equal(resolveNetwork(cluster).endpoint, web3.clusterApiUrl(cluster));
    assert.equal(load("src/config/network.ts", {}, { EXPO_PUBLIC_SOLANA_CLUSTER: cluster }).solanaNetwork.cluster, cluster);
    let authorizedChain;
    const query = { setQueryData: () => {} };
    const { useAuthorization } = load("src/utils/useAuthorization.tsx", {
      react: { useCallback: f => f, useMemo: f => f() },
      "@react-native-async-storage/async-storage": { setItem: async () => {} },
      "@tanstack/react-query": { useQueryClient: () => query, useQuery: () => ({ data: null, isLoading: false }), useMutation: ({ mutationFn, onSuccess }) => ({ mutateAsync: async value => { await mutationFn(value); onSuccess(null, value); } }) },
      "../components/cluster/cluster-data-access": { useCluster: () => ({ selectedCluster: { network: cluster } }) },
      "../config/links": { LEGAL_SITE: "https://example.test" },
    });
    await useAuthorization().authorizeSession({ authorize: async request => {
      authorizedChain = request.chain;
      return { accounts: [{ address: Buffer.alloc(32, 1).toString("base64") }], auth_token: "test" };
    } });
    assert.equal(authorizedChain, `solana:${cluster}`);
  }
  assert.equal(resolveNetwork("mainnet-beta", "https://rpc.example.test").endpoint, "https://rpc.example.test");
  assert.throws(() => resolveNetwork("typo"), /Unsupported/);
  assert.throws(() => resolveNetwork("devnet", "http://rpc.example.test"), /HTTPS/);
  console.log("PASS wallet chain and RPC agree on devnet, testnet and mainnet; invalid configurations fail");
})().catch(e => { console.error(e); process.exitCode = 1; });
