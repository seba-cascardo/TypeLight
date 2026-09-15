let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return null
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    // Audio must never break the typing flow.
    return null
  }
}

/** Run a sound routine, swallowing any audio error. */
function safely(fn: (c: AudioContext) => void) {
  const c = audio()
  if (!c) return
  try {
    fn(c)
  } catch {
    /* ignore */
  }
}

/** Short, soft keycap click. */
export function click() {
  safely((c) => {
  const t = c.currentTime
  const buffer = c.createBuffer(1, c.sampleRate * 0.03, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 2200
  filter.Q.value = 0.8
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.18, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  src.connect(filter).connect(gain).connect(c.destination)
  src.start(t)
  })
}

/** Low, dull thud for a wrong key. */
export function thud() {
  safely((c) => {
  const t = c.currentTime
  const osc = c.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(160, t)
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.12)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.16, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.15)
  })
}

/** Little ascending chime when an exercise is done. */
export function chime() {
  safely((c) => {
  const t = c.currentTime
  ;[523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.0001, t + i * 0.09)
    gain.gain.exponentialRampToValueAtTime(0.12, t + i * 0.09 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.35)
    osc.connect(gain).connect(c.destination)
    osc.start(t + i * 0.09)
    osc.stop(t + i * 0.09 + 0.4)
  })
  })
}
