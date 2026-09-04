const stick=document.getElementById('stick'),nub=document.getElementById('nub');
function joyMove(e){
  const r=stick.getBoundingClientRect();
  const cx=r.left+r.width/2,cy=r.top+r.height/2;
  const dx=e.clientX-cx,dy=e.clientY-cy;
  const m=Math.min(45,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);
  joy.x=Math.cos(a)*m/45; joy.y=Math.sin(a)*m/45;
  nub.style.transform='translate('+joy.x*45+'px,'+joy.y*45+'px)';
}
stick.addEventListener('pointerdown',e=>{joy.active=true;stick.setPointerCapture(e.pointerId);joyMove(e)});
stick.addEventListener('pointermove',e=>{if(joy.active)joyMove(e)});
stick.addEventListener('pointerup',()=>{joy.active=false;joy.x=joy.y=0;nub.style.transform='translate(0,0)'});
