import { createContext, useContext } from 'react';

/**
 * True when the enclosing tab view is currently visible.
 *
 * Views stay mounted when the user switches tabs (so knob/fader/mute state
 * survives), but are hidden with display:none. Continuous animation loops
 * (meter rAF, pitch graph, transport playhead) consume this to pause while
 * hidden — otherwise five invisible views would churn setState at 60fps.
 *
 * Defaults to true so always-visible components (Header, OutputPanel, …)
 * need no provider.
 */
export const ViewActiveContext = createContext(true);

export function useViewActive(): boolean {
  return useContext(ViewActiveContext);
}
