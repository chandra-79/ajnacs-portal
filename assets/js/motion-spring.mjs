/* A single time-based, critically damped spring. Retaining velocity makes
   a click during a fold change direction without restarting or snapping. */
export function springStep(position,velocity,target,seconds,frequency=13){
  const t=Math.min(.064,Math.max(0,seconds)),y=position-target;
  const c=velocity+frequency*y,decay=Math.exp(-frequency*t);
  return {position:target+(y+c*t)*decay,velocity:(velocity-frequency*c*t)*decay};
}
export const clamp=value=>Math.max(0,Math.min(1,value));
