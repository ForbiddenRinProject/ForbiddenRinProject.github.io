"""Original soft book/portal sound design, aligned with the entrance timeline.

Regenerate when animation stage timings change. No sampled audio is used.
Usage: python tools/compose-intro-sfx.py <temporary.wav>
"""
import sys
import wave
import numpy as np

RATE = 44100
DURATION = 6.8
LENGTH = round(RATE * DURATION)
score = np.zeros((LENGTH, 2), dtype=np.float64)
rng = np.random.default_rng(3308)


def noise(duration, low, high):
    count = round(duration * RATE)
    frequencies = np.fft.rfftfreq(count, 1 / RATE)
    shape = np.exp(-(low / np.maximum(frequencies, 1)) ** 4 - (frequencies / high) ** 4)
    shape /= np.sqrt(np.maximum(frequencies, 150))
    signal = np.fft.irfft(np.fft.rfft(rng.normal(0, 1, count)) * shape, n=count)
    return signal / max(float(np.sqrt(np.mean(signal ** 2))), 1e-8)


def add(signal, start, gain, pan=0):
    first = round(start * RATE)
    count = min(len(signal), LENGTH - first)
    stereo = signal[:count, None] * np.sqrt([(1 - pan) / 2, (1 + pan) / 2]) * gain
    score[first:first + count] += stereo


def chime(note, duration=1.7, reverse=False):
    t = np.arange(round(duration * RATE)) / RATE
    frequency = 440 * 2 ** ((note - 69) / 12)
    envelope = (1 - np.exp(-t / .018)) * np.exp(-t / .55)
    body = np.sin(2 * np.pi * frequency * t) + .14 * np.sin(2 * np.pi * frequency * 2.006 * t)
    signal = envelope * body
    return signal[::-1] if reverse else signal


# 0.000: levitation. Breath-like air rises toward the listener, with warm harmonics.
duration = 1.85
t = np.arange(round(duration * RATE)) / RATE
p = t / duration
envelope = np.sin(np.pi * p) ** 1.3
air = noise(duration, 180, 4300) * (.72 + .28 * np.sin(2 * np.pi * 2.1 * t))
frequency = 105 + 115 * p ** .7
tone = np.sin(2 * np.pi * np.cumsum(frequency) / RATE) * .2
add((air + tone) * envelope, 0, .06, -.18)
for start, note in [(.25, 74), (.52, 81), (.9, 86), (1.2, 88)]:
    add(chime(note, 1.25), start, .011, .25)

# 2.050: a restrained leather-binding creak and a soft paper release.
duration = .84
t = np.arange(round(duration * RATE)) / RATE
envelope = np.sin(np.pi * t / duration) ** 1.6
phase = 2 * np.pi * np.cumsum(180 - 57 * t / duration + 18 * np.sin(t * 19)) / RATE
binding = (.7 * np.sin(phase) + .15 * np.sin(phase * 2.2)) * envelope
add(binding, 2.05, .042, -.15)
add(noise(duration, 500, 4800) * envelope * (.45 + .55 * np.sin(t * 47) ** 2), 2.05, .024, .15)
t = np.arange(round(.17 * RATE)) / RATE
add(np.sin(2 * np.pi * 138 * t) * np.exp(-t * 31) * (1 - np.exp(-t * 170)), 2.08, .053)

# 3.150, 3.370, 3.590, 3.810, 4.030: each individual leaf turns right to left.
for page in range(5):
    duration = .34 + page * .012
    t = np.arange(round(duration * RATE)) / RATE
    p = t / duration
    flutter = .52 + .48 * np.sin(2 * np.pi * (15 + page * 2) * t + page) ** 2
    envelope = np.sin(np.pi * p) ** .9
    silk = noise(duration, 850 + page * 85, 7600) * envelope * flutter
    add(silk, 3.15 + page * .22, .047 + page * .003, .45 - page * .22)
    tap_t = np.arange(round(.07 * RATE)) / RATE
    add(noise(.07, 400, 3500) * np.exp(-tap_t * 62) * (1 - np.exp(-tap_t * 280)),
        3.15 + page * .22 + .235, .019, -.35)

# 4.450: a gentle inward draw, peaking as the screen reaches white at 4.930.
duration = 2.2
t = np.arange(round(duration * RATE)) / RATE
attack = np.clip(t / .48, 0, 1)
release = np.exp(-np.maximum(t - .48, 0) / .58)
envelope = np.sin(attack * np.pi / 2) ** 2 * release
pull = noise(duration, 140, 5700) * envelope
add(pull, 4.45, .083, .08)
frequency = 115 + 160 * np.minimum(t / .48, 1)
hum = np.sin(2 * np.pi * np.cumsum(frequency) / RATE) * envelope
add(hum, 4.45, .019, -.12)
for note, start, pan in [(81, 4.45, -.45), (86, 4.58, .35), (88, 4.66, -.18)]:
    add(chime(note, .56, reverse=True), start, .013, pan)
for note, offset, pan in [(86, 0, -.35), (90, .07, .3), (93, .16, -.12)]:
    add(chime(note, 1.6), 4.93 + offset, .022, pan)

# Short diffuse reflections, with no wrapped sound before the first click.
dry = score.copy()
for seconds, gain in [(.083,.12),(.171,.10),(.289,.08),(.431,.06),(.637,.04)]:
    delay = round(seconds * RATE)
    score[delay:] += dry[:-delay, ::-1] * gain
score *= .58 / max(float(np.max(np.abs(score))), 1e-8)
fade = round(.24 * RATE)
score[-fade:] *= np.linspace(1, 0, fade)[:, None]
pcm = (np.clip(score, -1, 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as output:
    output.setnchannels(2); output.setsampwidth(2); output.setframerate(RATE); output.writeframes(pcm.tobytes())
print(f'Book cinematic: {DURATION:.1f}s, stereo; peak {np.max(np.abs(score)):.3f}; RMS {np.sqrt(np.mean(score ** 2)):.3f}.')
for name, begin, end in [('lift',0,1.85),('cover',2.05,2.95),('pages',3.15,4.4),('portal',4.45,6.8)]:
    segment=score[round(begin*RATE):round(end*RATE)]
    print(f'{name}: onset {begin:.3f}s, RMS {np.sqrt(np.mean(segment ** 2)):.3f}')
