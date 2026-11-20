import React,{useLayoutEffect,useRef} from 'react';
import {Composition,registerRoot,useCurrentFrame} from 'remotion';
import {draw} from './film.js';
import story from './story.json';
function Film(){const ref=useRef(null),frame=useCurrentFrame();
 useLayoutEffect(()=>{draw(ref.current.getContext('2d'),frame/30,story)},[frame]);
 return <canvas ref={ref} width={1080} height={1920}/>}
function Root(){return <Composition id="TiltedTown" component={Film} width={1080} height={1920} fps={30} durationInFrames={story.seconds*30}/>}
registerRoot(Root);
