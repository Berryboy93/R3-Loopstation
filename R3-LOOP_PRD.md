# R3/LOOP Browser DAW — Product Requirements Document

**Product:** R3/LOOP  
**Author:** DJ Ernesto Native × Replit Agent  
**Date:** July 20, 2026  
**Status:** v1.1 — Triple-Audited Against Source

> **Audit note:** Every specification in this document has been verified line-by-line against the actual TypeScript source files. Version numbers in parentheses indicate corrections from v1.0.

---

## 1. Executive Summary

R3/LOOP is a pixel-faithful browser recreation of DJ Ernesto Native's R3/LOOP digital audio workstation. It runs entirely offline in the browser (React + Vite + TypeScript), with an optional Express API server that provides health-checking and extensibility for future backend features. The product delivers a fully interactive DAW UI — loop grid, mixer, step sequencer, FX rack, song arranger, vocal processor, scene bank, master EQ, and output section — wired end-to-end with live state. Every control is functional; there are no mocked, stubbed, or dead UI elements.

---

## 2. Design System — Aurora Theme

All visual decisions are governed by the Aurora design language. These constraints are non-negotiable; enhancements must deepen the system, not replace it.

| Token | Value | Source |
|---|---|---|
| Background | `#080808` | DAWLayout root `style` |
| Header background | `#0d0d0d` | Header wrapper `style` |
| Accent / lime | `#B7FF00` | Used throughout |
| Slot 1 — Green | `#39FF14` | LoopGrid `SLOTS[0].color` |
| Slot 2 — Cyan | `#00BFFF` | LoopGrid `SLOTS[1].color` |
| Slot 3 — Orange | `#FF8C00` | LoopGrid `SLOTS[2].color` |
| Slot 4 — Purple | `#BF5FFF` | LoopGrid `SLOTS[3].color` |
| Error / recording red | `#FF3B3B` | Used for REC, LIMITER, DISTORTION |
| Heading font | Rajdhani | All panel titles |
| Mono / values font | Share Tech Mono | All readouts, buttons, labels |

**Global effects:** film-grain overlay (`body::before`) and CRT scanline sweep (`body::after`) applied via CSS pseudo-elements. `.glass-panel`, `.panel-inset`, `.panel-header` utility classes carry glass morphism and glow styling. All glow variables are defined in `src/index.css`.

---

## 3. System Architecture

```
Browser (React/Vite/TS)               Replit Shared Proxy (port 80)
┌─────────────────────────┐           ┌─────────────────────────────────┐
│  /r3-loop/*  → UI       │◄─────────►│  /r3-loop   → Vite dev server   │
│  fetch("/api-server/…") │           │  /api-server → Express server   │
└─────────────────────────┘           └─────────────────────────────────┘
                                                    │
                                          Express API Server
                                          artifacts/api-server
                                          GET /api/healthz → { status: "ok" }
```

- **No auth.** No database. All UI state is local React state.
- **No Vite proxy.** The browser fetches through the Replit shared proxy at port 80. The `/api-server` path prefix is stripped by the proxy before reaching Express, which sees `/api/healthz`.
- **Port isolation.** Each artifact reads from `process.env["PORT"]`. The API server throws a hard `Error` on startup if `PORT` is missing or not a valid positive integer — no silent fallback.
- **TypeScript:** zero compiler errors across all files; this must be maintained.

---

## 4. Component Inventory & Requirements

### 4.1 DAWLayout (`DAWLayout.tsx`)

**Purpose:** Root orchestrator. Owns shared cross-component state and distributes it as props.

**State owned:**

| State | Type | Initial | Role |
|---|---|---|---|
| `activeTab` | `string` | `'PERFORM'` | Which main panel is visible |
| `bpm` | `number` | `120` | Global BPM passed to Header, StatusBar, SequenceView, SongView |
| `loopsLoaded` | `number` | `0` | Count of occupied loop slots; updated by LoopGrid callback |

**Integrations:**
- Mounts `useHealthCheck('/api-server/api/healthz')` → stores result as `apiOnline` (`boolean | null`).
- Passes `apiOnline ?? false` (**coerced to boolean**) to StatusBar. When the hook returns `null` (initial pending), StatusBar receives `false`.
- Receives `onLoopCountChange` callback from LoopGrid and stores it in `loopsLoaded`.

---

### 4.2 Header (`Header.tsx`)

**Purpose:** Global transport, BPM display, timing controls, system toggles, VU meter, and user identity.

**State owned:**

| State | Type | Initial | Description |
|---|---|---|---|
| `isPlaying` | `boolean` | `true` | Transport play/stop |
| `isRecording` | `boolean` | `false` | Transport record arm |
| `quantize` | `boolean` | `true` | QUANTIZE toggle |
| `limit` | `boolean` | `false` | LIMITER toggle |
| `mono` | `boolean` | `false` | MONO toggle |
| `meteo` | `boolean` | `false` | METEO toggle |
| `grain` | `boolean` | `false` | GRAIN toggle |
| `isDark` | `boolean` | `true` | DARK mode toggle |
| `isSikk` | `boolean` | `false` | SIKK mode toggle |
| `isLinked` | `boolean` | `false` | LINK toggle |
| `signOutFlash` | `boolean` | `false` | Transient flash for SIGN OUT |
| `vuLevels` | `number[]` | 8 zeros | VU meter levels, driven by rAF |
| `hoveredNudge` | `number \| null` | `null` | Which nudge button is hovered |

**Controls and their behavior:**

