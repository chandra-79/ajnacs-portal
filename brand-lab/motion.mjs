/* Critically damped, time-based motion. One scalar drives every surface;
   reversing the target retains current position and velocity. No CSS
   animations, competing hover states, queued click handlers or libraries. */
import {springStep,clamp} from '../assets/js/motion-spring.mjs';
export {springStep,clamp};
export function geometry(variant,progress){
  const p=clamp(progress), eased=p*p*(3-2*p);
  if(variant==='prism')return {heart:1-.69*p,petals:Array.from({length:3},(_,i)=>({angle:0,scale:.31+(1-.31)*p,opacity:eased,radius:25+i*10}))};
  const count=variant==='botanical'?8:4;
  return {heart:1-(variant==='botanical'?.6:.64)*p,petals:Array.from({length:count},(_,i)=>({angle:i*360/count,scaleX:.38+.62*p,scaleY:.02+.98*p,opacity:eased,length:count===8&&i%2?39:47}))};
}
