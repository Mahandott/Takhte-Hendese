'use strict';
/* ================= هسته ================= */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const FA = '۰۱۲۳۴۵۶۷۸۹';
function faDigits(s){ return String(s).replace(/[0-9]/g, d => FA[+d]); }
function faNum(v, dec){
  if (dec == null) dec = 2;
  if (!isFinite(v)) return '—';
  let s = v.toFixed(dec);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return faDigits(s).replace('.', '٫');
}
const clamp = (v,a,b) => v < a ? a : (v > b ? b : v);
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const mid = (a,b) => ({x:(a.x+b.x)/2, y:(a.y+b.y)/2});
function unit(dx,dy){ const l = Math.hypot(dx,dy)||1; return {x:dx/l, y:dy/l}; }
function rot(v, ang){ const c=Math.cos(ang), s=Math.sin(ang); return {x:v.x*c-v.y*s, y:v.x*s+v.y*c}; }
const angOf = v => Math.atan2(v.y, v.x);

/* --- هندسه --- */
function lineXline(p1,p2,p3,p4){
  const d1x=p2.x-p1.x, d1y=p2.y-p1.y, d2x=p4.x-p3.x, d2y=p4.y-p3.y;
  const den = d1x*d2y - d1y*d2x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((p3.x-p1.x)*d2y - (p3.y-p1.y)*d2x)/den;
  return {x:p1.x+d1x*t, y:p1.y+d1y*t};
}
function circleXcircle(c1,r1,c2,r2){
  const dx=c2.x-c1.x, dy=c2.y-c1.y, d=Math.hypot(dx,dy);
  if (d < 1e-9 || d > r1+r2 || d < Math.abs(r1-r2)) return [];
  const a = (r1*r1 - r2*r2 + d*d) / (2*d);
  const h2 = r1*r1 - a*a;
  if (h2 < 0) return [];
  const h = Math.sqrt(h2);
  const mx = c1.x + a*dx/d, my = c1.y + a*dy/d;
  return [ {x:mx + h*dy/d, y:my - h*dx/d}, {x:mx - h*dy/d, y:my + h*dx/d} ];
}
function lineXcircle(p1,p2,c,r){ // تقاطع خط بی‌نهایت با دایره
  const dx=p2.x-p1.x, dy=p2.y-p1.y, L2=dx*dx+dy*dy;
  if (L2 < 1e-12) return [];
  const t = ((c.x-p1.x)*dx + (c.y-p1.y)*dy)/L2;
  const fx=p1.x+dx*t, fy=p1.y+dy*t;
  const d2=(fx-c.x)**2+(fy-c.y)**2;
  if (d2 > r*r) return [];
  const h=Math.sqrt(r*r-d2), ux=dx/Math.sqrt(L2), uy=dy/Math.sqrt(L2);
  return [ {x:fx+h*ux, y:fy+h*uy}, {x:fx-h*ux, y:fy-h*uy} ];
}
function footPerp(p,a,b){ // پای عمود از p بر خط a-b (بی‌نهایت)
  const dx=b.x-a.x, dy=b.y-a.y, L2=dx*dx+dy*dy;
  if (L2 < 1e-12) return {x:a.x, y:a.y};
  const t = ((p.x-a.x)*dx + (p.y-a.y)*dy)/L2;
  return {x:a.x+dx*t, y:a.y+dy*t};
}
function distSeg(p,a,b){ const f=footPerp(p,a,b); const t=clampSegT(p,a,b); const q={x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t}; return Math.hypot(p.x-q.x,p.y-q.y); }
function clampSegT(p,a,b){ const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy; if(L2<1e-12)return 0; return clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/L2,0,1); }
function area3(a,b,c){ return Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))/2; }
function angDeg(v){ return ((angOf(v)*180/Math.PI)+360)%360; }
function diffAng(a,b){ let d=Math.abs(a-b)%360; return d>180?360-d:d; }

/* --- تم --- */
const THEMES = {
  light:{ bg:'#ffffff', frame:'#c9d4e2', ink:'#1c2733', dim:'#7c8ca0', grid:'#dfe7f0',
          const:'#8a97a8', prim:'#0f62b5', accent:'#e8710a', ok:'#1e8e3e', err:'#d23f31',
          pt:'#0f62b5', ptFill:'#ffffff', paper:'#ffffff', hlBg:'rgba(232,113,10,.10)' },
  night:{ bg:'#121a24', frame:'#2c3a4c', ink:'#e8eef6', dim:'#93a5ba', grid:'#233043',
          const:'#5c7089', prim:'#5aa7f0', accent:'#ffa050', ok:'#4cd471', err:'#ff8175',
          pt:'#5aa7f0', ptFill:'#101820', paper:'#121a24', hlBg:'rgba(255,160,80,.12)' }
};
let THEME = 'light';
function T(name){ return THEMES[THEME][name]; }

