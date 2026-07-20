# R3/LOOP Browser DAW — Product Requirements Document

**Product:** R3/LOOP  
**Author:** DJ Ernesto Native × Replit Agent  
**Date:** July 20, 2026  
**Status:** v1.0 — Feature Complete

---

## 1. Executive Summary

R3/LOOP is a pixel-faithful browser recreation of DJ Ernesto Native's R3/LOOP digital audio workstation. It runs entirely offline in the browser (React + Vite + TypeScript), with an optional Express API server that provides health-checking and extensibility for future backend features. The product delivers a fully interactive DAW UI — loop grid, mixer, sequencer, FX rack, song arranger, vocal recorder, scene bank, master EQ, and output section — wired end-to-end with live state, with no mocked, stubbed, or non-functional controls.

---

## 2. Design System — Aurora Theme

All visual decisions are governed by the Aurora design language. These constraints are non-negotiable; enhancements must deepen the system, not replace it.

| Token | Value |
|---|---|
| Background | `#080808` |
| Header background | `#0d0d0d` |
| Accent / lime | `#B7FF00` |
| Slot 1 — Green | `#39FF14` |
| Slot 2 — Cyan | `#00BFFF` |
| Slot 3 — Orange | `#FF8C00` |
| Slot 4 — Purple | `#BF5FFF` |
| Heading font | Rajdhani |
| Mono / values font | Share Tech Mono |

**Global effects:** film-grain overlay (`body::before`) and CRT scanline sweep (`body::after`) applied via CSS `::before`/`::after` pseudo-elements. `.glass-panel`, `.panel-inset`, `.panel-header` utility classes carry glass morphism and glow styling. All glow variables are defined in `index.css`.

---

## 3. System Architecture

```
Browser (React/Vite/TS)          Replit Shared Proxy (port 80)
┌─────────────────────┐          ┌──────────────────────────────┐
│  /r3-loop/*         │◄────────►│  /r3-loop  → Vite dev server │
│  UI artifact        │          │  /api-server → Express server│
└─────────────────────┘          └──────────────────────────────┘
         │
         │  fetch("/api-server/api/healthz")
         ▼
   Express API Server
   artifacts/api-server
   GET /api/healthz → { status: "ok" }
```

- **No auth.** No database. All UI state is local React state.
- **No Vite proxy.** The browser fetches through the Replit shared proxy at port 80; the `/api-server` prefix is stripped by the proxy before reaching Express.
- **Port isolation.** Each artifact reads from `process.env.PORT`; no hard-coded ports anywhere.
- **TypeScript:** zero compiler errors across all files; must be maintained.

---

## 4. Component Inventory & Requirements

### 4.1 DAWLayout (`DAWLayout.tsx`)

**Purpose:** Root orchestrator. Owns shared state and passes it downward as props.

**State owned:**
- `activeTab` — currently visible main panel (PERFORM / MIXER / SEQUENCE / FX RACK / SONG / VOCAL)
- `bpm` — global BPM, passed to Header, StatusBar, SequenceView, SongView
- `loopsLoaded` — integer count of occupied loop slots, passed to StatusBar

**Integrations:**
- Mounts `useHealthCheck("/api-server/api/healthz")` and passes `apiOnline` to StatusBar
- Receives `onLoopCountChange` callback from LoopGrid and stores the count in `loopsLoaded`

---

### 4.2 Header (`Header.tsx`)

**Purpose:** Global transport controls, BPM, and system toggles.

**Requirements:**
| Control | Behavior |
|---|---|
| BPM display | Editable integer; `↑`/`↓` nudge buttons increment/decrement by 1 |
| TAP TEMPO | Calculates BPM from last 4 tap intervals; updates global BPM |
| `−2` / `−1` / `+1` / `+2` nudge | Shifts BPM by the labeled amount |
| SWING toggle | Cycles SWING percentage label |
| QUANTIZE toggle | Cycles QUANTIZE division label |
| VU meter | Animates via `requestAnimationFrame`; no `Math.random()` in render path |
| DARK toggle | Toggles `isDark` state; button fills neon-lime when active |
| SIKK toggle | Toggles `isSikk` state; button fills neon-lime when active |
| LINK toggle | Toggles `isLinked` state; illuminates with lime glow when active |
| SIGN OUT | Toggles `signOutFlash`; label briefly reads "✓ SIGNED OUT" in lime before resetting |

---

### 4.3 MarqueeTicker (`MarqueeTicker.tsx`)

**Purpose:** Continuously scrolling feature-list ticker below the header.

**Requirements:** Pure CSS `@keyframes` marquee. Text wraps seamlessly (duplicate content to fill gap). No JavaScript scroll logic.

---

### 4.4 TabNav (`TabNav.tsx`)

**Purpose:** Six-tab navigation bar.

