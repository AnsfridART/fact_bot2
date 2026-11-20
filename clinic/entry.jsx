import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {Renderer} from '../src/three/engine.js';
import {clinicScene} from './scene.js';
import stories from './stories.json';

let renderer;
function Film({story}) {
  const frame = useCurrentFrame();
  const canvas = useRef(null);
  useLayoutEffect(() => {
    if (!renderer) {
      const surface = document.createElement('canvas');
      surface.width = 540;
      surface.height = 960;
      renderer = new Renderer(surface, {ps1:false, samples:2});
    }
    renderer.draw(clinicScene(story.id, frame / 30));
    canvas.current.getContext('2d').drawImage(renderer.cv, 0, 0);
  }, [frame, story]);
  const line = story.lines.find(([start,end]) => frame >= start && frame < end);
  return <AbsoluteFill style={{background:'#f6e5cf'}}>
    <canvas ref={canvas} width={540} height={960} style={{width:'100%',height:'100%'}}/>
    {line && <div style={{position:'absolute',top:'74%',left:'7%',right:'10%',textAlign:'center',
      font:'bold 52px DejaVu Sans, sans-serif',color:'#203634',lineHeight:1.25}}>
      <span style={{background:'#fff7e9',borderRadius:22,padding:'5px 18px',boxDecorationBreak:'clone'}}>{line[2]}</span></div>}
  </AbsoluteFill>;
}
function Root() {
  return stories.map(story => <Composition key={story.id} id={story.id} component={Film}
    defaultProps={{story}} width={1080} height={1920} fps={30} durationInFrames={story.frames}/>);
}
registerRoot(Root);
