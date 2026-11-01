import React from "react";
import { Composition } from "remotion";
import { Main, CoverMain } from "./Main.jsx";

export const Root = () => (
  <>
    <Composition
      id="Main"
      component={Main}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={300}
      defaultProps={{ segments: [], totalFrames: 300 }}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(30, props.totalFrames || 30) })}
    />
    <Composition id="Cover" component={CoverMain} fps={30} width={1080} height={1920} durationInFrames={1}
      defaultProps={{ segments: [], coverNumber: 1 }} />
  </>
);