**Tabs:** PERFORM · MIXER · SEQUENCE · FX RACK · SONG · VOCAL  
**Requirements:** Active tab underlined with `--lime` accent. Tab click updates `activeTab` in DAWLayout.

---

### 4.5 GlobalFX (`GlobalFX.tsx`)

**Purpose:** Left-column FX rack accessible from PERFORM tab.

**Controls:**
- FILTER knob + HPF / BPF / LPF mode buttons
- RESONANCE knob
- DELAY: RATE / TIME / SHAKE / MIX / FEED / T.DLY knobs
- REVERB: REVERB / DRIVE / CHORUS / FLANGER / PHASER / PITCH knobs
- REVERB section — collapsible via toggle arrow

**Requirements:** All knobs use the shared `<Knob>` component. Collapse animation is CSS `max-height` transition.

---

### 4.6 Knob (`Knob.tsx`)

**Purpose:** Reusable rotary control.

**Requirements:**
- SVG arc-based rendering. Gradient IDs generated with `React.useId()` — never hard-coded strings (prevents duplicate-ID bugs when multiple knobs are on screen).
- `initialValue` prop synced via `useEffect` (allows external reset without remounting).
- `onChange(value: number)` fires on pointer drag and on scroll.
- Pointer capture ensures drag continues outside the element boundary.
- Mouse wheel changes value by `step` per tick.

---

### 4.7 Fader (`Fader.tsx`)

**Purpose:** Vertical channel fader with dB scale.

**Requirements:**
- Scale: +6 dB (top) → −∞ dB (bottom), with unity at 0 dB.
- Level meter animates via `requestAnimationFrame`; meter value stored in a `useRef` (not state) to avoid re-renders.
- Brushed-metal texture applied via a single `background` CSS property — never split across `background` + `backgroundColor` (shorthand collision makes the texture invisible).

---

### 4.8 ParamRow (`ParamRow.tsx`)

**Purpose:** Horizontal labeled parameter slider used inside LoopSlot.

**Requirements:**
- Label on the left, value readout on the right.
- `valueDisplay` string supports a `{v}` placeholder, replaced at render time with the current value.
- Internal state only (no `onChange` prop unless explicitly added in a future requirement).

---

### 4.9 LoopGrid (`LoopGrid.tsx`)

**Purpose:** Container for four loop slots and a phantom fifth slot.

**Requirements:**
- Maintains `loopStates[4]` boolean array — `true` when a slot has a loop loaded.
- Propagates live count to DAWLayout via `onLoopCountChange` prop, triggered by a `useEffect` watching `loopStates`. **Must not call `onLoopCountChange` inside a `setState` updater** (illegal render-time side effect).
- Slot 5 is a visual ghost placeholder: `pointer-events: none`, `opacity: 0.3`. Intentional — not a bug.

---

### 4.10 LoopSlot (`LoopSlot.tsx`)

**Purpose:** Individual loop slot — record, play, clear, and parameter control.

**Requirements:**
| Control | Behavior |
|---|---|
| REC button | Toggles recording state; calls `onHasLoopChange(true)` when recording stops |
| CLR button | Clears loop; calls `onHasLoopChange(false)` |
| `···` button | Opens floating context menu (RENAME / DUPLICATE / EXPORT / CLEAR) with outside-click dismissal |
| Context menu CLEAR | Clears loop and calls `onHasLoopChange(false)` |
| M / S / Q chips | Toggle mute, solo, quantize per slot |
| Slot fader | Uses shared `<Fader>` component |
| KEY / DET / TUNE / PAN / FLT / VOL params | Uses shared `<ParamRow>` component |

**Critical:** `onHasLoopChange` must be called **directly at each mutation site** (REC stop, CLR click, menu CLEAR). A `useEffect` watching `hasLoop + onHasLoopChange` triggers an infinite render loop because the parent recreates the inline arrow on every render.

---

### 4.11 MixerView (`MixerView.tsx`)

**Purpose:** 8-channel mixer with per-channel EQ/AUX/PAN plus a master channel.

**Requirements:**
- 8 channels, each with its own `ChParams` state object: `{ hi, mid, lo, a1, a2, pan }`.
- A `setChParam(channelIndex, key, value)` helper updates the correct channel without mutating the others.
- All 6 knobs per channel (HI / MID / LO / AUX1 / AUX2 / PAN) wired to their respective `ChParams` keys — 48 knobs total.
- Master channel: GAIN / WIDTH / SEND knobs wired to separate `masterParams` state.
- `MSButton` (Mute/Solo) uses `inset box-shadow` for the active visual state — never the `border` shorthand (causes undefined render behavior in the Aurora theme).

---

### 4.12 SequenceView (`SequenceView.tsx`)

**Purpose:** Step sequencer with 8 pattern banks.

