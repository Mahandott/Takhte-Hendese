'use strict';
/* ================= ماژول تخته ================= */
const BOARD_COLORS=['#1c2733','#d23f31','#1565c0','#1e8e3e','#e8710a','#8e44ad','#d81b8c','#795548','#ffffff'];
const Board={
  cv:null, ctx:null, strokes:[], redo:[], tool:'pen', color:'#d23f31', width:3.5, bg:'plain',
  cur:null, labelN:0, saveTimer:null, lens:null, dpr:1, W:0, H:0,

  init(){
    this.cv=$('#boardCanvas'); this.ctx=this.cv.getContext('2d');
    this.lens=new Lens($('#boardLens'), this.cv);
    this.buildColors();
    $$('#view-board .tool').forEach(b=>b.addEventListener('click',()=>{
      this.setTool(b.dataset.tool);
    }));
    $('#boardWidth').addEventListener('change',e=>{this.width=+e.target.value;});
    $('#boardBg').addEventListener('change',e=>{this.bg=e.target.value; this.render(); this.save();});
    $('#boardUndo').addEventListener('click',()=>this.undo());
    $('#boardRedo').addEventListener('click',()=>this.redo());
    $('#boardClear').addEventListener('click',()=>{
      if(this.strokes.length && confirm('همه‌ی نوشته‌ها و شکل‌های تخته پاک شود؟')){
        this.redo=this.strokes.slice(); this.strokes=[]; this.render(); this.save();
      }
    });
    $('#boardPng').addEventListener('click',()=>this.exportPng());
    $('#boardMag').addEventListener('click',e=>{
      const on=this.lens.toggle(); e.currentTarget.classList.toggle('on',on);
      toast(on?'ذره‌بین روشن شد — ماوس را روی صفحه ببرید':'ذره‌بین خاموش شد');
    });
    $('#boardSyms').addEventListener('click',e=>{
      const r=e.currentTarget.getBoundingClientRect();
      this.pendingText=true;
      SymPad.open(r.left, r.top-8, {tagName:'INPUT', value:'', addEventListener(){}, dispatchEvent(){}, get selectionStart(){return 0;}});
      toast('روی «متن» بزنید و در کادر بازشده، از پالت نماد استفاده کنید');
    });
    const cv=this.cv;
    cv.addEventListener('pointerdown',e=>this.down(e));
    cv.addEventListener('pointermove',e=>this.move(e));
    cv.addEventListener('pointerup',e=>this.up(e));
    cv.addEventListener('pointercancel',e=>this.up(e));
    addEventListener('resize',()=>{ this.resizeCanvas(); this.render(); });

    const saved=Store.get('board',null);
    if(saved){
      this.strokes=saved.strokes||[]; this.bg=saved.bg||'plain'; this.labelN=saved.labelN||0;
      $('#boardBg').value=this.bg;
    }
    this.resizeCanvas(); this.render();
  },

  buildColors(){
    const wrap=$('#boardColors');
    BOARD_COLORS.forEach((c,i)=>{
      const b=document.createElement('button');
      b.className='chip'+(i===1?' sel':''); b.style.background=c; b.title=c;
      b.addEventListener('click',()=>{
        this.color=c;
        $$('#boardColors .chip').forEach(x=>x.classList.remove('sel'));
        b.classList.add('sel');
      });
      wrap.appendChild(b);
    });
  },

  setTool(t){
    this.tool=t;
    $$('#view-board .tool').forEach(b=>b.classList.toggle('active', b.dataset.tool===t));
    if(this.cv) this.cv.classList.toggle('cur-eraser', t==='eraser');
  },

  resizeCanvas(){
    const r=this.cv.getBoundingClientRect();
    this.dpr=window.devicePixelRatio||1;
    this.W=Math.max(50,r.width); this.H=Math.max(50,r.height);
    this.cv.width=Math.round(this.W*this.dpr);
    this.cv.height=Math.round(this.H*this.dpr);
  },

  n(e){ const r=this.cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/this.W, y:(e.clientY-r.top)/this.H}; },
  px(p){ return {x:p.x*this.W, y:p.y*this.H}; },
  tol(){ return 14/Math.max(this.W,this.H); },

  /* ---------- رویدادهای ماوس ---------- */
  down(e){
    if(e.button!==0) return;
    e.preventDefault();
    try{ this.cv.setPointerCapture(e.pointerId); }catch(_){ }
    const p=this.n(e);
    const t=this.tool;
    if(t==='pen'||t==='hl'){
      this.cur={type:t, pts:[p], color:this.color, w:this.width};
    }else if(t==='line'||t==='arrow'){
      this.cur={type:t, a:p, b:p, color:this.color, w:this.width};
    }else if(t==='circle'){
      this.cur={type:'circle', c:p, r:0, color:this.color, w:this.width};
    }else if(t==='dot'){
      const L=String.fromCharCode(65+(this.labelN%26))+(this.labelN>=26?String(Math.floor(this.labelN/26)+1):'');
      this.labelN++;
      this.strokes.push({type:'dot', x:p.x, y:p.y, label:L, color:this.color});
      this.commit();
    }else if(t==='text'){
      this.openTextInput(p);
    }else if(t==='eraser'){
      this.erasing=true; this.eraseAt(p);
    }else if(t==='tick'){
      this.tickAt(p);
    }else if(t==='angmark'){
      this.angAt(p,false);
    }else if(t==='rightangle'){
      this.angAt(p,true);
    }
    this.render();
  },
  move(e){
    if(this.erasing){ this.eraseAt(this.n(e)); return; }
    if(!this.cur){ return; }
    const p=this.n(e);
    if(this.cur.type==='pen'||this.cur.type==='hl'){
      const pts=this.cur.pts, last=pts[pts.length-1];
      if(Math.hypot((p.x-last.x)*this.W,(p.y-last.y)*this.H)>1.2) pts.push(p);
    }else if(this.cur.type==='circle'){
      this.cur.r=Math.hypot((p.x-this.cur.c.x)*this.W,(p.y-this.cur.c.y)*this.H)/Math.max(this.W,this.H)*1.0;
    }else{
      this.cur.b=p;
    }
    this.render();
  },
  up(e){
    this.erasing=false;
    if(!this.cur) return;
    const c=this.cur; this.cur=null;
    if(c.type==='pen'||c.type==='hl'){
      if(c.pts.length>1) this.strokes.push(c);
    }else if(c.type==='circle'){
      if(c.r>0.004) this.strokes.push(c);
    }else{
      if(Math.hypot((c.b.x-c.a.x)*this.W,(c.b.y-c.a.y)*this.H)>3) this.strokes.push(c);
    }
    this.commit();
  },

  commit(){
    this.redo=[];
    this.render(); this.save();
  },
  save(){
    clearTimeout(this.saveTimer);
    this.saveTimer=setTimeout(()=>{
      Store.set('board',{strokes:this.strokes, bg:this.bg, labelN:this.labelN});
    },350);
  },

  /* ---------- ابزارهای هندسی ---------- */
  findLine(p){
    let best=null,bd=20; // تحمل ۲۰ پیکسل
    for(const s of this.strokes){
      if(s.type!=='line'&&s.type!=='arrow') continue;
      const a=this.px(s.a), b=this.px(s.b), q=this.px(p);
      const t=clampSegT(q,a,b);
      if(t<0.12||t>0.88) continue;
      const d=distSeg(q,a,b);
      if(d<bd){bd=d;best=s;}
    }
    return best;
  },
  tickAt(p){
    const s=this.findLine(p);
    if(!s){ toast('روی یکی از خط‌های کشیده‌شده کلیک کنید تا علامت ضلع بخورد'); return; }
    s.marks=((s.marks||0)+1)%4;
    this.commit();
  },
  findJunction(p){
    const q=this.px(p), R=22;
    const ends=[];
    for(const s of this.strokes){
      if(s.type!=='line'&&s.type!=='arrow') continue;
      ends.push({s, pt:s.a}); ends.push({s, pt:s.b});
    }
    for(const e1 of ends){
      const p1=this.px(e1.pt);
      if(Math.hypot(p1.x-q.x,p1.y-q.y)>R) continue;
      for(const e2 of ends){
        if(e2.s===e1.s) continue;
        const p2=this.px(e2.pt);
        if(Math.hypot(p2.x-p1.x,p2.y-p1.y)<12){
          const o1=this.px(e1.pt===e1.s.a? e1.s.b : e1.s.a);
          const o2=this.px(e2.pt===e2.s.a? e2.s.b : e2.s.a);
          const u1=unit(o1.x-p1.x, o1.y-p1.y);
          const u2=unit(o2.x-p1.x, o2.y-p1.y);
          return {x:p1.x/this.W, y:p1.y/this.H, u1, u2};
        }
      }
    }
    return null;
  },
  angAt(p,right){
    const q=this.px(p);
    // اگر روی همین محل قبلاً علامت زاویه هست، تعداد را زیاد کن
    if(!right){
      for(const s of this.strokes){
        if(s.type!=='angmark') continue;
        const sp=this.px(s);
        if(Math.hypot(sp.x-q.x,sp.y-q.y)<22){ s.count=(s.count%3)+1; this.commit(); return; }
      }
    }
    const j=this.findJunction(p);
    if(!j){ toast(right?'سر مشترک دو خط را کلیک کنید':'سر مشترک دو خط (رأس زاویه) را کلیک کنید'); return; }
    if(right) this.strokes.push({type:'rightangle', x:j.x, y:j.y, u1:j.u1, u2:j.u2, color:this.color});
    else this.strokes.push({type:'angmark', x:j.x, y:j.y, a1:angOf(j.u1), a2:angOf(j.u2), count:1, color:this.color});
    this.commit();
  },
  eraseAt(p){
    const q=this.px(p); let idx=-1, bd=24; // تحمل ۲۴ پیکسل (واحد پیکسل، نه نرمال)
    this.strokes.forEach((s,i)=>{
      const d=this.strokeDist(s,q);
      if(d<bd){bd=d;idx=i;}
    });
    if(idx>=0){
      this.redo.push(this.strokes[idx]);
      this.strokes.splice(idx,1);
      this.commit();
    }
  },
  strokeDist(s,q){
    if(s.type==='dot') return Math.hypot(this.px(s).x-q.x,this.px(s).y-q.y)-4;
    if(s.type==='text'){ const t=this.px(s); return Math.max(Math.abs(t.x-q.x)-20, Math.abs(t.y-q.y)-12); }
    if(s.type==='line'||s.type==='arrow') return distSeg(q,this.px(s.a),this.px(s.b));
    if(s.type==='circle'){ const c=this.px(s); return Math.abs(Math.hypot(q.x-c.x,q.y-c.y)-s.r*Math.max(this.W,this.H)); }
    if(s.type==='angmark'||s.type==='rightangle'){ const c=this.px(s); return Math.hypot(c.x-q.x,c.y-q.y)-26; }
    if(s.pts){
      const P=s.pts.map(p=>this.px(p));
      if(P.length===1) return Math.hypot(P[0].x-q.x,P[0].y-q.y);
      let m=1e9;
      for(let i=0;i<P.length-1;i++) m=Math.min(m,distSeg(q,P[i],P[i+1]));
      return m;
    }
    return 1e9;
  },

  /* ---------- متن ---------- */
  openTextInput(p){
    this.closeTextInput();
    const inp=document.createElement('input');
    inp.id='boardTextIn';
    inp.style.left=(p.x*this.W-90)+'px';
    inp.style.top=(p.y*this.H-20)+'px';
    inp.style.width='180px';
    inp.dir='auto';
    $('#boardStage').appendChild(inp);
    inp.focus();
    const commit=(ok)=>{
      const v=inp.value.trim();
      this.closeTextInput();
      if(ok&&v){
        this.strokes.push({type:'text', x:p.x, y:p.y, text:v, color:this.color, sz:22/this.H});
        this.commit();
      }
    };
    inp.addEventListener('keydown',e=>{
      if(e.key==='Enter') commit(true);
      if(e.key==='Escape') commit(false);
      e.stopPropagation();
    });
    inp.addEventListener('blur',()=>commit(true));
    this.textInput=inp;
  },
  closeTextInput(){
    const t=document.getElementById('boardTextIn');
    if(t) t.remove();
    this.textInput=null;
  },

  /* ---------- واگرد ---------- */
  undo(){
    if(!this.strokes.length) return;
    this.redo.push(this.strokes.pop());
    this.render(); this.save();
  },
  redoOp(){
    if(!this.redo.length) return;
    this.strokes.push(this.redo.pop());
    this.render(); this.save();
  },

  /* ---------- رسم ---------- */
  drawBg(){
    const c=this.ctx, W=this.W, H=this.H;
    if(this.bg==='dark'){ c.fillStyle='#101820'; c.fillRect(0,0,W,H); return; }
    c.fillStyle='#ffffff'; c.fillRect(0,0,W,H);
    c.save();
    c.strokeStyle=this.bg==='grid'?'#dbe5f0':'#d9e3ee';
    c.fillStyle='#c9d6e4';
    c.lineWidth=1;
    const step=44;
    if(this.bg==='grid'){
      for(let x=step;x<W;x+=step){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
      for(let y=step;y<H;y+=step){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    }else if(this.bg==='dots'){
      for(let x=step/2;x<W;x+=step)
        for(let y=step/2;y<H;y+=step){ c.beginPath(); c.arc(x,y,1.6,0,Math.PI*2); c.fill(); }
    }
    c.restore();
  },
  render(){
    const c=this.ctx;
    c.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.drawBg();
    for(const s of this.strokes) this.drawStroke(c,s);
    if(this.cur) this.drawStroke(c,this.cur);
  },
  drawStroke(c,s){
    if(s.type==='pen'||s.type==='hl'){
      const w=s.type==='hl'? s.w*5 : s.w;
      c.save();
      c.globalAlpha=s.type==='hl'?0.32:1;
      c.strokeStyle=s.color; c.lineWidth=w; c.lineCap='round'; c.lineJoin='round';
      c.beginPath();
      const pts=s.pts;
      if(pts.length<3){ const a=this.px(pts[0]), b=this.px(pts[pts.length-1]); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y); }
      else{
        let p0=this.px(pts[0]); c.moveTo(p0.x,p0.y);
        for(let i=1;i<pts.length-1;i++){
          const p1=this.px(pts[i]), p2=this.px(pts[i+1]);
          c.quadraticCurveTo(p1.x,p1.y,(p1.x+p2.x)/2,(p1.y+p2.y)/2);
        }
      }
      c.stroke(); c.restore();
    }else if(s.type==='line'||s.type==='arrow'){
      const a=this.px(s.a), b=this.px(s.b);
      drawSeg(c,a,b,{color:s.color,w:s.w});
      if(s.marks) tickMark(c,a,b,s.marks,s.color);
      if(s.type==='arrow'){
        const u=unit(b.x-a.x,b.y-a.y), n={x:-u.y,y:u.x};
        c.save(); c.fillStyle=s.color; c.beginPath();
        c.moveTo(b.x,b.y);
        c.lineTo(b.x-u.x*14+n.x*6, b.y-u.y*14+n.y*6);
        c.lineTo(b.x-u.x*14-n.x*6, b.y-u.y*14-n.y*6);
        c.closePath(); c.fill(); c.restore();
      }
    }else if(s.type==='circle'){
      const ctr=this.px(s);
      drawCircle(c,ctr,s.r*Math.max(this.W,this.H),{color:s.color,w:s.w});
    }else if(s.type==='dot'){
      const p=this.px(s);
      drawDot(c,p,4.5,s.color);
      if(s.label) drawLabel(c,s.label,{x:p.x+2,y:p.y-14},{color:s.color,size:17});
    }else if(s.type==='text'){
      const p=this.px(s);
      c.save();
      c.fillStyle=s.color;
      c.font='bold '+Math.round(s.sz*this.H)+'px Vazirmatn, Tahoma, "Segoe UI", sans-serif';
      c.textAlign='center'; c.textBaseline='middle';
      c.fillText(s.text,p.x,p.y);
      c.restore();
    }else if(s.type==='angmark'){
      const p=this.px(s);
      angMark(c,p,{x:Math.cos(s.a1),y:Math.sin(s.a1)},{x:Math.cos(s.a2),y:Math.sin(s.a2)},s.count,s.color);
    }else if(s.type==='rightangle'){
      const p=this.px(s);
      rightAngleMark(c,p,{x:s.u1.x,y:s.u1.y},{x:s.u2.x,y:s.u2.y},20,s.color);
    }
  },

  exportPng(){
    const a=document.createElement('a');
    a.download='takhte-'+Date.now()+'.png';
    a.href=this.cv.toDataURL('image/png');
    a.click();
    toast('تصویر تخته ذخیره شد (در پوشه Downloads مرورگر)');
  }
};
