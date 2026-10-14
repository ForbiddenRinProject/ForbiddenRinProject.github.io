"""An original fantasy garden score with synthesized birdsong, composed offline.

No audio, melody or arrangement is sampled from the supplied YouTube reference.
Requires NumPy; writes a stereo WAV at the command-line destination.
"""
import sys
import wave
import numpy as np

RATE = 44100
BEAT = 60 / 68
BARS = 32
DURATION = BARS * 4 * BEAT
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


def lute(note, duration=3.8):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    body = np.zeros_like(t)
    for partial in range(1, 9):
        decay = np.exp(-t * (.7 + partial * .36))
        body += np.sin(2 * np.pi * f * partial * t + partial * .19) * decay / partial ** 1.6
    return body * (1 - np.exp(-t / .006))


def strings(note, duration=5.8):
    t = np.arange(round(duration * RATE)) / RATE
    f = hz(note)
    envelope = np.sin(np.clip(np.minimum(t / 1.4, (duration - t) / 2.1), 0, 1) * np.pi / 2) ** 2
    body = np.zeros_like(t)
    for partial, weight in [(1, .6), (2, .17), (3, .09), (4, .045), (5, .02)]:
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


# D major with open fifths, added ninths, and space between the lead phrases.
chords = [
    [50, 57, 66, 69], [47, 54, 62, 66], [55, 62, 66, 69], [45, 57, 62, 64],
    [52, 59, 66, 67], [55, 62, 66, 69], [50, 57, 64, 66], [45, 57, 62, 64]
]
arpeggios = [[0, 2, 1, 3, 2, 1], [0, 1, 2, 3, 1, 2], [0, 2, 3, 1, 2, 3]]
offsets = [0, .75, 1.5, 2, 2.75, 3.5]
for bar in range(BARS):
    chord = chords[bar % 8]
    start = bar * 4 * BEAT
    for voice, note in enumerate(chord):
        add(music, strings(note - 12 if voice == 0 else note), start,
            gain=.025 if voice else .024, pan=(voice - 1.5) * .35)
    for index, offset in zip(arpeggios[(bar // 8) % 3], offsets):
        note = chord[index] + (12 if offset in [2, 3.5] and bar % 3 == 0 else 0)
        add(music, lute(note), start + offset * BEAT,
            gain=.07 if index else .055, pan=np.sin(bar * .4 + offset) * .48)
    if bar % 4 == 2:
        add(music, chime(chord[2] + 24), start + 2.8 * BEAT, gain=.012, pan=.45)

phrases = [
    [(78, 2), (76, 1), (74, 2), (None, 3)],
    [(74, 2), (76, 1), (78, 2), (81, 1), (None, 2)],
    [(83, 2), (81, 2), (78, 2), (None, 2)],
    [(76, 3), (74, 2), (73, 1), (None, 2)],
    [(78, 2), (81, 2), (83, 2), (None, 2)],
    [(81, 2), (78, 1), (76, 1), (74, 2), (None, 2)],
    [(76, 2), (78, 2), (74, 2), (None, 2)],
    [(73, 2), (76, 2), (74, 2), (None, 2)],
    [(86, 2), (83, 1), (81, 2), (None, 3)],
    [(81, 2), (78, 2), (76, 2), (None, 2)],
    [(78, 2), (81, 1), (83, 2), (81, 1), (None, 2)],
    [(76, 3), (74, 1), (73, 2), (None, 2)],
    [(79, 2), (78, 2), (76, 2), (None, 2)],
    [(78, 2), (74, 1), (76, 1), (81, 2), (None, 2)],
    [(78, 2), (76, 2), (74, 2), (None, 2)],
    [(76, 2), (73, 2), (74, 2), (None, 2)]
]
for index, phrase in enumerate(phrases):
    position = index * 8 * BEAT + .11
    for note, beats in phrase:
        if note is not None:
            add(music, flute(note, beats * BEAT * .87), position, gain=.037, pan=-.2)
        position += beats * BEAT

# Bird calls arrive in small, uneven clusters, panned around the garden.
call_times = [1.1, 7.4, 13.8, 22.1, 28.7, 36.3, 41.8, 49.2, 56.1, 64.8, 72.3, 79.7, 87.4, 95.1, 103.8, 109.4]
for cluster, start in enumerate(call_times):
    pan = [-.72, .6, -.3, .78, -.55][cluster % 5]
    count = 3 + cluster % 3
    for call in range(count):
        length = .12 + rng.uniform(0, .08)
        low = 2600 + rng.uniform(0, 1400)
        high = low + rng.uniform(550, 1700) * (1 if call % 2 == 0 else -.8)
        add(birds, chirp(low, high, length, 20 + call * 7), start + call * .27 + rng.uniform(0, .06),
            gain=.007 + rng.uniform(0, .003), pan=pan)
    if cluster % 3 == 1:
        add(birds, chirp(4100, 2900, .35, 31), start + count * .3, gain=.006, pan=pan * -.6)

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
print(f'Original garden score: {DURATION:.2f}s; stereo {RATE}Hz; peak {np.max(np.abs(score)):.3f}; RMS {np.sqrt(np.mean(score ** 2)):.3f}; {len(call_times)} birdsong clusters.')
