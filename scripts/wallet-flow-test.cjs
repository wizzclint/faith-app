const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const bs58 = require("bs58").default;
const crypto = require("node:crypto");
function keyPair() {
  const key = crypto.generateKeyPairSync("ed25519");
  return { publicKey: key.publicKey.export({ type: "spki", format: "der" }).subarray(-32), secretKey: key.privateKey };
}
const sign = (message, key) => new Uint8Array(crypto.sign(null, message, key));
function verify(message, signature, publicKey) {
  const key = crypto.createPublicKey({ type: "spki", format: "der", key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(publicKey)]) });
  return crypto.verify(null, message, key, signature);
}
function load(file, mocks) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.React } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, { module, exports: module.exports, require: id => id in mocks ? mocks[id] : require(id), TextEncoder, Uint8Array, Buffer, console });
  return module.exports;
}
async function fixture({ cached = null, cancel = false, fail = false } = {}) {
  const key = keyPair();
  const pubkey = bs58.encode(key.publicKey);
  const account = { address: "base64-address", publicKey: { toBase58: () => pubkey } };
  let verified = 0, sessions = 0, deauthorized = false, currentToken = null;
  const storage = new Map(cached ? [["faith-run:backend-auth", JSON.stringify(cached)]] : []);
  const { useAuthStore: store } = load("src/store/authStore.ts", {
    "@react-native-async-storage/async-storage": { getItem: async k => storage.get(k), setItem: async (k,v) => storage.set(k,v), removeItem: async k => storage.delete(k) },
    "../services/api/authToken": { setAuthToken: t => currentToken = t, setUnauthorizedHandler: () => {} },
    "../services/api/client": { ApiError: class extends Error {}, api: {
      challenge: async () => { if (fail) throw new Error("offline"); return { message: "FAITH test challenge", nonce: "nonce" }; },
      verify: async (address, nonce, signature) => {
        assert.equal(address, pubkey);
        assert.ok(verify(new TextEncoder().encode("FAITH test challenge"), bs58.decode(signature), key.publicKey));
        verified++; return { token: "test-token", user: { id: "player", pubkey } };
      }
    } },
    "../utils/walletErrors": { isWalletCancellation: e => e.message === "cancel", walletErrorMessage: () => null }
  });
  const wallet = { signMessages: async ({ payloads }) => {
    if (cancel) throw new Error("cancel");
    return payloads.map(message => new Uint8Array([...message, ...sign(message, key.secretKey)]));
  } };
  const { useMobileWallet } = load("src/utils/useMobileWallet.tsx", {
    "react": { useCallback: f => f, useMemo: f => f() },
    "@solana-mobile/mobile-wallet-adapter-protocol-web3js": { transact: async f => { sessions++; return f(wallet); } },
    "./useAuthorization": { useAuthorization: () => ({ authorizeSession: async () => account, authorizeSessionWithSignIn: async () => account, deauthorizeSession: async () => { deauthorized = true; } }) },
    "../store/authStore": { useAuthStore: store }
  });
  return { hook: useMobileWallet(), store, counts: () => ({ verified, sessions, deauthorized, currentToken }), pubkey, storage };
}
(async () => {
  let f = await fixture();
  await Promise.all([f.hook.connect(), f.hook.connect()]);
  assert.equal(f.counts().sessions, 1, "double taps share one wallet session");
  assert.equal(f.counts().verified, 1, "connecting automatically verifies a real signature");
  assert.equal(f.store.getState().pubkey, f.pubkey);
  await f.hook.connect(); assert.equal(f.counts().verified, 1, "valid session is reused");
  await f.hook.disconnect(); assert.equal(f.store.getState().token, null); assert.equal(f.counts().currentToken, null); assert.ok(f.counts().deauthorized);
  console.log("PASS automatic connect, signature extraction, duplicate connect, reuse, disconnect");
  f = await fixture({ cancel: true }); await f.hook.connect(); assert.equal(f.store.getState().status, "idle"); assert.equal(f.counts().verified, 0);
  console.log("PASS cancelled signing stays signed out and retryable");
  f = await fixture({ fail: true }); await f.hook.connect(); assert.equal(f.store.getState().status, "error"); assert.equal(f.store.getState().token, null);
  console.log("PASS server failure cannot authenticate the player");
  f = await fixture({ cached: { token: "expired-or-invalid-token", pubkey: "old-wallet", userId: "old-player" } });
  await f.hook.connect(); assert.equal(f.store.getState().pubkey, f.pubkey);
  console.log("PASS invalid stored credentials are replaced by the connected wallet");
  f = await fixture(); let resolveSignature;
  const pending = f.store.getState().signIn(f.pubkey, () => new Promise(r => resolveSignature = r));
  await new Promise(r => setImmediate(r)); await f.store.getState().signOut(); resolveSignature(new Uint8Array(64)); await pending;
  assert.equal(f.store.getState().token, null); assert.equal(f.counts().verified, 0);
  console.log("PASS late signing cannot restore a disconnected session");
})().catch(e => { console.error(e); process.exitCode = 1; });