**Requirements:**
| Feature | Behavior |
|---|---|
| Step buttons | 16 (or configurable) step grid; clicking toggles the step on/off |
| Play / Stop | Toggle `isPlaying` state; play button fills lime when active |
| Step count | Adjustable per pattern |
| Copy / Paste / Clear | Copy stores current pattern; Paste restores it; Clear zeroes all steps |
| Pattern bank A–H | 8 slots; switching saves current pattern + step count to the departing slot, loads from the target slot |

**Beat separators:** `withBeatSeps()` builds identical arrays for the header row and button rows using `gap: 1` plus explicit 6 px spacer divs at beat boundaries. `LABEL_W = 64` used consistently across both.

---

### 4.13 FxRackView (`FxRackView.tsx`)

**Purpose:** 8 insert FX slots.

**Requirements:**
- Each slot shows an effect name and a BYPASS toggle.
- BYPASS toggles per-slot bypass state; active bypass visually mutes/grays the slot label.

---

### 4.14 SongView (`SongView.tsx`)

**Purpose:** Linear song arranger / timeline view.

**Requirements:**
| Feature | Behavior |
|---|---|
| Track lanes | Each lane has R (record) / M (mute) / S (solo) chip buttons, a label, and a waveform thumbnail area |
| Zoomable ruler | Zoom in/out changes px-per-beat; ruler ticks relabel accordingly |
| Snap toggle | Toggles snap-to-grid for clip placement |
| Playhead | Vertical line moves with transport position |
| Auto-scroll | Timeline scrolls to keep playhead in view during playback |
| Scroll sync | Horizontal scroll position synced between ruler and track lanes |
| ADD TRACK | Appends a new empty track lane |
| BPM prop | Receives `bpm` from DAWLayout for time calculations |

---

### 4.15 VocalView (`VocalView.tsx`)

**Purpose:** Vocal recording and processing panel.

**Requirements:**
- REC button toggles `isRecording` state.
- When recording: button pulses, label changes to "● RECORDING" with blinking animation.
- When stopped: label returns to "REC".

---

### 4.16 SceneBank (`SceneBank.tsx`)

**Purpose:** 16-scene performance launcher (A–P).

**Requirements:**
| Control | Behavior |
|---|---|
| Scene buttons A–P | Click sets `activeScene`; active scene highlighted in lime |
| SAVE | Stores `activeScene` into `savedScenes` Set; saved (non-active) scenes show a small indicator dot |
| RECALL | Flashes the RECALL button lime when a previously saved scene is recalled |

---

### 4.17 MasterEQ (`MasterEQ.tsx`)

**Purpose:** Global 4-band master EQ in the right column.

**Requirements:** LOW / MID / HIGH / AIR knobs each wired to individual state values (`eqLow`, `eqMid`, `eqHigh`, `eqAir`). All use the shared `<Knob>` component.

---

### 4.18 OutputPanel (`OutputPanel.tsx`)

**Purpose:** Final output gain and stereo width controls.

**Requirements:** GAIN and WIDTH knobs wired to `gain` and `width` state. Output level meters animate via `requestAnimationFrame`.

---

### 4.19 StatusBar (`StatusBar.tsx`)

**Purpose:** System status strip along the bottom of the viewport.

**Requirements:**
| Indicator | Behavior |
|---|---|
| AUDIO ONLINE dot + label | Green + "AUDIO ONLINE" when `apiOnline === true`; red + "API OFFLINE" when `false`; amber + "…" when `null` (pending) |
| Loops loaded | Displays live `"{loopsLoaded} / 4 LOOPS LOADED"` — glows lime when > 0 |
| BPM readout | Mirrors global BPM from DAWLayout |
| MIDI IN toggle | Toggles `midiActive`; illuminates lime when on |
| STEREO / MONO | Display-only labels |
| Bit depth | Display-only label |

---

### 4.20 `useHealthCheck` Hook

**Purpose:** Polls the API server and returns connection status.

**Signature:**
```ts
useHealthCheck(url: string, intervalMs?: number): boolean | null
```

**Behavior:**
- Returns `null` on initial mount (pending).
- Fires an `AbortController`-gated `fetch` with a 3-second timeout.
- Re-polls every `intervalMs` (default 6000 ms) using `setInterval`.
- Returns `true` if response is HTTP 200; `false` on any network error, timeout, or non-200 status.
- Cleans up interval and any in-flight abort controller on unmount.

---

## 5. Backend — API Server

**Location:** `artifacts/api-server`  
**Runtime:** Node.js + Express + TypeScript  
**Port:** `process.env.PORT` (Replit assigns dynamically — never hard-code)

### Routes

| Method | Path | Response |
|---|---|---|
| `GET` | `/api/healthz` | `{ status: "ok" }` (HTTP 200) |

