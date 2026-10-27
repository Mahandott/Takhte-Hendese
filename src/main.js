'use strict';
/* ================= راه‌اندازی برنامه ================= */
const Timer={
  running:false, mode:'up', base:0, startedAt:0, targetSec:600, iv:null, ended:false,

  init(){
    $$('#timerModal input[name=tmode]').forEach(r=>r.addEventListener('change',()=>{
      this.mode=document.querySelector('#timerModal input[name=tmode]:checked').value;
      if(!this.running){ this.reset(); }
    }));
    $('#timerMin').addEventListener('input',()=>{
      this.targetSec=clamp((+$('#timerMin').value||10)*60,60,180*60);
      if(!this.running&&this.mode==='down') this.reset();
    });
    $('#timerToggle').addEventListener('click',()=>this.toggle());
    $('#timerReset').addEventListener('click',()=>this.reset());
    $('#timerClose').addEventListener('click',()=>{ $('#timerModal').hidden=true; });
  },
  elapsed(){
    return this.base + (this.running? (Date.now()-this.startedAt)/1000 : 0);
  },
  display(){
    if(this.mode==='up') return this.elapsed();
    return this.targetSec - this.elapsed();
  },
  fmt(sec){
    sec=Math.max(0,Math.round(sec));
    const m=Math.floor(sec/60), s=sec%60;
    return faDigits(String(m).padStart(2,'0'))+':'+faDigits(String(s).padStart(2,'0'));
  },
  toggle(){
    this.ended=false;
    $('#timerBig').classList.remove('over');
    if(this.running){
      this.base=this.elapsed(); this.running=false;
      clearInterval(this.iv); this.iv=null;
      $('#timerToggle').textContent='ادامه';
    }else{
      this.startedAt=Date.now();
      this.running=true;
      $('#timerToggle').textContent='توقف';
      this.iv=setInterval(()=>this.tick(),250);
    }
    this.tick();
  },
  reset(){
    this.running=false; this.base=0; this.ended=false;
    clearInterval(this.iv); this.iv=null;
    $('#timerToggle').textContent='شروع';
    $('#timerBig').classList.remove('over');
    this.tick();
  },
  tick(){
    const d=this.display();
    const t=this.fmt(d);
    $('#timerBig').textContent=t;
    $('#timerMini').textContent=(this.running||this.base>0)? ' '+t : '';
    if(this.mode==='down'&&!this.ended&&d<=0){
      this.ended=true;
      $('#timerBig').classList.add('over');
      this.beep();
      toast('زمان ارائه تمام شد');
    }
  },
  beep(){
    try{
      const ac=new (window.AudioContext||window.webkitAudioContext)();
      [0,260,520].forEach(off=>{
        const o=ac.createOscillator(), g=ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.frequency.value=880; g.gain.value=.22;
        o.start(ac.currentTime+off/1000);
        o.stop(ac.currentTime+off/1000+0.14);
      });
      setTimeout(()=>ac.close(),900);
    }catch(e){}
  }
};

