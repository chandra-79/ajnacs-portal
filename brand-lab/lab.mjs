import {springStep,clamp,geometry} from './motion.mjs';
const NS='http://www.w3.org/2000/svg';
const colours=['#E8402A','#F5A623','#17A05E','#2B57E8'];
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const calm=document.getElementById('calm');
const theme=document.getElementById('theme');
let userStill=false;
let isCalm=motionPreference.matches;
calm.checked=isCalm;
function setTheme(dark){document.documentElement.dataset.theme=dark?'dark':'light';theme.textContent=dark?'Switch to light':'Switch to dark';}
setTheme(matchMedia('(prefers-color-scheme: dark)').matches);
theme.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme!=='dark'));
const make=(name,attrs)=>{const e=document.createElementNS(NS,name);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
function createLayers(svg,variant){
  const root=svg.querySelector('[data-petals]');
  const groupCount=variant==='prism'?3:variant==='botanical'?8:4;
  return Array.from({length:groupCount},(_,i)=>{
    const group=make('g',{});root.append(group);
    if(variant==='prism'){
      const r=25+i*10,inner=r-4.5;
      for(let j=0;j<4;j++)group.append(make('path',{d:`M50 ${50-r} L${50+r} 50 L${50+inner} 50 L50 ${50-inner} Z`,fill:colours[j],transform:`rotate(${j*90} 50 50)`}));
    }else{
      const botanical=variant==='botanical',L=botanical&&i%2?39:47,w=botanical?(i%2?14:16):18;
      const d=botanical?`M50 50 C${50-w} ${50-L*.42} ${50-w*.62} ${50-L*.86} 50 ${50-L} C${50+w*.62} ${50-L*.86} ${50+w} ${50-L*.42} 50 50Z`:'M50 50 L32 28 L50 3 L68 28Z';
      const hue=colours[botanical?Math.floor(i/2):i];
      group.append(make('path',{d,fill:hue}));
      // One restrained facet plane, clipped by the actual petal silhouette.
      const clipId=`clip-${variant}-${crypto.randomUUID()}`;
      const clip=make('clipPath',{id:clipId});clip.append(make('path',{d}));
      group.append(clip,make('path',{d:'M50 0 H100 V100 H50Z',fill:'#000','fill-opacity':'.13','clip-path':`url(#${clipId})`}));
      group.append(make('path',{d:`M50 50 L50 ${50-L}`,fill:'none',stroke:'#fff','stroke-opacity':'.2','stroke-width':'.7'}));
    }
    return group;
  });
}
class MarkController{
  constructor(section){
    this.section=section;this.variant=section.dataset.variant;this.p=0;this.v=0;this.target=0;this.frame=0;this.timer=0;this.last=0;
    this.output=section.querySelector('output');this.toggle=section.querySelector('[data-action=toggle]');
    this.surfaces=[...section.querySelectorAll('svg')].map(svg=>({svg,heart:svg.querySelector('[data-heart]'),layers:createLayers(svg,this.variant)}));
    section.querySelectorAll('.mark-control,[data-action=toggle]').forEach(button=>button.addEventListener('click',()=>this.setTarget(1-this.target)));
    section.querySelector('[data-action=replay]').addEventListener('click',()=>this.replay());this.render();
  }
  render(){
    const p=clamp(this.p),g=geometry(this.variant,p);
    for(const surface of this.surfaces){
      surface.svg.dataset.progress=p.toFixed(4);
      surface.heart.setAttribute('transform',`translate(50 50) scale(${g.heart}) translate(-50 -50)`);
      surface.layers.forEach((node,i)=>{const part=g.petals[i];node.setAttribute('opacity',part.opacity);node.setAttribute('transform',this.variant==='prism'?`translate(50 50) scale(${part.scale}) translate(-50 -50)`:`translate(50 50) rotate(${part.angle}) scale(${part.scaleX} ${part.scaleY}) translate(-50 -50)`);});
    }
  }
  sync(){
    this.section.querySelectorAll('.mark-control').forEach(button=>button.setAttribute('aria-pressed',String(Boolean(this.target))));
    this.toggle.textContent=this.target?'Close':'Open';
    this.toggle.setAttribute('aria-pressed',String(Boolean(this.target)));
  }
  setTarget(target,automatic=false){
    clearTimeout(this.timer);this.timer=0;this.target=target;this.sync();
    if(isCalm){cancelAnimationFrame(this.frame);this.frame=0;this.p=target;this.v=0;this.render();this.settled();return;}
    this.output.textContent=target?'Opening':'Closing';
    if(!this.frame){this.last=performance.now();this.frame=requestAnimationFrame(time=>this.tick(time));}
    if(automatic)this.timer=setTimeout(()=>this.setTarget(0),1150);
  }
  tick(time){
    const next=springStep(this.p,this.v,this.target,(time-this.last)/1000);this.p=next.position;this.v=next.velocity;this.last=time;this.render();
    if(Math.abs(this.p-this.target)<.0005&&Math.abs(this.v)<.005){this.p=this.target;this.v=0;this.frame=0;this.render();this.settled();}
    else this.frame=requestAnimationFrame(nextTime=>this.tick(nextTime));
  }
  settled(){this.output.textContent=this.target?'Open':'Closed';this.section.dataset.state=this.target?'open':'closed';}
  replay(){if(isCalm){this.setTarget(0);return;}this.setTarget(1,true);}
  stop(){clearTimeout(this.timer);cancelAnimationFrame(this.frame);this.timer=0;this.frame=0;this.p=this.target;this.v=0;this.render();this.settled();}
}
const controllers=[...document.querySelectorAll('[data-variant]')].map(section=>new MarkController(section));
calm.addEventListener('change',()=>{userStill=calm.checked;isCalm=userStill||motionPreference.matches;calm.checked=isCalm;controllers.forEach(controller=>controller.stop());});
motionPreference.addEventListener('change',()=>{isCalm=motionPreference.matches||userStill;calm.checked=isCalm;controllers.forEach(controller=>controller.stop());});
document.getElementById('replay').addEventListener('click',()=>controllers.forEach(controller=>controller.replay()));
document.addEventListener('visibilitychange',()=>{if(document.hidden)controllers.forEach(controller=>{controller.target=0;controller.sync();controller.stop();});});
controllers.forEach(controller=>controller.replay());