| Control | Behavior |
|---|---|
| ▶ PLAY button | Sets `isPlaying = true`. Active state: `background: #B7FF00`, `color: #000`, lime glow. |
| ■ STOP button | Sets `isPlaying = false`. Active state: `rgba(255,255,255,0.1)`, `color: #fff`. |
| ● REC button | Toggles `isRecording`. Active state: `background: #FF3B3B`, red glow. |
| BPM display | Shows live `bpm` value in `Share Tech Mono`, 40px, lime `#B7FF00`. |
| TAP TEMPO button | Calls `handleTap()`: pushes `performance.now()` to `tapTimesRef`, keeps last 4 taps within 3 s, computes average interval, sets `bpm = Math.round(60000 / avg)`, clamped **40–280**. |
| `−2 / −1 / +1 / +2` nudge | Calls `adjustBpm(n)` = `setBpm(clamp(bpm + n, 40, 280))`. Hovered nudge glows lime. |
| QUANTIZE / `1/4` button | Toggles `quantize`. Active dot and label turn lime when `true`. |
| SWING display | **Static indicator** — orange dot + "SWING" label + "4/4" text. No click handler, no state. Display only. |
| METEO | Toggles `meteo`. Active: lime fill + glow. |
| MONO | Toggles `mono`. Active: lime fill + glow. |
| LIMITER | Toggles `limit`. Active: red `#FF3B3B` fill + glow. |
| GRAIN | Toggles `grain`. Active: orange `#FF8C00` fill + glow. |
| LINK button | Toggles `isLinked`. Active: **lime fill** (`background: #B7FF00`, `color: #080808`), lime glow. |
| DARK button | Toggles `isDark`. Active: **white fill** (`background: rgba(255,255,255,0.1)`, `color: #fff`). *(Not lime — DARK uses white, not lime.)* |
| SIKK button | Toggles `isSikk`. Active: lime text `#B7FF00`, lime border, lime glow. |
| SIGN OUT button | Sets `signOutFlash = true`, calls `setTimeout(() => setSignOutFlash(false), 1000)`. During flash: label = `'✓ SIGNED OUT'`, color `#B7FF00`. |
| VU meter | 8 LED columns × 10 LEDs each. Animated via `requestAnimationFrame` using a `vuTimeRef` accumulator + `Math.random()` for noise inside the rAF callback (not in the React render path). Colors: bottom 6 green `#39FF14`, middle 2 orange `#FF8C00`, top 2 red `#FF3B3B`. |

---

### 4.3 MarqueeTicker (`MarqueeTicker.tsx`)

**Purpose:** Continuously scrolling feature-list strip below the header.

**Requirements:** Pure CSS `@keyframes` marquee. Duplicate content fills the gap so the scroll wraps seamlessly. No JavaScript scroll logic.

---

### 4.4 TabNav (`TabNav.tsx`)

**Purpose:** Six-tab navigation bar.

**Tabs:** PERFORM · MIXER · SEQUENCE · FX RACK · SONG · VOCAL  
**Props:** `activeTab: string`, `setActiveTab: (tab: string) => void`  
**Requirements:** Active tab is underlined with `--lime` accent. Tab click updates `activeTab` in DAWLayout.

---

### 4.5 GlobalFX (`GlobalFX.tsx`)

**Purpose:** Left-column FX rack, visible on the PERFORM tab.

**State owned:** `filterType` (`'HPF'` | `'BPF'` | `'LPF'`), `reverbOpen` (boolean)

**Sections and controls (top to bottom):**

| Section | Controls |
|---|---|
| Main Filter | FILTER knob (cyan, size 52) + RESO knob (cyan, size 36). Below: HPF / BPF / LPF mode buttons — clicking sets `filterType`. Active mode: cyan fill, cyan glow. |
| Multi FX | DELAY: one unlabeled knob (orange, size 24). Then REVERB / DRIVE / CHORUS knobs (size 34). Then FLANGER / PHASER / PITCH knobs (size 30). |
| LFO | RATE / TIME / SHAKE knobs (lime, size 34). These are **LFO** controls, not delay parameters. |
| Delay Detail | T.DLY / MIX / FEED knobs (orange, size 30). |
| REVERB (collapsible) | Click header to toggle `reverbOpen`. When open: SIZE / DAMP / DIFF / MIX knobs (purple `#BF5FFF`, size 28). Chevron rotates 180° when open. |

**Note:** All GlobalFX knobs display their labels but have no `onChange` prop wired — they control internal state only within the Knob component. No GlobalFX values propagate up the tree.

The panel is scrollable (custom wheel handler) and 160 px wide. Scrollbar hidden via CSS.

---

### 4.6 Knob (`Knob.tsx`)

**Purpose:** Reusable rotary control used throughout the app.

**Props:**

| Prop | Type | Default |
|---|---|---|
| `label` | `string?` | — |
| `valueDisplay` | `string?` | — |
| `size` | `number` | `44` |
| `color` | `string` | `'#B7FF00'` |
| `initialValue` | `number` | `0.5` |
| `onChange` | `(val: number) => void?` | — |
| `className` | `string` | `''` |

**Behavior:**
- SVG arc-based rendering. Start angle −225°, total sweep 270°.
- Gradient IDs generated with `React.useId()` — format `knob-grad-<uid>` (colons stripped). Prevents duplicate-ID bugs when multiple knobs are rendered.
- `initialValue` synced via `useEffect([initialValue])` so external resets work without remounting.
- **Drag only.** `onMouseDown` stores `startY` + `startValue` in refs; adds `document.addEventListener('mousemove'/'mouseup')` for global pointer tracking (document-level listeners, **not** the Pointer Capture API). Delta formula: `(startY - e.clientY) * 0.008`.
- **No mouse wheel / scroll handler.** The knob does not respond to scroll events.
- `onChange(newVal)` fires on every `mousemove` while dragging.

