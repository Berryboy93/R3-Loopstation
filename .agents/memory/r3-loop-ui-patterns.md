---
name: R3/LOOP DAW UI patterns
description: Durable conventions for the R3/LOOP DAW artifact — tab mounting, animation gating, stacking contexts, listener/timer hygiene.
---

- **Tab views stay mounted.** DAWLayout keeps all tab views mounted and hides inactive ones with `display:none` so per-view state (mutes, knobs, faders, patterns) survives tab switches. **Why:** unmount-on-switch silently wiped user tweaks. **How to apply:** new tab views must be added to the `views` array in DAWLayout, not a switch that unmounts.
- **Continuous animations must consume `useViewActive()`** (ViewActiveContext, default true) and pause when the enclosing tab is hidden. **Why:** with all views mounted, hidden rAF loops churn setState at 60fps. **How to apply:** any new rAF/interval-driven meter, playhead, or graph loop gates on the context and includes it in the effect deps.
- **`backdrop-filter` creates a stacking context per slot/panel** — dropdowns inside such containers get painted over by later siblings. Fix by raising the parent's z-index only while its menu is open (see LoopSlot), or portal the menu.
- **Listener/timer hygiene convention:** every document-level drag listener pair and every UI-flash `setTimeout` is tracked in a ref and removed/cleared on unmount and before re-scheduling (Knob, Fader, ParamRow, Header, SceneBank). New interactive controls must follow the same cleanupRef pattern.
- **LED meters mutate DOM directly, never setState per frame** (Fader, MasterEQ, OutputPanel): LEDs render once, refs collected in arrays, rAF flips styles only on on/off transitions. **Why:** per-frame setState re-rendered whole fader trees 60fps × 16+ instances. **How to apply:** new meters follow the same ref pattern; if a color prop can change at runtime, include it in the rAF effect deps and repaint lit LEDs on re-run.
- **All slider-like controls (Knob, Fader, ParamRow) have role="slider", tabIndex, aria-value\*, and arrow/PageUp/PageDown/Home(min)/End(max) keys.** Keep new controls consistent (Home=min, End=max per ARIA).
- **Known simulated-only surfaces** (pending a real audio engine): GR meters, pitch graph, REC, FxRack/GlobalFX knob wiring, SongView playback, LoopSlot menu items other than CLEAR. `ParamRow` has no `onChange` prop yet.
