"""An original wistful fantasy journey in 6/8, composed offline.

Broad direction: the user-supplied Frieren fantasy playlist (8nPcrz4mZQM).
The reference was identified via web metadata, not directly auditioned.

No audio, melody or arrangement is sampled from the supplied YouTube reference.
Requires NumPy; writes a stereo WAV at the command-line destination.
"""
import sys
import wave
import numpy as np

RATE = 44100
BEAT = 60 / 108
BARS = 48
DURATION = BARS * 6 * BEAT
LENGTH = round(DURATION * RATE)
rng = np.random.default_rng(8173)
music = np.zeros((LENGTH, 2), dtype=np.float64)
birds = np.zeros_like(music)


def hz(note):
    return 440 * 2 ** ((note - 69) / 12)


def add(destination, signal, start, gain=1, pan=0):
    start = round(start * RATE) % LENGTH
    stereo = signal[:, None] * np.sqrt([(1 - pan) / 2, (1 + pan) / 2]) * gain
    first = min(len(signal), LENGTH - start)
    destination[start:start + first] += stereo[:first]
    if first < len(signal):
        destination[:len(signal) - first] += stereo[first:]


def harp(note, duration=3.8):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    body = np.zeros_like(t)
    for partial in range(1, 9):
        decay = np.exp(-t * (.7 + partial * .29))
        body += np.sin(2 * np.pi * f * partial * t + partial * .19) * decay / partial ** 2.0
    return body * (1 - np.exp(-t / .006))


def strings(note, duration=5.8):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    envelope = np.sin(np.clip(np.minimum(t / 1.4, (duration - t) / 2.1), 0, 1) * np.pi / 2) ** 2
    body = np.zeros_like(t)
    for partial, weight in [(1, .52), (2, .2), (3, .12), (4, .065), (5, .035), (6, .018)]:
        body += weight * np.sin(2 * np.pi * f * partial * t + .13 * np.sin(2 * np.pi * 4.5 * t))
        body += weight * .5 * np.sin(2 * np.pi * f * partial * 1.0017 * t + .4)
    return body * envelope


def flute(note, duration):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    frequency = f * (1 + .0015 * np.sin(2 * np.pi * 4.9 * t) * np.minimum(1, t / .45))
    phase = 2 * np.pi * np.cumsum(frequency) / RATE
    envelope = np.sin(np.clip(np.minimum(t / .19, (duration - t) / .4), 0, 1) * np.pi / 2) ** 2
    air = np.convolve(rng.normal(0, 1, len(t)), np.ones(11) / 11, mode='same')
    return envelope * (np.sin(phase) + .09 * np.sin(2 * phase) + .045 * np.sin(3 * phase) + .035 * air)


def chime(note):
    t = np.arange(round(5.5 * RATE)) / RATE
    f = hz(note)
    envelope = (1 - np.exp(-t / .008)) * np.exp(-t / 1.8)
    return envelope * (np.sin(2 * np.pi * f * t) + .2 * np.sin(2 * np.pi * f * 2.003 * t) * np.exp(-t))


def chirp(start_hz, end_hz, duration, trill):
    t = np.arange(round(duration * RATE)) / RATE
    p = t / duration
    frequency = start_hz + (end_hz - start_hz) * (p ** .7) + 130 * np.sin(2 * np.pi * trill * t)
    phase = 2 * np.pi * np.cumsum(frequency) / RATE
    envelope = np.sin(np.pi * np.clip(p, 0, 1)) ** 1.7
    return envelope * (np.sin(phase) + .09 * np.sin(phase * 2))


