"""Compose an original, loopable ambient score for Forbidden (no borrowed melody).

Offline only: requires NumPy; writes a temporary WAV supplied on the command line.
The hosted site plays the compressed MP3 in dist/assets/under-the-stars.mp3.
"""
import sys
import wave
import numpy as np

RATE = 44100
BPM = 64
BEAT = 60 / BPM
DURATION = 64 * BEAT
LENGTH = round(DURATION * RATE)
score = np.zeros((LENGTH, 2), dtype=np.float64)
rng = np.random.default_rng(418)


def hz(note):
    return 440 * 2 ** ((note - 69) / 12)


def add(signal, start, gain=1, pan=0):
    start = round(start * RATE) % LENGTH
    stereo = signal[:, None] * np.array([
        np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    ])[None, :] * gain
    first = min(len(signal), LENGTH - start)
    score[start:start + first] += stereo[:first]
    if first < len(signal):
        score[:len(signal) - first] += stereo[first:]


def harp(note, duration=3.4):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    env = (1 - np.exp(-t / .009)) * np.exp(-t / 1.18)
    return env * (np.sin(2*np.pi*f*t) + .28*np.sin(2*np.pi*f*2*t)*np.exp(-t/.7)
                  + .12*np.sin(2*np.pi*f*3*t)*np.exp(-t/.34))


def pad(note, duration):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    phase = rng.uniform(0, 2*np.pi)
    env = np.minimum(1, t / 1.6) * np.minimum(1, (duration - t) / 2.3)
    env = np.sin(np.clip(env, 0, 1)*np.pi/2)**2
    body = (.55*np.sin(2*np.pi*f*t + phase)
            + .3*np.sin(2*np.pi*f*1.0013*t + phase)
            + .12*np.sin(2*np.pi*f*2*t + .35*np.sin(2*np.pi*.32*t)))
    return env * body


def flute(note, duration):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    env = np.minimum(1, t / .32) * np.minimum(1, (duration - t) / .55)
    env = np.sin(np.clip(env, 0, 1)*np.pi/2)**2
    phase = 2*np.pi*f*t + .13*np.sin(2*np.pi*4.7*t)
    return env * (np.sin(phase) + .045*np.sin(phase*2) + .018*np.sin(phase*3))


# E minor, C major 7, G add 9, D suspended; a gentler second half varies the voicing.
chords = [
    [52, 59, 64, 67], [48, 55, 59, 64], [43, 55, 59, 62], [50, 57, 62, 64],
    [52, 59, 64, 67], [48, 55, 59, 64], [45, 57, 60, 64], [50, 57, 62, 66],
    [52, 59, 64, 67], [48, 55, 59, 64], [43, 55, 59, 62], [50, 57, 62, 64],
    [45, 57, 60, 64], [47, 54, 59, 62], [52, 59, 64, 67], [50, 57, 62, 64]
]
pattern = [0, 2, 1, 3, 2, 1, 3, 2]
for bar, chord in enumerate(chords):
    start = bar * 4 * BEAT
    for voice, note in enumerate(chord):
        add(pad(note - 12 if voice == 0 else note, 7.2), start,
            gain=.037 if voice == 0 else .026, pan=(voice-1.5)*.37)
    for step, index in enumerate(pattern):
        add(harp(chord[index] + (12 if step in [3, 6] else 0)),
            start + step * BEAT/2, gain=.09 if index else .065,
            pan=np.sin(step*.8 + bar*.5)*.5)
    if bar % 2 == 0:
        add(harp(chord[3]+24, 4.2), start + 2.5*BEAT, gain=.019, pan=.35)

# Original eight-beat phrases. The space between notes is part of the arrangement.
phrases = [
    [(76,2),(79,1),(83,1),(81,2),(79,2)],
    [(79,3),(78,1),(76,2),(74,2)],
    [(76,2),(78,2),(79,3),(76,1)],
    [(72,2),(76,2),(78,2),(74,2)],
    [(83,2),(81,2),(79,2),(76,2)],
    [(79,3),(78,1),(74,2),(76,2)],
    [(76,2),(79,2),(78,2),(74,2)],
    [(78,2),(76,2),(74,2),(None,2)]
]
for phrase_index, phrase in enumerate(phrases):
    beat = phrase_index*8
    for note, duration in phrase:
        if note is not None:
            add(flute(note, duration*BEAT*.87), beat*BEAT+.08,
                gain=.038, pan=-.18)
        beat += duration

# Circular delay tails preserve the continuity of the loop.
dry = score.copy()
for seconds, amount in [(.137,.12),(.283,.105),(.467,.085),(.719,.062),(1.12,.042)]:
    delayed = np.roll(dry, round(seconds*RATE), axis=0)
    score += delayed[:, ::-1] * amount
peak = float(np.max(np.abs(score)))
score *= .64 / max(peak, 1e-6)
pcm = (np.clip(score,-1,1)*32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as out:
    out.setnchannels(2)
    out.setsampwidth(2)
    out.setframerate(RATE)
    out.writeframes(pcm.tobytes())
print(f'Original score: {DURATION:.1f}s, stereo {RATE}Hz, peak {np.max(np.abs(score)):.3f}, RMS {np.sqrt(np.mean(score**2)):.3f}')