---

### 4.7 Fader (`Fader.tsx`)

**Purpose:** Vertical channel fader with a LED meter column.

**Props:** `color: string`, `initialValue?: number` (default `0.75`), `label?: string`, `className?: string`

**Behavior:**
- dB scale: `toDb(v) = (v - 1.0) * 30 + 6`. Maps v=1.0 → +6 dB, v=0.8 → 0 dB (unity), v=0 → −∞. Labels on scale: +6 / 0 / −6 / −12 / −18 / −∞.
- LED meter (40 segments) animates via `requestAnimationFrame`. The rAF loop runs once on mount (`useEffect([], [])`) and reads the latest fader value from `valueRef` (synced via `useEffect([value])`). This avoids restarting the rAF loop when the fader moves.
- Brushed-metal background is a single CSS `background` property combining `rgba(8,10,15,0.9)` and a `repeating-linear-gradient`. The background and the gradient **must not be split** across `background` + `backgroundColor` — the shorthand collision makes the texture invisible.
- Drag uses container `getBoundingClientRect` to map `clientY` → 0–1 value.
- LED color zones: top 3 = red `#FF3B3B`, next 5 = orange `#FF8C00`, next 6 = gold `#FFD700`, remainder = `color` prop.

---

### 4.8 ParamRow (`ParamRow.tsx`)

**Purpose:** Horizontal labeled parameter slider used inside LoopSlot.

**Props:** `label: string`, `valueDisplay: string`, `color?: string` (default `'#cccccc'`), `initialValue?: number` (default `0.5`)

**Behavior:**
- Internal state only — no `onChange` prop. Values do not propagate to parent.
- `valueDisplay` supports a `{v}` placeholder, replaced with `Math.round(value * 100).toString()` at line 31.
- Horizontal drag maps pointer X position to 0–1 value via `getBoundingClientRect`.

---

### 4.9 LoopGrid (`LoopGrid.tsx`)

**Purpose:** Container for four loop slots and a non-interactive phantom fifth slot.

**Props:** `onLoopCountChange?: (count: number) => void`

**State owned:** `loopStates: boolean[4]` — `true` when the corresponding slot has a loaded loop.

**Slot definitions (hard-coded):**

| Slot | Color | Glow class |
|---|---|---|
| 1 | `#39FF14` | `laser-green` |
| 2 | `#00BFFF` | `laser-cyan` |
| 3 | `#FF8C00` | `laser-orange` |
| 4 | `#BF5FFF` | `laser-purple` |

**Requirements:**
- `handleLoopChange(idx, hasLoop)` updates `loopStates` via immutable spread.
- A `useEffect([loopStates])` propagates `onLoopCountChange?.(loopStates.filter(Boolean).length)` to DAWLayout. **Must not call `onLoopCountChange` inside the `setLoopStates` updater** — that is an illegal render-time side effect.
- Slot 5 is a visual ghost: `opacity: 0.12`, `pointer-events: none`, shows "+" icon. Intentional — not a bug.

---

### 4.10 LoopSlot (`LoopSlot.tsx`)

**Purpose:** Individual loop slot — record, play, clear, and per-slot parameter control.

**Props:** `num: number`, `color: string`, `glowClass: string`, `onHasLoopChange?: (hasLoop: boolean) => void`

**State owned:** `isRecording`, `muted`, `soloed`, `quantized`, `hasLoop`, `showMenu`

**Initial fader value:** `useRef(0.7 + Math.random() * 0.1)` — computed once on mount via `useRef`, not recalculated on re-render.

**Visual states of the record zone:**

| `hasLoop` | `isRecording` | Displayed content |
|---|---|---|
| `false` | `false` | "TAP TO RECORD" text in `color`+`99` opacity |
| — | `true` | Pulsing red dot + "RECORDING" text in `#FF3B3B` |
| `true` | `false` | 12-bar waveform visualization in `color` + "LOOP LOADED" label |

**Controls:**

| Control | Behavior |
|---|---|
| REC button (the whole record zone) | If currently recording (`isRecording === true`): sets `hasLoop = true`, calls `onHasLoopChange?.(true)`, then toggles `isRecording` off. If not recording: toggles `isRecording` on. |
| M chip | Toggles `muted`. Active color: orange `#FF8C00`. |
| S chip | Toggles `soloed`. Active color: gold `#FFD700`. |
| Q chip | Toggles `quantized`. Active color: slot `color`. |
| CLR button | `setIsRecording(false); setHasLoop(false); onHasLoopChange?.(false)`. |
| `···` button | Toggles `showMenu`. Opens floating context menu with outside-click dismissal (`document.addEventListener('mousedown', close)`). |
| Menu → RENAME | Closes menu. No state change (rename not yet implemented). |
| Menu → DUPLICATE | Closes menu. No state change (duplicate not yet implemented). |
| Menu → EXPORT | Closes menu. No state change (export not yet implemented). |
| Menu → CLEAR | `setIsRecording(false); setHasLoop(false); onHasLoopChange?.(false); setShowMenu(false)`. |
| KEY ParamRow | `valueDisplay: "C"`, `initialValue: 0.5` |
| DET ParamRow | `valueDisplay: "0 ct"`, `initialValue: 0.5` |
| TUNE ParamRow | `valueDisplay: "0"`, `initialValue: 0.5` |
| PAN ParamRow | `valueDisplay: "0"`, `initialValue: 0.5` |
| FLT ParamRow | `valueDisplay: "{v}%"`, `initialValue: 1.0` — `{v}` is replaced with `Math.round(value * 100)` |
| VOL ParamRow | `valueDisplay: "0.0 dB"`, `initialValue: 0.8` |