/* --- ذخیره‌سازی --- */
const Store = {
  get(k, def){ try{ const v = localStorage.getItem('hb.'+k); return v==null?def:JSON.parse(v); }catch(e){ return def; } },
  set(k, v){ try{ localStorage.setItem('hb.'+k, JSON.stringify(v)); }catch(e){} }
};

/* --- توست --- */
let toastTimer=null;
function toast(msg, ms){
  const t=$('#toast'); t.textContent=msg; t.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>{t.hidden=true;}, ms||2200);
}

/* --- تبدیل مختصات بوم (فضای منطقی 1200×740) --- */
class View{
  constructor(canvas, LW, LH){
    this.cv=canvas; this.ctx=canvas.getContext('2d');
    this.LW=LW||1200; this.LH=LH||740; this.dpr=1; this.scale=1; this.ox=0; this.oy=0;
    this.resize();
  }
  resize(){
    const r=this.cv.getBoundingClientRect();
    const w=Math.max(50, r.width), h=Math.max(50, r.height);
    this.dpr=window.devicePixelRatio||1;
    this.cv.width=Math.round(w*this.dpr); this.cv.height=Math.round(h*this.dpr);
    this.scale=Math.min(w/this.LW, h/this.LH);
    this.ox=(w-this.LW*this.scale)/2; this.oy=(h-this.LH*this.scale)/2;
  }
  begin(){
    const c=this.ctx;
    c.setTransform(this.dpr,0,0,this.dpr,0,0);
    c.clearRect(0,0,this.cv.width,this.cv.height);
    c.translate(this.ox,this.oy); c.scale(this.scale,this.scale);
  }
  toLg(e){ // رویداد ماوس → فضای منطقی
    const r=this.cv.getBoundingClientRect();
    return { x:(e.clientX-r.left-this.ox)/this.scale, y:(e.clientY-r.top-this.oy)/this.scale };
  }
}

/* --- پرimitive های رسم (فضای منطقی) --- */
function drawSeg(c,a,b,st){ st=st||{}; c.save(); c.strokeStyle=st.color||T('ink'); c.lineWidth=st.w||2.5;
  if(st.cap!==false)c.lineCap='round';
  if(st.dash)c.setLineDash(st.dash); if(st.alpha)c.globalAlpha=st.alpha;
  c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y); c.stroke(); c.restore(); }
function drawRay(c,from,dir,st){ const L=3000; drawSeg(c,from,{x:from.x+dir.x*L,y:from.y+dir.y*L},st); }
function drawLine(c,a,b,st){ const L=3000,d=unit(b.x-a.x,b.y-a.y); drawSeg(c,{x:a.x-d.x*L,y:a.y-d.y*L},{x:a.x+d.x*L,y:a.y+d.y*L},st); }
function drawCircle(c,ctr,r,st){ st=st||{}; c.save(); c.strokeStyle=st.color||T('ink'); c.lineWidth=st.w||2;
  if(st.dash)c.setLineDash(st.dash); if(st.alpha)c.globalAlpha=st.alpha;
  c.beginPath(); c.arc(ctr.x,ctr.y,Math.max(.5,r),0,Math.PI*2); c.stroke(); c.restore(); }
function drawArc(c,ctr,r,a0,a1,st){ st=st||{};
  let d=a1-a0; while(d<0)d+=Math.PI*2; while(d>Math.PI*2)d-=Math.PI*2;
  c.save(); c.strokeStyle=st.color||T('const'); c.lineWidth=st.w||1.8;
  if(st.dash)c.setLineDash(st.dash); if(st.alpha)c.globalAlpha=st.alpha;
  c.beginPath(); c.arc(ctr.x,ctr.y,Math.max(.5,r),a0,a0+d); c.stroke(); c.restore(); }
function drawDot(c,p,r,color){ c.save(); c.fillStyle=color||T('pt');
  c.beginPath(); c.arc(p.x,p.y,r||4.5,0,Math.PI*2); c.fill(); c.restore(); }