**Validation:** Zod schema validates response shape.  
**CORS:** `*` — open for browser requests.  
**Auth:** None.  
**Database:** drizzle-orm in dependencies but unused — ready for future routes.

### URL Convention for Frontend Calls

```
fetch("/api-server/api/healthz")
```

The Replit shared proxy strips `/api-server` before forwarding to Express, which receives `/api/healthz`. No Vite proxy config is needed.

---

## 6. State Architecture

```
DAWLayout
├── activeTab           → TabNav
├── bpm                 → Header, StatusBar, SequenceView, SongView
├── loopsLoaded         ← LoopGrid (onLoopCountChange callback)
├── apiOnline           ← useHealthCheck hook
│
├── Header (owns: isDark, isSikk, isLinked, signOutFlash, tapHistory)
├── LoopGrid (owns: loopStates[4])
│   └── LoopSlot ×4 (owns: hasLoop, isRecording, menuOpen, params)
├── MixerView (owns: channelParams[8], masterParams)
├── SequenceView (owns: steps, isPlaying, patternBank[8], activeBank)
├── FxRackView (owns: bypass[8])
├── SongView (owns: tracks, zoom, snap, playhead, scrollX)
├── VocalView (owns: isRecording)
├── SceneBank (owns: activeScene, savedScenes Set)
├── MasterEQ (owns: eqLow, eqMid, eqHigh, eqAir)
└── OutputPanel (owns: gain, width)
```

---

## 7. Performance Requirements

- **No `Math.random()` in the render path.** All animated meters (VU, faders, output) must use `useRef` + `requestAnimationFrame`, updating DOM nodes directly without triggering React re-renders.
- **No setState inside another setState updater.** Side effects that propagate state upward must run inside `useEffect`, not inside an updater function.
- **No inline arrow functions as `useEffect` dependencies** when those arrows call back into parent state. This causes infinite re-render cycles. Pass stable callback refs or use direct mutation-site calls.
- **`React.useId()`** for all SVG gradient/clip-path IDs. Hard-coded ID strings on components that mount multiple times produce invisible gradients due to duplicate SVG `defs`.

---

## 8. CSS / Styling Rules

- All design tokens (`--lime`, `--bg`, `--panel-*`, glow vars) live in `src/index.css` and must not be duplicated inline.
- `MSButton` active state uses `box-shadow: inset 0 0 0 1px var(--lime)` — never the `border` shorthand.
- Fader brushed-metal texture must be set in a single `background` property — never split across `background` + `backgroundColor`.
- Beat-separator alignment: `gap: 1` on the step grid container + explicit `6px` spacer divs at beat boundaries, using a shared `withBeatSeps()` helper so header and button rows are byte-for-byte identical in structure.

---

## 9. Out of Scope (v1.0)

The following are intentionally excluded from this release and must not be added without a new PRD:

- Web Audio API playback (actual audio engine)
- MIDI device input/output
- File import/export (WAV, MIDI, project save)
- User accounts or session persistence
- Backend database (routes beyond `/api/healthz`)
- Mobile / responsive layout
- Real-time collaboration
- VST / plugin loading

---

## 10. Known Intentional Design Decisions

| Decision | Rationale |
|---|---|
| Slot 5 phantom placeholder | Visual expandability cue; `pointer-events: none` by design — not a bug |
| `ParamRow` has no `onChange` prop | Internal state only; prop must be added explicitly if value propagation is needed |
| `initialFaderValues` uses `useMemo` with `Math.random()` | Runs once on mount — correct behavior; not a render-path violation |
| Health check interval 6 s, timeout 3 s | Balance between responsiveness and server load in a development environment |
| CORS `*` on API server | Single-tenant dev tool; no sensitive data exposed |

---

## 11. Acceptance Criteria

- [ ] All controls in all six tabs have functional state (no dead buttons, knobs, or sliders)
- [ ] BPM tap-tempo calculates from real tap deltas and updates globally
- [ ] VU meters and faders animate continuously via `requestAnimationFrame` without React re-renders
- [ ] LoopSlot REC/CLR/menu CLEAR all propagate loop count to StatusBar in real time
- [ ] MixerView — all 48 channel knobs + 3 master knobs accept input and display current values
- [ ] SequenceView — pattern bank A–H each stores and restores its own step grid independently
- [ ] SceneBank — SAVE stores scenes; indicator dot appears on saved non-active scenes; RECALL flashes on retrieval
- [ ] StatusBar AUDIO dot turns red ("API OFFLINE") when the Express server is unreachable
- [ ] StatusBar loop count reflects actual loaded loops with live updates
- [ ] TypeScript compiles with zero errors
- [ ] Browser console shows zero errors and zero warnings at runtime
- [ ] All Aurora design tokens honored; no redesign of color, typography, or layout proportions
