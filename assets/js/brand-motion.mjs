import {springStep,clamp} from './motion-spring.mjs';

/* Option B: the eight-petal bloom chosen by Chandra. SVG geometry stays
   flat and exact; no CSS hover/load animations compete for transforms. */
export class BrandBloom{
  constructor(button,preference=matchMedia('(prefers-reduced-motion: reduce)')){
    this.button=button;this.preference=preference;this.p=0;this.velocity=0;this.target=0;this.frame=0;this.timer=0;
    this.svg=button.querySelector('.ajna-mark');
    this.leaves=[...this.svg.querySelectorAll('.am-leaf')];
    this.heart=[...this.svg.querySelectorAll('.am-bud,.am-core')];
    button.addEventListener('click',()=>this.move(1-this.target));
    preference.addEventListener('change',()=>this.settle(this.target));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.settle(0);});
    this.paint();this.sync();
    if(button.hasAttribute('data-arrival')&&!preference.matches){
      this.move(1);this.timer=setTimeout(()=>this.move(0),1150);
    }
  }
  sync(){
    this.button.setAttribute('aria-pressed',String(Boolean(this.target)));
    this.button.setAttribute('aria-label',`${this.target?'Close':'Open'} Ajna logo`);
  }
  paint(){
    const p=clamp(this.p),scale=1-.6*p,opacity=p*p*(3-2*p);
    this.svg.dataset.progress=p.toFixed(4);
    for(const node of this.heart)node.setAttribute('transform',`translate(50 50) scale(${scale}) translate(-50 -50)`);
    this.leaves.forEach((leaf,i)=>{
      leaf.setAttribute('opacity',opacity);
      leaf.setAttribute('transform',`translate(50 50) rotate(${i*45}) scale(${.38+.62*p} ${.02+.98*p}) translate(-50 -50)`);
    });
  }
  move(target){
    clearTimeout(this.timer);this.timer=0;this.target=target;this.sync();
    if(this.preference.matches){this.settle(target);return;}
    if(!this.frame){this.last=performance.now();this.frame=requestAnimationFrame(t=>this.tick(t));}
  }
  tick(time){
    const next=springStep(this.p,this.velocity,this.target,(time-this.last)/1000);
    this.p=next.position;this.velocity=next.velocity;this.last=time;this.paint();
    if(Math.abs(this.p-this.target)<.0005&&Math.abs(this.velocity)<.005){
      this.frame=0;this.p=this.target;this.velocity=0;this.paint();
    }else this.frame=requestAnimationFrame(t=>this.tick(t));
  }
  settle(target){
    clearTimeout(this.timer);cancelAnimationFrame(this.frame);this.timer=0;this.frame=0;
    this.p=this.target=target;this.velocity=0;this.sync();this.paint();
  }
}
document.querySelectorAll('[data-ajna-motion]').forEach(button=>new BrandBloom(button));