function drawLabel(c,text,p,st){ st=st||{}; c.save();
  c.direction='ltr';
  c.fillStyle=st.color||T('ink'); c.globalAlpha=st.alpha==null?1:st.alpha;
  c.font=(st.bold===false?'':'bold ')+(st.size||19)+'px Vazirmatn, Tahoma, "Segoe UI", sans-serif';
  c.textAlign=st.align||'center'; c.textBaseline='middle';
  if(st.halo!==false){ c.lineWidth=4; c.strokeStyle=T('paper'); c.strokeText(text,p.x,p.y); }
  c.fillText(text,p.x,p.y); c.restore(); }
function rightAngleMark(c,vertex,dir1,dir2,size,color){
  const u1=unit(dir1.x,dir1.y), u2=unit(dir2.x,dir2.y), s=size||22;
  const p1={x:vertex.x+u1.x*s,y:vertex.y+u1.y*s};
  const p2={x:vertex.x+(u1.x+u2.x)*s*.72,y:vertex.y+(u1.y+u2.y)*s*.72};
  const p3={x:vertex.x+u2.x*s,y:vertex.y+u2.y*s};
  c.save(); c.strokeStyle=color||T('ink'); c.lineWidth=1.8; c.beginPath();
  c.moveTo(p1.x,p1.y); c.lineTo(p2.x,p2.y); c.lineTo(p3.x,p3.y); c.stroke(); c.restore();
}
function arcBetween(c,ctr,r,d1,d2,st){
  // کمان کوتاه بین دو جهت
  let a0=angOf(d1), a1=angOf(d2);
  while(a1<a0)a1+=Math.PI*2;
  if(a1-a0>Math.PI){ const t=a0; a0=a1; a1=t+Math.PI*2; }
  drawArc(c,ctr,r,a0,a1,st);
}
function angMark(c,vertex,d1,d2,count,color){
  const r=count>=3?34:26;
  arcBetween(c,vertex,r,d1,d2,{color:color||T('accent'), w:2.2});
  if(count>=2) arcBetween(c,vertex,r+7,d1,d2,{color:color||T('accent'), w:2.2});
}
function tickMark(c,a,b,count,color){
  if(count<=0) return;
  const m=mid(a,b), u=unit(b.x-a.x,b.y-a.y), n={x:-u.y,y:u.x};
  c.save(); c.strokeStyle=color||T('accent'); c.lineWidth=2.4; c.lineCap='round';
  for(let i=0;i<count;i++){
    const off=(i-(count-1)/2)*8;
    const q={x:m.x+u.x*off, y:m.y+u.y*off};
    c.beginPath(); c.moveTo(q.x-n.x*9, q.y-n.y*9); c.lineTo(q.x+n.x*9, q.y+n.y*9); c.stroke();
  }
  c.restore();
}
function parallelArrow(c,a,b,color){
  const m=mid(a,b), u=unit(b.x-a.x,b.y-a.y), n={x:-u.y,y:u.x};
  c.save(); c.strokeStyle=color||T('accent'); c.lineWidth=2; c.lineCap='round';
  for(let k=-1;k<=1;k+=2){
    const q={x:m.x+u.x*k*10, y:m.y+u.y*k*10};
    c.beginPath();
    c.moveTo(q.x-n.x*7+u.x*5, q.y-n.y*7+u.y*5);
    c.lineTo(q.x, q.y);
    c.lineTo(q.x-n.x*7-u.x*5, q.y-n.y*7-u.y*5);
    c.stroke();
  }
  c.restore();
}