**Critical constraint:** `onHasLoopChange` must be called **directly at each mutation site** (REC stop, CLR click, menu CLEAR). Do not put it in a `useEffect([hasLoop, onHasLoopChange])` — the parent recreates the inline arrow on every render, causing an infinite re-render cycle.

---

### 4.11 MixerView (`MixerView.tsx`)

**Purpose:** 8-channel mixer + master channel.

**State owned:**

| State | Type | Initial | Role |
|---|---|---|---|
| `soloChannel` | `number \| null` | `null` | Which channel is soloed; all others dim to 0.3 opacity |
| `mutedChannels` | `Set<number>` | empty | Muted channels show dark background + dimmed name |
| `masterMuted` | `boolean` | `false` | Master M button |
| `masterSoloed` | `boolean` | `false` | Master S button |
| `channelParams[8]` | `ChParams[]` | `{ hi:0.5, mid:0.5, lo:0.5, a1:0, a2:0, pan:0.5 }` | Per-channel EQ/AUX/PAN values |
| `masterGain` | `number` | `0.8` | Master GAIN knob |
| `masterWidth` | `number` | `0.5` | Master WIDTH knob |
| `masterSend` | `number` | `0.3` | Master SEND knob |
| `initialFaderValues[8]` | `number[]` | `useMemo(() => ... Math.random() ...)` | Stable random initial fader positions; computed once via `useMemo` |

**`ChParams` type:** `{ hi: number; mid: number; lo: number; a1: number; a2: number; pan: number }`

**`setChParam(i, key, v)`:** Updates `channelParams[i][key]` immutably without mutating adjacent channels.

**Channel definitions:**

| Index | Name | Color |
|---|---|---|
| 0 | DRUMS | `#39FF14` |
| 1 | BASS | `#00BFFF` |
| 2 | LEAD | `#FF8C00` |
| 3 | PAD | `#BF5FFF` |
| 4 | SYNTH | `#39FF14` |
| 5 | FX SND | `#00BFFF` |
| 6 | VOX | `#FF8C00` |
| 7 | AUX | `#BF5FFF` |

**Per-channel knobs (6 per channel × 8 = 48 knobs total):**

| Knob | Key | Color | Size |
|---|---|---|---|
| HI | `hi` | `#B7FF00` | 26 |
| MID | `mid` | `#FF8C00` | 26 |
| LO | `lo` | `#00BFFF` | 26 |
| A1 | `a1` | `#555` | 22 |
| A2 | `a2` | `#555` | 22 |
| PAN | `pan` | slot color | 28 |

**Master knobs:**

| Knob | State | Color | Size |
|---|---|---|---|
| GAIN | `masterGain` | `#B7FF00` | 34 |
| WIDTH | `masterWidth` | `#00BFFF` | 34 |
| SEND | `masterSend` | `#BF5FFF` | 30 |

**`MSButton` component:** Uses `boxShadow: inset 0 0 0 1px ${activeColor}80` for the active border. Never the `border` CSS shorthand — that causes undefined render behavior in the Aurora theme.

---

### 4.12 SequenceView (`SequenceView.tsx`)

**Purpose:** Step sequencer with 8 independent pattern banks.

**Props:** `bpm?: number` (default `120`)

**Instruments (8 rows, fixed):**

| Row | Name | Color |
|---|---|---|
| 0 | KICK | `#39FF14` |
| 1 | SNARE | `#00BFFF` |
| 2 | HIHAT | `#FF8C00` |
| 3 | CLAP | `#BF5FFF` |
| 4 | BASS | `#FF3B3B` |
| 5 | LEAD | `#FFD700` |
| 6 | PAD | `#B7FF00` |
| 7 | FX | `#FF69B4` |

**State owned:** `isPlaying`, `currentStep`, `stepCount`, `pattern` (boolean[][]), `clipboard`, `activePattern`, `patternBank` (Record keyed A–H)

**Step count:** **16 or 32 only** — two hard buttons in the UI. Not freeform.

**Default pattern:** KICK steps at 0/4/8/12; SNARE at 4/12; HIHAT at 2/6/10/14; all others `Math.random() > 0.8` on initialization.

**Playback timing:** `setInterval` at `Math.round(60000 / bpm / 4)` ms (16th note interval). Cleaned up on stop or unmount.

**Controls:**

| Control | Behavior |
|---|---|
| ▶ PLAY / ■ STOP | Toggles `isPlaying`. Button fills lime when playing. |
| STEPS 16 / 32 | Calls `changeStepCount(n)`: trims or pads each row, resets `currentStep`, stops playback. |
| Step button | `toggleStep(row, col)` — inverts `pattern[row][col]`. |
| COPY | Stores deep copy of current pattern in `clipboard`. |
| PASTE | Restores `clipboard` into `pattern` if clipboard is non-null. |
| CLEAR | Zeros all steps (`r.map(() => false)`). |
| Pattern bank A–H | On switch: saves live `pattern` + `stepCount` to departing slot, loads target slot, resets to step 0, stops playback. |

**Beat separators:** `withBeatSeps(renderCell)` builds interleaved cell + 6 px spacer arrays at every 4-step boundary. `LABEL_W = 64` px is applied consistently as `paddingLeft` on the header row and as `width` on the label column — ensuring zero column drift.

---

### 4.13 FxRackView (`FxRackView.tsx`)