const App={
  tab:'tarsim',

  init(){
    const st=Store.get('settings',{});
    THEME=st.theme||'light';
    if(THEME==='night'){ document.documentElement.classList.add('night'); $('#btnNight').classList.add('on'); }

    Fx.init();
    Timer.init();

    $$('#tabs .tab').forEach(b=>b.addEventListener('click',()=>this.show(b.dataset.tab)));
    $('#btnFull').addEventListener('click',()=>this.toggleFull());
    $('#btnNight').addEventListener('click',()=>this.toggleNight());
    $('#btnLaser').addEventListener('click',()=>this.toggleFx('laser'));
    $('#btnSpot').addEventListener('click',()=>this.toggleFx('spot'));
    $('#btnTimer').addEventListener('click',()=>{ $('#timerModal').hidden=false; });
    $('#btnHelp').addEventListener('click',()=>{ $('#helpModal').hidden=false; });
    $('#helpClose').addEventListener('click',()=>{ $('#helpModal').hidden=true; });
    $('#cardsClose').addEventListener('click',()=>{ $('#cardsModal').hidden=true; });
    $$('.modal').forEach(m=>m.addEventListener('pointerdown',e=>{ if(e.target===m) m.hidden=true; }));

    [[Board,'board'],[Tarsim,'tarsim'],[Thales,'thales'],[Tash,'tashaboh'],[Ist,'istidlal'],[PdfV,'pdf']].forEach(([m,id])=>{
      try{ m.init(); }catch(e){ console.error('خطا در راه‌اندازی '+id, e); toast('بخشی کامل بالا نیامد: '+id); }
    });

    addEventListener('keydown',e=>this.key(e));
    this.show(st.tab||'tarsim');

    // بعد از لود شدن فونت وزیرمتن، بوم‌ها را دوباره بکش تا برچسب‌ها با فونت جدید رندر شوند
    if(document.fonts&&document.fonts.ready){
      document.fonts.ready.then(()=>{ try{ this.redrawAll(); }catch(e){} });
    }
  },

  show(id){
    this.tab=id;
    $$('#tabs .tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===id));
    $$('.view').forEach(v=>v.classList.remove('active'));
    $('#view-'+id).classList.add('active');
    Store.set('settings',{theme:THEME, tab:id});
    this.refresh(id);
  },
  refresh(id){
    id=id||this.tab;
    try{
      if(id==='board'){ Board.resizeCanvas(); Board.render(); }
      else if(id==='tarsim'){ Tarsim.view.resize(); Tarsim.scene.render(); }
      else if(id==='thales'){ Thales.view.resize(); Thales.scene.render(); }
      else if(id==='tashaboh'){ Tash.view.resize(); Tash.scene.render(); }
      else if(id==='pdf'){ PdfV.resizeBlank(); PdfV.drawBlank(); if(PdfV.doc) PdfV.render(); }
    }catch(e){}
  },
  redrawAll(){ this.refresh(); },

  toggleFull(){
    try{
      if(document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }catch(e){}
  },
  toggleNight(){
    THEME = THEME==='light' ? 'night' : 'light';
    document.documentElement.classList.toggle('night', THEME==='night');
    $('#btnNight').classList.toggle('on', THEME==='night');
    Store.set('settings',{theme:THEME, tab:this.tab});
    this.redrawAll();
    toast(THEME==='night'?'حالت شب روشن شد':'حالت روز روشن شد');
  },
  toggleFx(mode){
    if(Fx.mode===mode){ Fx.stop(); return; }
    Fx.start(mode);
    $('#btnLaser').classList.toggle('on', mode==='laser');
    $('#btnSpot').classList.toggle('on', mode==='spot');
    toast(mode==='laser'?'لیزر فعال شد — Esc برای خروج':'اسپات‌لایت فعال شد — Esc برای خروج');
  },

  key(e){
    const tag=(e.target.tagName||'').toUpperCase();
    const typing= tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT';
    if(e.key==='Escape'){
      $$('.modal').forEach(m=>m.hidden=true);
      SymPad.close();
      Fx.stop();
      return;
    }
    if(typing) return;
    const k=e.key;
    if((e.ctrlKey||e.metaKey)&&(k==='z'||k==='Z')){ e.preventDefault(); if(this.tab==='board') Board.undo(); return; }
    if((e.ctrlKey||e.metaKey)&&(k==='y'||k==='Y')){ e.preventDefault(); if(this.tab==='board') Board.redoOp(); return; }
    if(k==='F'||k==='f'){ this.toggleFull(); return; }
    if(k==='N'||k==='n'){ this.toggleNight(); return; }
    if(k==='S'||k==='s'){ this.toggleFx('spot'); return; }
    if(k==='L'||k==='l'){ this.toggleFx('laser'); return; }
    if(k==='T'||k==='t'){ const m=$('#timerModal'); m.hidden=!m.hidden; return; }
    if(k==='?'){ $('#helpModal').hidden=false; return; }
    if(k==='M'||k==='m'){
      if(this.tab==='board') $('#boardMag').click();
      if(this.tab==='pdf') toast('ذره‌بین بعد از باز کردن PDF فعال می‌شود');
      return;
    }
    // کلیکر و کلیدهای جهت
    if(k==='PageDown'){ e.preventDefault(); this.pager(1); return; }
    if(k==='PageUp'){ e.preventDefault(); this.pager(-1); return; }
    if(k==='ArrowLeft'){ e.preventDefault(); this.pager(1); return; }
    if(k==='ArrowRight'){ e.preventDefault(); this.pager(-1); return; }
    if(k===' '&&this.tab==='tarsim'){ e.preventDefault(); Tarsim.go(1); return; }
  },
  pager(dir){
    if(this.tab==='tarsim') Tarsim.onPager(dir);
    else if(this.tab==='pdf') PdfV.onPager(dir);
    else{
      const tabs=$$('#tabs .tab').map(b=>b.dataset.tab);
      let i=tabs.indexOf(this.tab);
      i=clamp(i+dir,0,tabs.length-1);
      this.show(tabs[i]);
    }
  }
};

document.addEventListener('DOMContentLoaded',()=>{
  try{ App.init(); }
  catch(e){
    console.error(e);
    document.body.insertAdjacentHTML('beforeend',
      '<div style="position:fixed;inset:auto 20px 20px 20px;background:#d23f31;color:#fff;padding:14px;border-radius:10px;z-index:99">خطا در اجرای برنامه: '+e.message+'</div>');
  }
});