/* --- صحنه هندسی تعاملی --- */
class GeoScene{
  constructor(view, opts){
    this.view=view; this.opts=opts||{};
    this.points=[]; this.el=[]; this.drag=null; this.onChange=null;
    const cv=view.cv;
    cv.addEventListener('pointerdown', e=>this.onDown(e));
    cv.addEventListener('pointermove', e=>this.onMove(e));
    cv.addEventListener('pointerup', e=>this.onUp(e));
    cv.addEventListener('pointercancel', e=>this.onUp(e));
    cv.style.cursor='crosshair';
  }
  addPoint(id,x,y,opt){
    opt=opt||{};
    const p={id,x,y,label:opt.label||'', r:opt.r||8, constrain:opt.constrain||null,
             color:opt.color||null, hide:!!opt.hide, off:opt.off||null};
    this.points.push(p); return p;
  }
  get(id){ return this.points.find(p=>p.id===id); }
  pos(id){ const p=this.get(id); return p?{x:p.x,y:p.y}:{x:0,y:0}; }
  setPos(id,x,y){ const p=this.get(id); if(!p)return;
    const q=p.constrain? p.constrain({x,y},p) : {x,y};
    p.x=q.x; p.y=q.y; }
  hit(p){
    const R=20;
    let best=null, bd=R;
    for(const pt of this.points){ if(pt.hide)continue;
      const d=Math.hypot(pt.x-p.x,pt.y-p.y);
      if(d<bd){bd=d;best=pt;}
    }
    return best;
  }
  onDown(e){
    e.preventDefault();
    const p=this.view.toLg(e);
    this.customDrag=null;
    if(this.opts.dragHook){
      const cd=this.opts.dragHook(p,e);
      if(cd){ this.customDrag=cd; this.view.cv.setPointerCapture(e.pointerId);
        this.view.cv.style.cursor='grabbing'; return; }
    }
    const pt=this.hit(p);
    if(pt){ this.drag=pt; this.view.cv.setPointerCapture(e.pointerId); this.view.cv.style.cursor='grabbing'; }
    if(this.opts.onDown) this.opts.onDown(p, pt, e);
  }
  onMove(e){
    const p=this.view.toLg(e);
    if(this.customDrag){
      e.preventDefault();
      this.customDrag.move(p);
      if(this.onChange)this.onChange();
      this.render();
      return;
    }
    if(this.drag){
      e.preventDefault();
      this.setPos(this.drag.id, p.x, p.y);
      if(this.onChange)this.onChange();
      this.render();
    }else{
      const h=this.hit(p);
      this.view.cv.style.cursor = h? 'grab':'crosshair';
      if(this.opts.onHover) this.opts.onHover(p);
    }
  }
  onUp(e){
    if(this.drag){ this.drag=null; this.view.cv.style.cursor='crosshair';
      if(this.onChange)this.onChange(); }
    this.customDrag=null;
    if(this.opts.onUp) this.opts.onUp(this.view.toLg(e), e);
  }
  labelPos(p){
    if(p.off) return {x:p.x+p.off[0], y:p.y+p.off[1]};
    return {x:p.x, y:p.y-16};
  }
  render(){
    const v=this.view, c=v.ctx;
    v.begin();
    // قاب صحنه
    c.save();
    c.fillStyle=T('bg');
    const r=10;
    c.beginPath();
    c.moveTo(r,0); c.lineTo(this.view.LW-r,0); c.quadraticCurveTo(this.view.LW,0,this.view.LW,r);
    c.lineTo(this.view.LW,this.view.LH-r); c.quadraticCurveTo(this.view.LW,this.view.LH,this.view.LW-r,this.view.LH);
    c.lineTo(r,this.view.LH); c.quadraticCurveTo(0,this.view.LH,0,this.view.LH-r);
    c.lineTo(0,r); c.quadraticCurveTo(0,0,r,0);
    c.fill();
    c.strokeStyle=T('frame'); c.lineWidth=2; c.stroke();
    c.restore();
    if(this.opts.draw) this.opts.draw(c, this);
    for(const p of this.points){
      if(p.hide) continue;
      drawDot(c,p,p.r,p.color||T('pt'));
      if(p.label){
        const lp=this.labelPos(p);
        drawLabel(c,p.label,lp,{size:20, color:p.color||T('ink')});
      }
    }
  }
}

/* --- افکت‌های سراسری: لیزر و اسپات‌لایت --- */
const Fx = {
  mode:null, raf:null, mx:innerWidth/2, my:innerHeight/2,
  cv:null, ctx:null,
  init(){ this.cv=$('#fxCanvas'); this.ctx=this.cv.getContext('2d');
    addEventListener('pointermove', e=>{ this.mx=e.clientX; this.my=e.clientY; }, {passive:true});
    addEventListener('resize', ()=>{ if(this.mode) this.size(); });
  },
  size(){ this.cv.width=innerWidth; this.cv.height=innerHeight; },
  start(mode){
    this.stop();
    this.mode=mode; this.size(); this.cv.hidden=false;
    document.body.style.cursor = mode==='laser' ? 'none' : 'crosshair';
    const loop=()=>{ this.draw(); this.raf=requestAnimationFrame(loop); };
    loop();
  },
  stop(){
    if(this.raf) cancelAnimationFrame(this.raf);
    this.raf=null; this.mode=null; this.cv.hidden=true;
    document.body.style.cursor='';
    $('#btnLaser').classList.remove('on'); $('#btnSpot').classList.remove('on');
  },
  draw(){
    const c=this.ctx, W=this.cv.width, H=this.cv.height;
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,W,H);
    if(this.mode==='spot'){
      c.fillStyle='rgba(6,10,16,.94)';
      c.fillRect(0,0,W,H);
      c.save();
      c.globalCompositeOperation='destination-out';
      const g=c.createRadialGradient(this.mx,this.my,60,this.mx,this.my,190);
      g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=g;
      c.beginPath(); c.arc(this.mx,this.my,190,0,Math.PI*2); c.fill();
      c.restore();
    }else if(this.mode==='laser'){
      c.save();
      c.shadowColor='rgba(255,40,30,.9)'; c.shadowBlur=18;
      c.fillStyle='#ff2e20';
      c.beginPath(); c.arc(this.mx,this.my,6,0,Math.PI*2); c.fill();
      c.shadowBlur=0; c.globalAlpha=.35;
      c.beginPath(); c.arc(this.mx,this.my,13,0,Math.PI*2); c.fill();
      c.restore();
    }
  }
};

