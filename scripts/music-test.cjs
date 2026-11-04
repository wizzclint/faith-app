const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const file = path.join(__dirname, "../src/game/audio/useGameMusic.ts");
const js = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function fixture({ active = true, enabled = true, loaded = true } = {}) {
  let playing = false, listener, loadCalls = 0;
  const cleanups = [];
  const player = { play: () => playing = true, pause: () => playing = false };
  const module = { exports: {} };
  const mocks = {
    react: { useEffect: f => { const cleanup = f(); if (cleanup) cleanups.push(cleanup); } },
    "react-native": { AppState: { currentState: "active", addEventListener: (event, cb) => { listener = cb; return { remove: () => listener = null }; } } },
    "expo-audio": { useAudioPlayer: () => player, setAudioModeAsync: async mode => assert.equal(mode.shouldPlayInBackground, false) },
    "../../store/settingsStore": { useSettingsStore: select => select({ musicEnabled: enabled, loaded, load: () => loadCalls++ }) },
    "../../../assets/audio/faith-run-theme.m4a": 1,
  };
  vm.runInNewContext(js, { module, exports: module.exports, require: id => { assert.ok(id in mocks, id); return mocks[id]; } });
  module.exports.useGameMusic(active);
  return { player, playing: () => playing, state: value => listener(value), cleanup: () => cleanups.forEach(f => f()), listening: () => !!listener, loadCalls: () => loadCalls };
}
const f = fixture();
assert.equal(f.player.loop, true); assert.ok(f.player.volume > 0 && f.player.volume < .5); assert.equal(f.playing(), true);
f.state("background"); assert.equal(f.playing(), false); f.state("active"); assert.equal(f.playing(), true);
f.cleanup(); assert.equal(f.playing(), false); assert.equal(f.listening(), false);
console.log("PASS music loops at reduced volume, pauses in background and releases on exit");
for (const options of [{ active: false }, { enabled: false }, { loaded: false }]) {
  const f = fixture(options); assert.equal(f.playing(), false); f.state("active"); assert.equal(f.playing(), false); f.cleanup();
}
assert.equal(fixture({ loaded: false }).loadCalls(), 1);
assert.ok(fs.statSync(path.join(__dirname, "../assets/audio/faith-run-theme.m4a")).size > 10000);
console.log("PASS pause, Music off and unloaded preferences prevent music playback");