# E minor opens into G major, with suspended cadences and an open final fifth.
# Three sixteen-bar sections build, bloom, and settle into the opening harmony.
chords = [
    [40, 59, 64, 67], [48, 55, 62, 64], [43, 59, 62, 69], [50, 57, 62, 66],
    [45, 57, 60, 64], [40, 59, 64, 67], [48, 55, 59, 64], [47, 54, 59, 66],
    [43, 55, 59, 62], [50, 57, 62, 66], [40, 59, 64, 67], [48, 55, 62, 64],
    [45, 57, 60, 64], [48, 55, 59, 64], [50, 57, 62, 64], [47, 54, 59, 66]
]
for bar in range(BARS):
    chord = chords[bar % 16]
    start = bar * 6 * BEAT
    section = bar // 16
    swell = [.78, 1.0, .7][section]
    for voice, note in enumerate(chord):
        add(music, strings(note, 6 * BEAT + 2.1), start,
            gain=(.039 if voice == 0 else .024) * swell, pan=(voice - 1.5) * .33)
    pattern = [0, 1, 2, 3, 2, 1] if bar % 2 == 0 else [0, 2, 1, 3, 1, 2]
    for step, index in enumerate(pattern):
        note = chord[index] + (12 if index == 0 else 0)
        add(music, harp(note), start + step * BEAT + (.018 if step % 3 else 0),
            gain=.072 if step % 3 == 0 else .054, pan=-.36 + step * .11)
    if section == 1:
        for step in [1.5, 4.5]:
            add(music, harp(chord[2] + 12), start + step * BEAT, gain=.022, pan=.48)
    if bar % 8 == 0:
        add(music, chime(chord[2] + 24), start + .08, gain=.008, pan=.5)

# A new lyrical theme in twelve-eighth-note phrases; each pair occupies two bars.
phrases = [
    [(76,3),(79,2),(78,1),(76,3),(71,2),(None,1)],
    [(74,2),(76,1),(79,3),(78,3),(74,2),(None,1)],
    [(72,3),(76,2),(74,1),(72,2),(71,1),(69,2),(None,1)],
    [(71,3),(74,2),(78,1),(76,3),(None,3)],
    [(79,3),(83,2),(81,1),(79,3),(78,2),(None,1)],
    [(76,2),(78,1),(79,3),(76,3),(74,2),(None,1)],
    [(72,3),(74,2),(76,1),(79,3),(76,2),(None,1)],
    [(74,3),(71,3),(76,3),(None,3)]
]
for section in range(3):
    for index, phrase in enumerate(phrases):
        position = (section * 96 + index * 12) * BEAT + .07
        for note, beats in phrase:
            if note is not None:
                add(music, flute(note, beats * BEAT * .94), position,
                    gain=[.046,.055,.038][section], pan=-.12)
                # Quiet lower-octave strings answer the theme in the middle section.
                if section == 1 and beats >= 3:
                    add(music, strings(note - 12, beats * BEAT + .55), position + .04,
                        gain=.016, pan=.3)
            position += beats * BEAT

# Bird calls arrive in small, uneven clusters, panned around the garden.
call_times = [4.1, 19.4, 38.8, 61.1, 83.7, 107.3, 128.8, 148.2]
for cluster, start in enumerate(call_times):
    pan = [-.72, .6, -.3, .78, -.55][cluster % 5]
    count = 3 + cluster % 3
    for call in range(count):
        length = .12 + rng.uniform(0, .08)
        low = 2600 + rng.uniform(0, 1400)
        high = low + rng.uniform(550, 1700) * (1 if call % 2 == 0 else -.8)
        add(birds, chirp(low, high, length, 20 + call * 7), start + call * .27 + rng.uniform(0, .06),
            gain=.004 + rng.uniform(0, .002), pan=pan)
    if cluster % 3 == 1:
        add(birds, chirp(4100, 2900, .35, 31), start + count * .3, gain=.003, pan=pan * -.6)

# Circular room reverberation keeps tails continuous at the end of the loop.
dry = music.copy()
for delay, gain in [(.079,.08),(.173,.1),(.311,.09),(.487,.074),(.683,.062),(.919,.045),(1.219,.032),(1.719,.022)]:
    music += np.roll(dry[:, ::-1], round(delay * RATE), axis=0) * gain
del dry
birds += np.roll(birds[:, ::-1], round(.19 * RATE), axis=0) * .13
score = music + birds
score = np.tanh(score * 1.5)
score *= .68 / max(float(np.max(np.abs(score))), 1e-6)
pcm = (np.clip(score, -1, 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as output:
    output.setnchannels(2); output.setsampwidth(2); output.setframerate(RATE); output.writeframes(pcm.tobytes())
print(f'Original wistful journey score: {DURATION:.2f}s; stereo {RATE}Hz; peak {np.max(np.abs(score)):.3f}; RMS {np.sqrt(np.mean(score ** 2)):.3f}; {len(call_times)} birdsong clusters.')
