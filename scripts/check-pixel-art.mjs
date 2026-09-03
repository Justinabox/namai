/**
 * Asserts every pixel frame is rectangular, that frames sharing a sprite share
 * dimensions, and that only known palette keys are used. Run: bun run art:check
 */
import { readFileSync } from 'node:fs'

const SOURCE = 'app/lib/pixelFrames.ts'
const src = readFileSync(SOURCE, 'utf8')

const PALETTE = new Set(['.', 'k', 'd', 'm', 'l', 'w'])

/** Sprites whose frames must all share one size. */
const GROUPS = {
  character: [
    'CHARACTER_IDLE', 'CHARACTER_BLINK', 'CHARACTER_WALK_A', 'CHARACTER_WALK_B',
    'CHARACTER_WAVE_UP', 'CHARACTER_WAVE_OUT', 'CHARACTER_STRETCH', 'CHARACTER_SIT',
  ],
  house: ['HOUSE_CLOSED', 'HOUSE_OPEN'],
  tree: ['TREE'],
  smoke: ['SMOKE'],
}

const frames = new Map()
for (const match of src.matchAll(/export const (\w+): PixelFrame = \[([\s\S]*?)\n\]/g)) {
  const rows = [...match[2].matchAll(/'([^']*)'/g)].map(m => m[1])
  frames.set(match[1], rows)
}

let failed = 0
const fail = (msg) => { console.error(`  ✗ ${msg}`); failed++ }

for (const [group, names] of Object.entries(GROUPS)) {
  let expected = null

  for (const name of names) {
    const rows = frames.get(name)
    if (!rows) { fail(`${name} not found in ${SOURCE}`); continue }

    const widths = new Set(rows.map(r => r.length))
    if (widths.size !== 1) {
      fail(`${name}: rows have mixed widths ${[...widths].join(', ')}`)
      rows.forEach((r, i) => {
        if (r.length !== rows[0].length) console.error(`      row ${i}: ${r.length} chars  "${r}"`)
      })
      continue
    }

    const bad = [...new Set([...rows.join('')])].filter(c => !PALETTE.has(c))
    if (bad.length) fail(`${name}: unknown palette keys ${bad.map(c => `"${c}"`).join(', ')}`)

    const size = `${rows[0].length}x${rows.length}`
    if (expected === null) expected = size
    else if (size !== expected) fail(`${name}: ${size} does not match ${group} baseline ${expected}`)

    if (!failed) console.log(`  ✓ ${name.padEnd(18)} ${size}`)
  }
}

if (failed) {
  console.error(`\n${failed} pixel art problem(s).`)
  process.exit(1)
}
console.log('\nAll pixel frames valid.')