/* --- ذره‌بین --- */
class Lens{
  constructor(lensCv, sourceCv, listenEl){ this.cv=lensCv; this.ctx=lensCv.getContext('2d'); this.src=sourceCv; this.on=false;
    const move=e=>{
      if(!this.on){ this.cv.hidden=true; return; }
      const r=sourceCv.getBoundingClientRect();
      const x=e.clientX-r.left, y=e.clientY-r.top;
      const dpr=window.devicePixelRatio||1;
      const Z=2.2, R=80;
      this.cv.style.left=(e.clientX-r.left-90)+'px';
      this.cv.style.top=(e.clientY-r.top-90)+'px';
      const c=this.ctx;
      c.setTransform(1,0,0,1,0,0);
      c.clearRect(0,0,180,180);
      c.save();
      c.beginPath(); c.arc(90,90,86,0,Math.PI*2); c.clip();
      c.fillStyle='#fff'; c.fillRect(0,0,180,180);
      try{
        c.drawImage(this.src, (x-Z*90/R)*dpr, (y-Z*90/R)*dpr, Z*180/R*dpr, Z*180/R*dpr, 0,0,180,180);
      }catch(err){}
      c.restore();
    };
    (listenEl||sourceCv).addEventListener('pointermove', move, {passive:true});
  }
  toggle(){ this.on=!this.on; this.cv.hidden=!this.on; return this.on; }
  off(){ this.on=false; this.cv.hidden=true; }
}

/* --- پالت نمادها --- */
const Syms=['∠','°','∥','⊥','≅','∼','△','▱','√','²','³','⇒','⇔','≠','≤','≥','≈','×','±','△'];
const SymPad={
  target:null,
  open(x,y,target){
    const pad=$('#symPad');
    this.target=target;
    if(pad.childElementCount===0){
      Syms.forEach(s=>{
        const b=document.createElement('button');
        b.textContent=s;
        b.addEventListener('pointerdown', e=>e.preventDefault());
        b.addEventListener('click', ()=>{
          const t=this.target;
          if(t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA')){
            const st=t.selectionStart==null? t.value.length : t.selectionStart;
            t.value=t.value.slice(0,st)+s+t.value.slice(t.selectionEnd==null?st:t.selectionEnd);
            t.focus();
            t.dispatchEvent(new Event('input'));
          }
        });
        pad.appendChild(b);
      });
    }
    pad.hidden=false;
    const pw=pad.offsetWidth, ph=pad.offsetHeight;
    pad.style.left=clamp(x-pw/2, 8, innerWidth-pw-8)+'px';
    pad.style.top=clamp(y-ph-14, 8, innerHeight-ph-8)+'px';
  },
  close(){ $('#symPad').hidden=true; }
};
document.addEventListener('pointerdown', e=>{
  const pad=$('#symPad');
  if(!pad.hidden && !pad.contains(e.target) && e.target.id!=='boardSyms' && e.target.id!=='istSyms')
    SymPad.close();
}, true);

/* --- کمکی رنگ‌های ماژول‌ها --- */
const C_A='#d23f31', C_B='#1565c0', C_T1='#0f62b5', C_T2='#e8710a';
function pickCol(c,name){ return THEME==='night' ? ({a:'#ff8175',b:'#6fb1ff',t1:'#5aa7f0',t2:'#ffa050'})[name] : ({a:C_A,b:C_B,t1:C_T1,t2:C_T2})[name]; }
