"""Render the original FAITH RUN theme. Python standard library + ffmpeg only.
124 BPM, A minor, 16 bars. No sampled music or external recordings.
Run from faith-app: python scripts/compose-music.py
"""
from array import array
from pathlib import Path
import math
import random
import subprocess
import tempfile
import wave

RATE = 44100
BEAT = 60 / 124
LENGTH = 64 * BEAT
N = round(LENGTH * RATE)
left, right = array("f", [0]) * N, array("f", [0]) * N
rng = random.Random(124)
TAU = math.tau

def add(start, samples, gain=1, pan=0):
    offset = round(start * RATE)
    gl, gr = gain * (1 - pan) * .5, gain * (1 + pan) * .5
    for i, value in enumerate(samples):
        j = (offset + i) % N
        left[j] += value * gl
        right[j] += value * gr

def note(midi, duration, kind):
    freq = 440 * 2 ** ((midi - 69) / 12)
    for i in range(round(duration * RATE)):
        t = i / RATE
        envelope = min(t / .008, 1) * min((duration - t) / .04, 1)
        if kind == "bass":
            value = math.sin(TAU * freq * t) + .24 * math.sin(TAU * freq * 2 * t)
            envelope *= math.exp(-3 * t)
        elif kind == "pad":
            value = .65 * math.sin(TAU * freq * t) + .25 * math.sin(TAU * freq * 1.003 * t)
            envelope *= min(t / .18, 1)
        else:
            value = math.sin(TAU * freq * t) + .28 * math.sin(TAU * freq * 2 * t)
            envelope *= math.exp(-7 * t)
        yield value * envelope

# Am - F - C - G: pulsing bass, soft pads and a bright eighth-note arpeggio.
chords = [(45, [69, 72, 76]), (41, [65, 69, 72]), (48, [67, 72, 76]), (43, [67, 71, 74])]
for bar in range(16):
    bass, chord = chords[(bar // 2) % 4]
    start = bar * 4 * BEAT
    for voice in chord:
        add(start, note(voice - 12, 4 * BEAT, "pad"), .07, (voice % 3 - 1) * .35)
    for step in range(8):
        when = start + step * BEAT / 2
        add(when, note(bass + (12 if step == 7 else 0), BEAT * .38, "bass"), .34)
        tone = chord[[0, 1, 2, 1, 0, 2, 1, 2][step]] + (12 if bar >= 8 and step == 6 else 0)
        add(when, note(tone, BEAT * .48, "pluck"), .16, -.28 if step % 2 else .28)
        add(when + BEAT * .75, note(tone, BEAT * .48, "pluck"), .035, .45 if step % 2 else -.45)
    for beat in range(4):
        # Rounded kick with a downward pitch sweep.
        kick = (math.sin(TAU * (48 * (i / RATE) + 8 * (1 - math.exp(-35 * i / RATE)))) * math.exp(-19 * i / RATE) for i in range(round(.23 * RATE)))
        add(start + beat * BEAT, kick, .62)
        if beat % 2:
            snare = ((rng.uniform(-1, 1) * .65 + .25 * math.sin(TAU * 180 * i / RATE)) * math.exp(-29 * i / RATE) * min(i / (RATE * .002), 1) for i in range(round(.15 * RATE)))
            add(start + beat * BEAT, snare, .31, -.1)
    for step in range(8):
        hat = (rng.uniform(-1, 1) * math.exp(-100 * i / RATE) for i in range(round(.055 * RATE)))
        add(start + step * BEAT / 2, hat, .105 if step % 2 else .07, .35)

# Light sidechain movement and a soft limiter leave room for game effects.
frames = array("h")
for i in range(N):
    phase = (i / RATE) % BEAT
    pump = .72 + .28 * min(phase / .12, 1)
    frames.append(round(math.tanh(left[i] * pump * 1.5) * 26500))
    frames.append(round(math.tanh(right[i] * pump * 1.5) * 26500))
output = Path(__file__).resolve().parents[1] / "assets/audio/faith-run-theme.m4a"
with tempfile.TemporaryDirectory() as directory:
    wav = Path(directory) / "theme.wav"
    with wave.open(str(wav), "wb") as stream:
        stream.setnchannels(2)
        stream.setsampwidth(2)
        stream.setframerate(RATE)
        stream.writeframes(frames.tobytes())
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-metadata", "title=FAITH RUN - Afterglow", str(output)], check=True)
print(f"Rendered {output.name}: {LENGTH:.2f}s, {output.stat().st_size:,} bytes")
