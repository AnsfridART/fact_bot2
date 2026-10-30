import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { Scene } from "./Scene.jsx";

const { fontFamily } = loadFont();

export const Main = (props) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#14123A" }}>
      <Scene frame={frame} data={props} src={(p) => staticFile(p)} ImgComp={Img} font={fontFamily} />
      {(props.segments || []).map((s, i) => (
        <Sequence key={i} from={s.start} durationInFrames={s.dur}>
          <Audio src={staticFile(s.audio)} />
        </Sequence>
      ))}
      {props.music ? <Audio src={staticFile(props.music)} volume={0.08} loop /> : null}
    </AbsoluteFill>
  );
};