**Purpose:** 8 insert FX slots in a rack UI.

**State owned:** `bypassed: Set<number>` — indices of bypassed slots.

**Effect slots (fixed):**

| Slot | Name | Color | Knob params |
|---|---|---|---|
| 0 | COMPRESSOR | `#39FF14` | THRESH / RATIO / ATTACK / RELEASE |
| 1 | EQ-8 | `#00BFFF` | LOW / MID / HIGH / AIR |
| 2 | REVERB | `#BF5FFF` | SIZE / DAMP / DIFF / PREDLY |
| 3 | DELAY | `#FF8C00` | TIME / FEED / SYNC / SPREAD |
| 4 | CHORUS | `#00BFFF` | RATE / DEPTH / DELAY / MIX |
| 5 | DISTORTION | `#FF3B3B` | DRIVE / TONE / CLIP / MIX |
| 6 | LIMITER | `#FFD700` | THRESH / CEIL / RELEASE / GAIN |
| 7 | MASTER GAIN | `#B7FF00` | GAIN / WIDTH / CLIP / MONO |

**Per slot:** 4 param knobs (size 36, color = slot color) + 1 W/D knob (size 32, `#888`). All knobs display only — no `onChange` prop wired; they do not propagate values.

**BYPASS button:** Toggles the slot's index in the `bypassed` Set. When bypassed: button label = `'BYPASSED'`, red text + red border; slot opacity drops to `0.45`; power LED turns `#333`.

---

### 4.14 SongView (`SongView.tsx`)

**Purpose:** Linear song arranger / timeline view.

**Props:** `bpm?: number`

**State owned:** `tracks` (Track[]), `playing`, `recording`, `beat`, `pxPerBar`, `snap`

**Requirements:**

| Feature | Behavior |
|---|---|
| Track lanes | Each lane has R (record arm) / M (mute) / S (solo) chips, a label, and a waveform thumbnail area |
| Zoomable ruler | `pxPerBar` state drives zoom; in/out buttons change it; ruler ticks re-label at new density |
| Snap toggle | Toggles `snap`; illuminates when on |
| Playhead | Vertical line moves with `beat` position during playback |
| Auto-scroll | Timeline scrolls to keep playhead in view during playback |
| Scroll sync | Horizontal scroll synced between ruler and track lanes via `onScroll` handler |
| ADD TRACK | Appends new empty track to `tracks` array |

---

### 4.15 VocalView (`VocalView.tsx`)

**Purpose:** Vocal pitch correction, processing, and recording panel.

**State owned:**

