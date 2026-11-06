const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, mocks) {
  const js = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, { module, exports: module.exports, console: { warn: () => {} }, require: id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith("../../../assets/audio/")) return 1;
    throw new Error("Missing mock: " + id);
  } });
  return module.exports;
}
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture({ active = true, enabled = true, loaded = true, sourceWait = Promise.resolve(), failPlay = false } = {}) {
  let playing = false, listener, loadCalls = 0, created = 0, released = false, mode;
  let refIndex = 0, effectIndex = 0;
  const refs = [], effects = [], events = [];
  const app = { currentState: "active", addEventListener: (_event, cb) => { listener = cb; return { remove: () => listener = null }; } };
  const player = {
    play: () => { assert.equal(released, false, "play after release"); if (failPlay) throw Error("audio unavailable"); playing = true; events.push("play"); },
    pause: () => { assert.equal(released, false, "pause after release"); playing = false; events.push("pause"); },
    release: () => { assert.equal(released, false, "released twice"); released = true; events.push("release"); },
  };
  const { useGameMusic } = load("src/game/audio/useGameMusic.ts", {
    react: {
      useRef: value => refs[refIndex++] ||= { current: value },
      useEffect: (effect, deps) => {
        const index = effectIndex++, previous = effects[index];
        if (previous && deps.every((value, i) => value === previous.deps[i])) return;
        if (previous?.cleanup) previous.cleanup();
        effects[index] = { deps, cleanup: effect() };
      },
    },
    "react-native": { AppState: app },
    "expo-audio": {
      createAudioPlayer: source => { created++; assert.equal(source.uri, "/cache/theme.m4a"); return player; },
      setAudioModeAsync: async value => { mode = value; },
    },
    "./bundledAudio": { bundledAudioSource: async () => { await sourceWait; return { uri: "/cache/theme.m4a" }; } },
    "../../store/settingsStore": { useSettingsStore: select => select({ musicEnabled: enabled, loaded, load: () => loadCalls++ }) },
  });
  const render = value => { active = value; refIndex = 0; effectIndex = 0; useGameMusic(active); };
  render(active);
  return { player, events, mode: () => mode, created: () => created, playing: () => playing,
    state: value => { app.currentState = value; listener?.(value); },
    cleanup: () => effects.forEach(effect => effect.cleanup?.()), render, released: () => released,
    listening: () => !!listener, loadCalls: () => loadCalls };
}
(async () => {
  let f = fixture(); await flush();
  assert.equal(f.player.loop, true); assert.ok(f.player.volume > 0 && f.player.volume < .5);
  assert.equal(f.playing(), true); assert.equal(f.mode().shouldPlayInBackground, false);
  assert.equal(f.mode().shouldRouteThroughEarpiece, false);
  f.state("background"); assert.equal(f.playing(), false);
  f.state("active"); assert.equal(f.playing(), true);
  f.render(false); assert.equal(f.playing(), false);
  f.render(true); assert.equal(f.playing(), true);
  assert.equal(f.created(), 1, "pause/resume reuses the player");
  f.cleanup(); assert.equal(f.playing(), false); assert.equal(f.listening(), false);
  assert.equal(f.released(), true); assert.deepEqual(f.events.slice(-2), ["pause", "release"]);
  console.log("PASS music uses local file, loops, pauses/resumes and stops before a single release on exit");

  for (const options of [{ active: false }, { enabled: false }, { loaded: false }]) {
    f = fixture(options); await flush(); assert.equal(f.playing(), false);
    f.state("active"); assert.equal(f.playing(), false); f.cleanup();
  }
  f = fixture({ loaded: false }); assert.equal(f.loadCalls(), 1); f.cleanup(); await flush();
  let finishSource;
  f = fixture({ sourceWait: new Promise(resolve => finishSource = resolve) });
  f.cleanup(); finishSource(); await flush();
  assert.equal(f.created(), 0, "leaving while loading must not create a player later");
  f = fixture({ failPlay: true }); await flush(); f.cleanup();
  console.log("PASS music off, late loading and playback failure cannot restart audio after leaving or crash cleanup");

  for (const [platform, uri, expected] of [
    ["android", "file:///data/user/0/app/cache/theme%20loop.m4a", "/data/user/0/app/cache/theme loop.m4a"],
    ["ios", "file:///cache/theme.m4a", "file:///cache/theme.m4a"],
    ["web", "https://example.test/theme.m4a", "https://example.test/theme.m4a"],
  ]) {
    let downloaded = false;
    const { bundledAudioSource } = load("src/game/audio/bundledAudio.ts", {
      "expo-asset": { Asset: { fromModule: id => { assert.equal(id, 1); return { downloadAsync: async () => { downloaded = true; return { localUri: uri }; } }; } } },
      "react-native": { Platform: { OS: platform } },
    });
    assert.equal((await bundledAudioSource(1)).uri, expected); assert.ok(downloaded);
  }
  assert.ok(fs.statSync(path.join(__dirname, "../assets/audio/faith-run-theme.m4a")).size > 10000);
  console.log("PASS bundled music paths match SDK 52 Android file handling and preserve iOS/web URIs");

  let effectsPlayed = 0;
  const { soundManager, prepareGameSounds } = load("src/game/audio/soundManager.ts", {
    "expo-audio": { createAudioPlayer: () => ({ seekTo: async () => { throw Error("seek failed"); }, play: () => effectsPlayed++ }) },
    "./bundledAudio": { bundledAudioSource: async () => ({ uri: "/cache/effect.mp3" }) },
    "../../store/settingsStore": { useSettingsStore: { getState: () => ({ soundEnabled: true }) } },
  });
  await prepareGameSounds(); soundManager.playCoin(); await flush(); assert.equal(effectsPlayed, 1);
  console.log("PASS a rejected sound-effect seek is handled without an unhandled rejection");
})().catch(error => { console.error(error); process.exitCode = 1; });
