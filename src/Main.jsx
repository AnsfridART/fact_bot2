import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { Scene } from "./Scene.jsx";

const { fontFamily } = loadFont();

export const Main = (props) => {
  const frame = useCurrentFrame();
  const duck = props.duck || [];
  // музыка тише, когда говорит рассказчик, и громче в паузах
  const musicVolume = (f) => {
    const v = duck[Math.min(f, duck.length - 1)] || 0;
    return 0.9 * (1 - 0.5 * v);
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Scene frame={frame} data={props} src={(p) => staticFile(p)} ImgComp={Img} font={fontFamily} />
      {(props.segments || []).map((s, i) => (
        <Sequence key={i} from={s.start} durationInFrames={s.dur}>
          <Audio src={staticFile(s.audio)} />
        </Sequence>
      ))}
      {props.music ? <Audio src={staticFile(props.music)} volume={musicVolume} /> : null}
    </AbsoluteFill>
  );
};
