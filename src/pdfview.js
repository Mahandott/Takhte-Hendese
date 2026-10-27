'use strict';
/* ================= ماژول PDF ================= */
const PDF_COLORS=['#d23f31','#1565c0','#1e8e3e','#1c2733','#e8710a','#8e44ad'];

const PdfV={
  doc:null, page:1, pages:0, zoom:1, baseScale:1, s:1,
  tool:'pen', color:'#d23f31', width:3.5,
  annos:{},            // شماره صفحه → آرایه ضربه‌ها (در واحد صفحه)
  cur:null, surface:'pdf',
  blankStrokes:[], blankCur:null, blankUndo:[],
  lens:null, renderTask:null, pending:null,

  init(){
    try{ if(window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc='pdfjs/pdf.worker.min.js'; }catch(e){}
    this.buildColors();
    this.pdfCv=$('#pdfCanvas'); this.annoCv=$('#pdfAnno'); this.blankCv=$('#blankCanvas');
    $$('#view-pdf .tool').forEach(b=>b.addEventListener('click',()=>{
      this.tool=b.dataset.ptool;
      $$('#view-pdf .tool').forEach(x=>x.classList.toggle('active',x.dataset.ptool===this.tool));
      const er=this.tool==='eraser';
      if(this.annoCv) this.annoCv.classList.toggle('cur-eraser',er);
      if(this.blankCv) this.blankCv.classList.toggle('cur-eraser',er);
    }));
    $('#pdfFile').addEventListener('change',e=>{
      if(e.target.files[0]) this.openFile(e.target.files[0]);
    });
    const stage=$('#pdfStage');
    stage.addEventListener('dragover',e=>{e.preventDefault(); $('#pdfEmpty').classList.add('drag');});
    stage.addEventListener('dragleave',()=>$('#pdfEmpty').classList.remove('drag'));
    stage.addEventListener('drop',e=>{
      e.preventDefault(); $('#pdfEmpty').classList.remove('drag');
      const f=e.dataTransfer.files[0];
      if(f&&/pdf$/i.test(f.name)) this.openFile(f);
    });
    $('#pdfBook').addEventListener('click',()=>this.openBookData());
    if(window.BOOK_DATA && BOOK_DATA && BOOK_DATA.data) $('#pdfBook').hidden=false;

    $('#pdfPrev').addEventListener('click',()=>this.goPage(this.page-1));
    $('#pdfNext').addEventListener('click',()=>this.goPage(this.page+1));
    $('#pdfPage').addEventListener('change',e=>{
      const v=parseInt(faDigits(e.target.value).replace(/[۰-۹]/g,d=>FA.indexOf(d)),10);
      if(v) this.goPage(v);
    });
    $('#pdfZoomIn').addEventListener('click',()=>this.setZoom(this.zoom*1.2));
    $('#pdfZoomOut').addEventListener('click',()=>this.setZoom(this.zoom/1.2));
    $('#pdfUndo').addEventListener('click',()=>this.undo());
    $('#pdfClearAnno').addEventListener('click',()=>this.clearAnnos());
    $('#pdfPng').addEventListener('click',()=>this.exportPng());
    $('#pdfNight').addEventListener('click',e=>{
      $('#pdfWrap').classList.toggle('nightinv');
      e.currentTarget.classList.toggle('on');
    });
    $('#pdfBlank').addEventListener('click',()=>this.toggleBlank());

    // رویدادهای رسم
    const bind=(cv, getMode)=>{
      cv.addEventListener('pointerdown',e=>this.down(e,getMode()));
      cv.addEventListener('pointermove',e=>this.move(e,getMode()));
      cv.addEventListener('pointerup',e=>this.up(e,getMode()));
      cv.addEventListener('pointercancel',e=>this.up(e,getMode()));
    };
    bind(this.annoCv, ()=>'pdf');
    bind(this.blankCv, ()=>'blank');
    this.lens=new Lens($('#pdfLens'), this.pdfCv, this.annoCv);
    addEventListener('resize',()=>{ this.resizeBlank(); if(this.doc) this.render(); this.drawBlank(); });
  },

  buildColors(){
    const wrap=$('#pdfColors');
    PDF_COLORS.forEach((cl,i)=>{
      const b=document.createElement('button');
      b.className='chip'+(i===0?' sel':''); b.style.background=cl;
      b.addEventListener('click',()=>{
        this.color=cl;
        $$('#pdfColors .chip').forEach(x=>x.classList.remove('sel'));
        b.classList.add('sel');
      });
      wrap.appendChild(b);
    });
  },

  /* ---------- باز کردن ---------- */
  openFile(file){
    if(!(window.pdfjsLib)){ this.fallbackEmbed(file); return; }
    const rd=new FileReader();
    rd.onload=()=>{
      this.load(new Uint8Array(rd.result), file.name.replace(/\.pdf$/i,''));
    };
    rd.readAsArrayBuffer(file);
  },
  openBookData(){
    try{
      const bin=atob(BOOK_DATA.data);
      const arr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
      this.load(arr, BOOK_DATA.name||'فصل کتاب');
    }catch(e){ toast('خواندن کتاب جاسازی‌شده ممکن نشد'); }
  },
  fallbackEmbed(file){
    $('#pdfEmpty').hidden=true;
    const url=URL.createObjectURL(file);
    $('#pdfWrap').hidden=false;
    $('#pdfPageBox').style.display='none';
    const emb=document.createElement('embed');
    emb.src=url; emb.type='application/pdf';
    emb.style.cssText='position:relative;width:96%;height:96%;flex:1';
    $('#pdfWrap').appendChild(emb);
    toast('موتور PDF در دسترس نیست؛ نمایش ساده فعال شد (پوشه را کامل کپی کنید)');
  },
  load(data,name){
    if(!window.pdfjsLib){ toast('موتور PDF یافت نشد؛ پوشه برنامه را کامل کپی کنید'); return; }
    toast('در حال باز کردن PDF…');
    pdfjsLib.getDocument({data}).promise.then(doc=>{
      this.doc=doc; this.pages=doc.numPages; this.page=1; this.zoom=1;
      this.surface='pdf';
      $('#pdfEmpty').hidden=true; $('#blankWrap').hidden=true; $('#pdfWrap').hidden=false;
      $('#pdfBlank').classList.remove('on');
      this.docName=name;
      const st=Store.get('pdfui',{});
      if(st.zoom) this.zoom=st.zoom;
      this.render();
      toast('PDF باز شد: '+faDigits(this.pages)+' صفحه');
    }).catch(err=>{
      toast('باز کردن PDF ممکن نشد: '+err.message);
    });
  },

  /* ---------- نمایش صفحه ---------- */
  computeScale(v1){
    const stage=$('#pdfStage');
    const W=stage.clientWidth-60, H=stage.clientHeight-60;
    const s0=Math.min(W/v1.width, H/v1.height);
    return { fit:s0, s:s0*this.zoom };
  },
  render(){
    if(!this.doc) return;
    if(this.renderTask){ this.pending={p:this.page}; return; }
    $('#pdfInfo').textContent='صفحه '+faDigits(this.page)+' از '+faDigits(this.pages);
    $('#pdfPage').value=faDigits(this.page);
    $('#pdfZoomLbl').textContent=faDigits(Math.round(this.zoom*100))+'٪';
    this.doc.getPage(this.page).then(pg=>{
      const v1=pg.getViewport({scale:1});
      const sc=this.computeScale(v1);
      this.baseScale=sc.fit; this.s=sc.s;
      const vp=pg.getViewport({scale:this.s});
      const dpr=window.devicePixelRatio||1;
      const box=$('#pdfPageBox');
      const dprW=Math.round(vp.width*dpr), dprH=Math.round(vp.height*dpr);
      this.pdfCv.width=dprW; this.pdfCv.height=dprH;
      this.pdfCv.style.width=vp.width+'px'; this.pdfCv.style.height=vp.height+'px';
      this.annoCv.width=dprW; this.annoCv.height=dprH;
      this.annoCv.style.width=vp.width+'px'; this.annoCv.style.height=vp.height+'px';
      box.style.width=vp.width+'px'; box.style.height=vp.height+'px';
      const ctx=this.pdfCv.getContext('2d');
      ctx.setTransform(1,0,0,1,0,0);
      this.renderTask=pg.render({canvasContext:ctx, viewport:vp, transform:[dpr,0,0,dpr,0,0]});
      this.renderTask.promise.then(()=>{
        this.renderTask=null;
        if(this.pending){ const p=this.pending; this.pending=null; this.page=p.p; this.render(); }
        else this.drawAnnos();
      }).catch(()=>{ this.renderTask=null; });
    });
  },
  goPage(p){
    if(!this.doc) return;
    p=clamp(p,1,this.pages);
    if(p===this.page) return;
    this.page=p; Store.set('pdfui',{page:p, zoom:this.zoom});
    this.render();
  },
  setZoom(z){
    this.zoom=clamp(z,0.5,3);
    Store.set('pdfui',{page:this.page, zoom:this.zoom});
    this.render();
  },

  /* ---------- ضربه‌ها (نوشتن روی PDF) ---------- */
  evPage(e,cv){ // مختصات در واحد صفحه
    const r=cv.getBoundingClientRect();
    return { x:(e.clientX-r.left)/this.s, y:(e.clientY-r.top)/this.s };
  },
  down(e,surf){
    if(e.button!==0) return;
    e.preventDefault();
    try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){ }
    if(surf==='blank'){
      const p=this.blankNorm(e);
      if(this.tool==='eraser'){ this.erasing=true; this.blankErase(p); return; }
      this.blankCur={type:this.tool, pts:[p], color:this.color, w:this.width};
      this.drawBlank(); return;
    }
    if(!this.doc) return;
    const p=this.evPage(e,this.annoCv);
    if(this.tool==='eraser'){ this.erasing=true; this.eraseAt(p); return; }
    this.cur={type:this.tool==='hl'?'hl':'pen', pts:[p], color:this.color};
    this.surface='pdf';
  },
  move(e,surf){
    if(this.erasing){
      if(surf==='blank') this.blankErase(this.blankNorm(e));
      else if(this.doc) this.eraseAt(this.evPage(e,this.annoCv));
      return;
    }
    if(surf==='blank'){
      if(!this.blankCur) return;
      const p=this.blankNorm(e);
      this.blankCur.pts.push(p); this.drawBlank(); return;
    }
    if(!this.cur) return;
    const p=this.evPage(e,this.annoCv);
    this.cur.pts.push(p);
    this.drawAnnos(this.cur);
  },
  up(e,surf){
    this.erasing=false;
    if(surf==='blank'){
      if(this.blankCur){
        if(this.blankCur.pts.length>1) this.blankStrokes.push(this.blankCur);
        this.blankCur=null; this.drawBlank();
      }
      return;
    }
    if(!this.cur) return;
    if(this.cur.pts.length>1){
      if(!this.annos[this.page]) this.annos[this.page]=[];
      this.annos[this.page].push(this.cur);
    }
    this.cur=null;
    this.drawAnnos();
  },
  eraseAt(p){
    const arr=this.annos[this.page]; if(!arr) return;
    const tol=14/this.s;
    for(let i=arr.length-1;i>=0;i--){
      if(this.hitPts(arr[i].pts,p,tol)){ arr.splice(i,1); this.drawAnnos(); return; }
    }
  },
  hitPts(pts,p,tol){ // فاصله تا نقاط و پاره‌خط‌های میانی
    if(!pts||!pts.length) return false;
    if(pts.length===1) return Math.hypot(pts[0].x-p.x,pts[0].y-p.y)<tol;
    for(let i=0;i<pts.length-1;i++){
      if(distSeg(p,pts[i],pts[i+1])<tol) return true;
    }
    return false;
  },
  undo(){
    if(this.surface==='blank'||$('#blankWrap').hidden===false){
      if(this.blankStrokes.length){ this.blankUndo.push(this.blankStrokes.pop()); this.drawBlank(); }
      return;
    }
    const arr=this.annos[this.page];
    if(arr&&arr.length){ arr.pop(); this.drawAnnos(); }
  },
  clearAnnos(){
    if($('#blankWrap').hidden===false){
      if(this.blankStrokes.length){ this.blankUndo=this.blankStrokes.slice(); this.blankStrokes=[]; this.drawBlank(); }
      return;
    }
    const arr=this.annos[this.page];
    if(arr&&arr.length){ arr.length=0; this.drawAnnos(); toast('نوشته‌های این صفحه پاک شد'); }
  },
  drawAnnos(live){
    if(!this.doc) return;
    const c=this.annoCv.getContext('2d');
    const dpr=window.devicePixelRatio||1;
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,this.annoCv.width,this.annoCv.height);
    c.setTransform(dpr*this.s,0,0,dpr*this.s,0,0);
    const arr=this.annos[this.page]||[];
    const drawStroke=(st)=>{
      c.save();
      c.globalAlpha=st.type==='hl'?0.30:0.9;
      c.strokeStyle=st.color;
      c.lineWidth=(st.type==='hl'? this.width*7 : st.type==='pen'? this.width*1.6 : 5)/1;
      c.lineCap='round'; c.lineJoin='round';
      c.beginPath();
      st.pts.forEach((p,i)=>{ i? c.lineTo(p.x,p.y):c.moveTo(p.x,p.y); });
      c.stroke(); c.restore();
    };
    arr.forEach(drawStroke);
    if(live) drawStroke(live);
  },

  /* ---------- صفحه سفید ---------- */
  toggleBlank(){
    const on=$('#blankWrap').hidden;
    $('#blankWrap').hidden=!on;
    $('#pdfWrap').hidden=on;
    $('#pdfBlank').classList.toggle('on',on);
    $('#pdfBlank').textContent=on?'بازگشت به PDF':'صفحه سفید حل تمرین';
    if(on){ this.resizeBlank(); this.drawBlank(); }
    else this.render();
  },
  resizeBlank(){
    const stage=$('#pdfStage');
    const dpr=window.devicePixelRatio||1;
    this.blankCv.width=Math.round(stage.clientWidth*dpr);
    this.blankCv.height=Math.round(stage.clientHeight*dpr);
    this.blankW=stage.clientWidth; this.blankH=stage.clientHeight;
  },
  blankNorm(e){
    const r=this.blankCv.getBoundingClientRect();
    return {x:(e.clientX-r.left)/this.blankW, y:(e.clientY-r.top)/this.blankH};
  },
  blankErase(p){
    const tol=16/Math.max(this.blankW,this.blankH);
    for(let i=this.blankStrokes.length-1;i>=0;i--){
      if(this.hitPts(this.blankStrokes[i].pts,p,tol)){ this.blankStrokes.splice(i,1); this.drawBlank(); return; }
    }
  },
  drawBlank(){
    const c=this.blankCv.getContext('2d');
    const dpr=window.devicePixelRatio||1;
    c.setTransform(dpr,0,0,dpr,0,0);
    c.clearRect(0,0,this.blankW,this.blankH);
    const all=this.blankStrokes.concat(this.blankCur?[this.blankCur]:[]);
    all.forEach(st=>{
      c.save();
      c.globalAlpha=st.type==='hl'?0.30:0.95;
      c.strokeStyle=st.color;
      c.lineWidth=st.type==='hl'? this.width*6 : this.width*1.7;
      c.lineCap='round'; c.lineJoin='round';
      c.beginPath();
      st.pts.forEach((p,i)=>{ i? c.lineTo(p.x*this.blankW,p.y*this.blankH) : c.moveTo(p.x*this.blankW,p.y*this.blankH); });
      c.stroke(); c.restore();
    });
  },

  /* ---------- خروجی ---------- */
  exportPng(){
    if($('#blankWrap').hidden===false){
      const a=document.createElement('a');
      a.download='safhe-sefid.png';
      a.href=this.blankCv.toDataURL('image/png');
      a.click(); toast('تصویر صفحه سفید ذخیره شد'); return;
    }
    if(!this.doc) return;
    const m=document.createElement('canvas');
    m.width=this.pdfCv.width; m.height=this.pdfCv.height;
    const c=m.getContext('2d');
    c.drawImage(this.pdfCv,0,0);
    c.drawImage(this.annoCv,0,0);
    const a=document.createElement('a');
    a.download='pdf-page-'+this.page+'.png';
    a.href=m.toDataURL('image/png');
    a.click();
    toast('تصویر صفحه '+faDigits(this.page)+' ذخیره شد');
  },
  onPager(dir){ this.goPage(this.page+dir); }
};