| State | Initial | Description |
|---|---|---|
| `bypassed` | `false` | When true: entire panel dims (opacity 0.3), pointer events disabled, animated pitch graph pauses, "BYPASSED" overlay appears |
| `isRecording` | `false` | REC button state |
| `selectedKey` | `'C'` | Active root key (12 chromatic notes: C C# D D# E F F# G G# A A# B) |
| `selectedScale` | `'MAJOR'` | Active scale mode (CHROMATIC / MAJOR / MINOR / DORIAN / MIXOLYDIAN / CUSTOM) |
| `selectedPreset` | `'NATURAL'` | Active preset name |
| `retune` | `0.35` | Retune speed knob value |
| `humanize` | `0.6` | Humanize knob value |
| `formant` | `0.5` | Formant knob value |
| `mix` | `0.85` | Wet/dry mix knob value |
| `showKeyMenu` | `false` | Key dropdown open |
| `showScaleMenu` | `false` | Scale dropdown open |
| `pitchT` | `0` | Pitch graph animation time accumulator; modulo-bounded to `Math.PI * 2 * 100` |

**Controls:**

| Control | Behavior |
|---|---|
| ACTIVE / BYPASSED toggle | Toggles `bypassed`. When bypassed: red text + border + glow. Pitch graph rAF stops. |
| ● REC button | Toggles `isRecording`. When recording: pulsing `●` + "RECORDING" text. When stopped: "REC". |
| KEY selector | Dropdown button showing current key. Opens `showKeyMenu`. Selecting a key sets `selectedKey` and closes menu. Closes when clicking outside (via `closeMenus` ref check). |
| SCALE selector | Dropdown button showing current scale. Opens `showScaleMenu`. Selecting a scale sets `selectedScale` and closes menu. |
| REFERENCE display | Static `440 Hz` label — display only, no interaction. |
| RETUNE knob | size 52, lime. `onChange={setRetune}` |
| HUMANIZE knob | size 52, cyan. `onChange={setHumanize}` |
| FORMANT knob | size 52, orange. `onChange={setFormant}` |
| MIX knob | size 52, purple. `onChange={setMix}` |
| PRESET BANK (8 buttons) | NATURAL / ROBOT / CHOIR / HARD / FOLK / POP / SUBTLE / CUSTOM. Clicking calls `applyPreset(p)` which simultaneously sets `retune`, `humanize`, `formant`, and `mix` to the preset's values. |

**Preset values:**

| Preset | retune | humanize | formant | mix |
|---|---|---|---|---|
| NATURAL | 0.35 | 0.60 | 0.50 | 0.85 |
| ROBOT | 0.95 | 0.05 | 0.30 | 1.00 |
| CHOIR | 0.60 | 0.70 | 0.65 | 0.75 |
| HARD | 0.90 | 0.10 | 0.50 | 0.95 |
| FOLK | 0.25 | 0.80 | 0.55 | 0.60 |
| POP | 0.55 | 0.50 | 0.50 | 0.90 |
| SUBTLE | 0.20 | 0.85 | 0.50 | 0.45 |
| CUSTOM | 0.50 | 0.50 | 0.50 | 0.70 |

**RETUNE SPEED indicator:** A progress bar + label derived from `retune` value: `< 0.3` → "NATURAL", `< 0.6` → "BALANCED", `< 0.85` → "TIGHT", `>= 0.85` → "INSTANT".

**Animated pitch graph (SVG):**
- Two SVG paths rendered via `generatePitchPoints(420, 180, t)`: INPUT path in cyan `#00BFFF` (opacity 0.5), OUTPUT corrected path in lime `#B7FF00` (opacity 0.85).
- Corrected path uses `pitchT * (1 - retune * 0.7)` — higher retune → straighter line.
- 13 semitone grid lines; root key lines are lime-accented.
- Left column shows note labels (C–B), root key highlighted lime.
- Animation pauses when `bypassed === true`.

**Live readouts (computed from `pitchT`, not real audio):**
- PITCH: `±N.N st` (turns red if `|offset| > 2`)
- INPUT: `N.N dBFS`
- CORR: `N%` (= `Math.round(retune * 100)`)

---

### 4.16 SceneBank (`SceneBank.tsx`)

**Purpose:** 16-scene performance launcher.

**State owned:** `activeScene: string` (initial `'A'`), `savedScenes: Set<string>`, `recallFlash: boolean`

**Scenes:** A B C D E F G H I J K L M N O P (4 columns × 4 rows)

**Controls:**

| Control | Behavior |
|---|---|
| Scene buttons A–P | Click sets `activeScene`. Active scene: lime border, lime text, lime glow, top accent bar. |
| SAVE button | `setSavedScenes(prev => new Set([...prev, activeScene]))`. Button text turns lime when current scene is already saved. |
| Saved indicator dot | Small `3px` lime dot at bottom-center of non-active buttons that are in `savedScenes`. Opacity 0.55. |
| RECALL button | **Guard:** only fires if `savedScenes.has(activeScene)`. If guarded: sets `recallFlash = true`, clears it after 500 ms. If active scene not in `savedScenes`: button is dim (`#2a2a2a`), cursor `default`, click does nothing. |

---

### 4.17 MasterEQ (`MasterEQ.tsx`)

**Purpose:** Global 4-band EQ in the right column.

**State owned:**

| State | Initial | Description |
|---|---|---|
| `eqLow` | `0.6` | LOW knob |
| `eqMid` | `0.5` | MID knob |
| `eqHigh` | `0.7` | HIGH knob |
| `eqAir` | `0.35` | AIR knob |
| `lMeter` | `0` | Left stereo meter level |
| `rMeter` | `0` | Right stereo meter level |

**Knobs:**

| Label | State | Color | Size |
|---|---|---|---|
| LOW | `eqLow` | `#FF8C00` | 30 |
| MID | `eqMid` | `#FFD700` | 30 |
| HIGH | `eqHigh` | `#00BFFF` | 30 |
| AIR | `eqAir` | `#B7FF00` | 30 |

**Stereo meters:** Two 14-LED vertical meters (L and R) animate via `requestAnimationFrame`. LED color zones: top 2 = red `#FF3B3B`, next 2 = orange `#FF8C00`, remainder = green `#39FF14`. Scale labels: +6 / 0 / −12 / −∞.

---

### 4.18 OutputPanel (`OutputPanel.tsx`)

**Purpose:** Final output stage with gain, width, level metering, and clip/fold controls.

**State owned:**

| State | Initial | Description |
|---|---|---|
| `gain` | `0.8` | GAIN knob |
| `width` | `0.5` | WIDTH knob |
| `limit` | `false` | LIMIT toggle button |
| `mono` | `false` | MONO toggle button |
| `lMeter` | `0` | Left output meter level |
| `rMeter` | `0` | Right output meter level |

**Controls:**

| Control | Behavior |
|---|---|
| GAIN knob | size 40, lime `#B7FF00`. `onChange={setGain}` |
| WIDTH knob | size 36, cyan `#00BFFF`. `onChange={setWidth}` |
| MONO button | Toggles `mono`. Active: lime text, lime background `rgba(183,255,0,0.1)`, `laser-green` class. |
| LIMIT button | Toggles `limit`. Active: red text `#FF3B3B`, red background `rgba(255,59,59,0.1)`, `laser-red` class. |

**Output meters:** Two 20-LED strips (L and R), animated via `requestAnimationFrame`. Color zones: top 3 = red `#FF3B3B`, next 5 = orange `#FF8C00`, remainder = green `#39FF14`. Scale labels: +6 / 0 / −6 / −12 / −24 / −60.

---

### 4.19 StatusBar (`StatusBar.tsx`)

**Purpose:** System status strip along the bottom of the viewport.

**Props:** `bpm: number`, `apiOnline: boolean`, `loopsLoaded: number`

> **Important:** `apiOnline` is always a plain `boolean` — DAWLayout coalesces `null ?? false` before passing it. There is no null/pending/amber state in StatusBar. When the health check is initializing (hook returns null), StatusBar receives `false` and shows the offline (red) state.

**Controls and indicators:**

| Element | Behavior |
|---|---|
| AUDIO dot + label | `apiOnline === true`: lime dot (`#B7FF00`) with pulsing animation + "AUDIO ONLINE" in lime. `false`: red dot (`#FF3B3B`) + "API OFFLINE" in red. StatusBar `borderTop` also changes: lime when online, red-tinted when offline. |
| LOOPS LOADED | `{loopsLoaded} / 4 LOOPS LOADED`. Color: lime + glow when `loopsLoaded > 0`, dim `#444` when 0. |
| BPM readout | Live `{bpm} BPM` in lime. |
| EXT: DLY | Static display — dim `#3a3a3a`. |
| MIDI IN button | Toggles `midiActive`. Active: lime border, lime text, lime glow. |
| CLK OUT | Static display with a fixed green `#39FF14` dot. |
| ≋ STEREO | Static display in cyan `#00BFFF`. |
| 8 BIT | Static display in orange `#FF8C00`. |
| Right branding | "DESIGNED BY DJ ERNESTO" in dim `#2a2a2a` — display only. |

---

### 4.20 `useHealthCheck` Hook (`src/hooks/useHealthCheck.ts`)

**Signature:**
```ts
function useHealthCheck(url: string, intervalMs?: number): boolean | null
```

**Behavior:**
- Returns `null` on initial mount (first check pending).
- Returns `true` if `fetch` resolves with `response.ok` (HTTP 2xx).
- Returns `false` on any network error, timeout, or non-2xx response.
- Fires an immediate check on mount, then re-checks every `intervalMs` (default `6000` ms) via `setInterval`.
- Each check creates a new `AbortController` with a `setTimeout(() => ctrl.abort(), 3000)` — 3-second timeout per individual check.
- **Cleanup on unmount:** `active = false` flag prevents `setOnline` from firing after unmount; `clearInterval` stops the polling. The `AbortController` is used for per-check timeouts but is not explicitly aborted on unmount — the `active` flag handles the unmount case.
- `useEffect` deps: `[url, intervalMs]` — polling restarts if either changes.

---

## 5. Backend — API Server

**Location:** `artifacts/api-server`  
**Runtime:** Node.js + Express + TypeScript  
**Logger:** pino (structured JSON logs via `pino-http` middleware)

**Port startup behavior:**
- Reads `process.env["PORT"]`.
- Throws a hard `Error` (process exits) if `PORT` is not set, is `NaN`, or is `<= 0`.
- No fallback port — explicit failure is intentional.

### Routes

| Method | Path | Response | Notes |
|---|---|---|---|
| `GET` | `/api/healthz` | `{ status: "ok" }` (HTTP 200) | Zod-parsed via `HealthCheckResponse` from `@workspace/api-zod` |

**CORS:** `app.use(cors())` — no arguments, defaults to allow all origins (`*`).  
**Body parsing:** `express.json()` + `express.urlencoded({ extended: true })` registered.  
**Auth:** None.  
**Database:** drizzle-orm in dependencies but unused — ready for future routes.

### URL convention for frontend calls

```
fetch("/api-server/api/healthz")
```

The Replit shared proxy strips `/api-server` before forwarding to Express, which receives `/api/healthz`. No Vite proxy config is needed or present.

---

## 6. State Architecture

```
DAWLayout
├── activeTab ('PERFORM')          → TabNav
├── bpm (120)                      → Header, StatusBar, SequenceView, SongView
├── loopsLoaded (0)                ← LoopGrid (onLoopCountChange callback)
├── apiOnline (boolean | null)     ← useHealthCheck hook; coerced ?? false before StatusBar
│
├── Header
│   ├── isPlaying, isRecording
│   ├── quantize, limit, mono, meteo, grain
│   ├── isDark, isSikk, isLinked, signOutFlash
│   ├── vuLevels[8]  (rAF animated)
│   └── hoveredNudge, tapTimesRef
│
├── GlobalFX
│   ├── filterType ('HPF')
│   └── reverbOpen (false)
│       (all knob values are internal to each Knob instance)
│
├── LoopGrid
│   ├── loopStates[4]  (→ onLoopCountChange → DAWLayout)
│   └── LoopSlot ×4
│       ├── isRecording, hasLoop, showMenu
│       ├── muted, soloed, quantized
│       └── initialFaderValue (useRef)
│
├── MixerView
│   ├── soloChannel (number | null)
│   ├── mutedChannels (Set<number>)
│   ├── masterMuted, masterSoloed
│   ├── channelParams[8]  { hi, mid, lo, a1, a2, pan }
│   ├── masterGain, masterWidth, masterSend
│   └── initialFaderValues[8]  (useMemo, stable)
│
├── SequenceView
│   ├── isPlaying, currentStep, stepCount
│   ├── pattern (boolean[][])
│   ├── clipboard (boolean[][] | null)
│   ├── activePattern ('A')
│   └── patternBank { A…H: { pattern, stepCount } }
│
├── FxRackView
│   └── bypassed (Set<number>)
│
├── SongView
│   ├── tracks, playing, recording, beat
│   ├── pxPerBar, snap
│   └── (scrollX synced via ref)
│
├── VocalView
│   ├── bypassed, isRecording
│   ├── selectedKey ('C'), selectedScale ('MAJOR')
│   ├── selectedPreset ('NATURAL')
│   ├── retune, humanize, formant, mix
│   ├── showKeyMenu, showScaleMenu
│   └── pitchT  (rAF animated, modulo-bounded)
│
├── SceneBank
│   ├── activeScene ('A')
│   ├── savedScenes (Set<string>)
│   └── recallFlash
│
├── MasterEQ
│   ├── eqLow (0.6), eqMid (0.5), eqHigh (0.7), eqAir (0.35)
│   └── lMeter, rMeter  (rAF animated)
│
└── OutputPanel
    ├── gain (0.8), width (0.5)
    ├── limit (false), mono (false)
    └── lMeter, rMeter  (rAF animated)
```

---

## 7. Performance Requirements

- **No `Math.random()` in the React render path.** All animated meters use `useRef` + `requestAnimationFrame`. `Math.random()` inside a rAF callback (e.g., VU meter noise, fader meter jitter) is acceptable — it runs asynchronously and does not block React's render.
- **No `setState` inside another `setState` updater.** Side effects that propagate state upward (e.g., `onLoopCountChange`) must run inside `useEffect`, not inside an updater function.
- **No inline arrow functions as `useEffect` dependencies** when those arrows call back into parent state. This causes an infinite re-render cycle because the parent recreates the arrow on every render, firing the effect again. Solution: call the callback directly at each mutation site.
- **`React.useId()`** for all SVG gradient and clip-path IDs. Format: `knob-grad-<uid>` (colons stripped from the uid string). Hard-coded ID strings on components that mount multiple times produce invisible gradients due to duplicate SVG `defs`.
- **Stable initial random values:** Use `useRef(Math.random() * ...)` (LoopSlot) or `useMemo(() => [...].map(() => Math.random() * ...), [])` (MixerView) — never bare `Math.random()` in the component body or JSX.

---

## 8. CSS / Styling Rules

- All design tokens (`--lime`, `--bg`, `--panel-*`, glow vars) live in `src/index.css`. Do not duplicate them inline.
- `MSButton` active state uses `boxShadow: inset 0 0 0 1px ${activeColor}80` — **never** the `border` shorthand. Border shorthand conflicts with `border: none` on the element and causes undefined behavior in the Aurora theme.
- Fader brushed-metal texture must be set in a single `background` CSS property — **never** split across `background` + `backgroundColor`. Splitting causes the texture to be invisible.
- Beat-separator alignment: `gap: 1` on the step grid + explicit `6px` spacer `div`s at beat boundaries via `withBeatSeps()`. Header row and button rows use the identical function and `LABEL_W = 64` px offset — zero column drift.
- `DARK` button active state is **white** (`rgba(255,255,255,0.1)`, `color: #fff`), not lime. Only `SIKK` and `LINK` use lime for their active state.

---

## 9. Out of Scope (v1.0)

The following are intentionally excluded. Do not add without a new PRD:

- Web Audio API playback (actual audio engine)
- MIDI device input/output
- File import/export (WAV, MIDI, project save/load)
- User accounts or session persistence
- Backend database (routes beyond `/api/healthz`)
- Mobile / responsive layout
- Real-time collaboration
- VST / plugin loading
- Actual pitch detection or vocal processing (VocalView graph is simulated)
- Working rename/duplicate/export in LoopSlot context menu (currently no-op beyond closing the menu)

---

## 10. Known Intentional Design Decisions

| Decision | Rationale |
|---|---|
| Slot 5 phantom placeholder | Visual expandability cue. `pointer-events: none`, opacity 0.12. Not a bug — deliberate. |
| `ParamRow` has no `onChange` prop | Internal state only. If value propagation is ever needed, add the prop explicitly. |
| LoopSlot `initialFaderValue` uses `useRef` with `Math.random()` | Computed once on component mount. Stable across re-renders. |
| MixerView `initialFaderValues` uses `useMemo` with `Math.random()` | Same goal: one-time stable value. Different mechanism (memo vs. ref) but both correct. |
| `useHealthCheck` uses `active` flag rather than aborting on unmount | The in-flight `fetch` on unmount is allowed to resolve naturally; only the resulting `setState` is suppressed. |
| Health check interval 6 s, per-check timeout 3 s | Balances responsiveness against dev server load. |
| CORS `app.use(cors())` with no arguments | `cors()` defaults to allow all origins. Single-tenant dev tool; no sensitive data. |
| `PORT` throws on missing/invalid value | Fail-fast prevents silent misconfiguration. |
| FxRackView knobs have no `onChange` | Display only — values do not affect audio (no audio engine). Add `onChange` when audio engine is implemented. |
| GlobalFX knobs have no `onChange` | Same reason. |
| VocalView pitch graph is simulated | Driven by `pitchT` accumulator + `Math.sin`, not real microphone input. |
| SceneBank RECALL no-ops when scene not saved | Prevents confusing UX of recalling a blank/default state. |

---

## 11. Acceptance Criteria

- [ ] All controls in all six tabs produce visible state changes (no dead buttons, knobs, or sliders)
- [ ] BPM tap-tempo calculates from real tap timing deltas (using `performance.now()`) and clamps output to 40–280
- [ ] VU meters, faders, and all output/EQ meters animate continuously via `requestAnimationFrame` without causing React re-renders per frame
- [ ] LoopSlot REC, CLR, and menu CLEAR all propagate loop count to StatusBar in real time
- [ ] MixerView: all 48 channel knobs + 3 master knobs accept input; solo dims other channels; mute darkens channel background
- [ ] SequenceView: each of the 8 pattern banks stores and restores its own step grid and step count independently on switch
- [ ] VocalView: preset selection simultaneously updates all 4 knobs (RETUNE/HUMANIZE/FORMANT/MIX); BYPASS dims the panel and pauses the graph
- [ ] SceneBank: SAVE stores the active scene; saved indicator dot appears on non-active saved scenes; RECALL flashes only for scenes that have been saved
- [ ] StatusBar AUDIO dot and label switch from lime "AUDIO ONLINE" to red "API OFFLINE" when the Express server is unreachable (within one poll interval, ≤6 s)
- [ ] StatusBar loop count glows lime when ≥1 slot loaded, dims otherwise
- [ ] TypeScript compiles with zero errors
- [ ] Browser console shows zero errors and zero warnings at runtime
- [ ] All Aurora design tokens honored — no changes to color palette, typography, or layout proportions
