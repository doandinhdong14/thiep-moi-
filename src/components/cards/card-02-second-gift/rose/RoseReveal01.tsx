"use client";

import React, { useMemo } from "react";
import { defaultRoseRevealConfig } from "./presets";
import { RoseRevealScene } from "./RoseRevealScene";
import type { RoseAssetConfig, RoseRevealConfig, RoseRevealState } from "./types";

export interface RoseReveal01Props {
  config?: RoseAssetConfig;
  paused?: boolean;
  quality?: "low" | "high";
  state: RoseRevealState;
  bloomProgress: number;
  flightProgress: number;
  onTriggerBloom: () => void;
  reducedMotion?: boolean;
}

export const RoseReveal01: React.FC<RoseReveal01Props> = ({
  config,
  paused = false,
  state,
  bloomProgress,
  flightProgress,
  onTriggerBloom,
  reducedMotion = false,
}) => {
  const roseConfig: RoseRevealConfig = useMemo(
    () => ({
      ...defaultRoseRevealConfig,
      ...(config?.roseReveal || {}),
    }),
    [config?.roseReveal]
  );

  return (
    <RoseRevealScene
      config={roseConfig}
      state={state}
      bloomProgress={bloomProgress}
      flightProgress={flightProgress}
      paused={paused}
      onTriggerBloom={onTriggerBloom}
      reducedMotion={reducedMotion}
    />
  );
};

export default RoseReveal01;
