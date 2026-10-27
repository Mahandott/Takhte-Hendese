'use strict';
/* ================= ماژول تالس و عکس تالس ================= */
function fracApprox(v){
  // ساده‌سازی نسبت به کسر با مخرج کوچک
  let best=null, bd=1e9;
  for(let q=1;q<=24;q++){
    const p=v*q;
    const pr=Math.round(p);
    const d=Math.abs(p-pr);
    if(d<bd){bd=d;best=[pr,q];}
  }
  if(best && bd<0.02){ if(best[1]===1) return null; return best[0]+'/'+best[1]; }
  return null;
}

const Thales={
  view:null, scene:null, mode:'thales',
  L1:235, L2:385, L3:535,
  defT1:{ax:250,ay:105,bx:560,by:665},
  defT2:{ax:720,ay:105,bx:1030,by:665},
  defTri:{A:{x:600,y:165},B:{x:330,y:625},C:{x:900,y:600}},

  init(){
    this.view=new View($('#thalesCanvas'),1200,740);
    const saved=Store.get('thales',{});
    if(saved.mode) this.mode=saved.mode;
    this.loadPos(saved);

    $('#thMode').addEventListener('click',()=>{
      this.mode=this.mode==='thales'?'aks':'thales';
      this.updateModeBtn(); this.build(); this.save();
    });
    $('#thWhy').addEventListener('click',()=>Cards.show(this.mode==='thales'?'thales':'aks'));
    $('#thReset').addEventListener('click',()=>{
      this.L1=235; this.L2=385; this.L3=535;
      this.defT1={ax:250,ay:105,bx:560,by:665};
      this.defT2={ax:720,ay:105,bx:1030,by:665};
      this.defTri={A:{x:600,y:165},B:{x:330,y:625},C:{x:900,y:600}};
      this.build(); this.save();
      toast('شکل به حالت اولیه برگشت');
    });
    this.snapBtn=document.createElement('button');
    this.snapBtn.className='tbtn'; this.snapBtn.id='thSnap';
    this.snapBtn.textContent='برابرسازی نسبت‌ها';
    this.snapBtn.addEventListener('click',()=>this.snapEqual());
    document.querySelector('#view-thales .toolbar .tgroup').appendChild(this.snapBtn);

    this.updateModeBtn();
    this.build();
    addEventListener('resize',()=>{this.view.resize();this.scene.render();});
  },

  loadPos(saved){
    if(saved.L){ this.L1=saved.L[0]; this.L2=saved.L[1]; this.L3=saved.L[2]; }
    if(saved.t1) this.defT1=saved.t1;
    if(saved.t2) this.defT2=saved.t2;
    if(saved.tri) this.defTri=saved.tri;
  },
  save(){
    Store.set('thales',{
      mode:this.mode, L:[this.L1,this.L2,this.L3],
      t1:this.defT1, t2:this.defT2, tri:this.defTri
    });
  },
  updateModeBtn(){
    $('#thMode').textContent=this.mode==='thales'?'حالت: قضیه تالس':'حالت: عکس قضیه تالس';
    this.snapBtn.hidden=this.mode!=='aks';
  },

  build(){
    if(!this.scene){
      this.scene=new GeoScene(this.view,{ draw:(c,sc)=>this.draw(c,sc), onChange:()=>this.save() });
    }else{ this.scene.points=[]; }
    const sc=this.scene;
    if(this.mode==='thales'){
      sc.opts.dragHook=(p)=>{
        const ys=[this.L1,this.L2,this.L3];
        for(let i=0;i<3;i++){
          if(Math.abs(p.y-ys[i])<16){
            return { move:(q)=>{
              let y=clamp(q.y,100,680);
              if(i===0) y=clamp(y,100,this.L2-36);
              if(i===1) y=clamp(y,this.L1+36,this.L3-36);
              if(i===2) y=clamp(y,this.L2+36,680);
              this['L'+(i+1)]=y;
            }};
          }
        }
        return null;
      };
      sc.addPoint('T1a',this.defT1.ax,this.defT1.ay,{label:''});
      sc.addPoint('T1b',this.defT1.bx,this.defT1.by,{label:''});
      sc.addPoint('T2a',this.defT2.ax,this.defT2.ay,{label:''});
      sc.addPoint('T2b',this.defT2.bx,this.defT2.by,{label:''});
    }else{
      sc.addPoint('A',this.defTri.A.x,this.defTri.A.y,{label:'A'});
      sc.addPoint('B',this.defTri.B.x,this.defTri.B.y,{label:'B'});
      sc.addPoint('C',this.defTri.C.x,this.defTri.C.y,{label:'C'});
      sc.addPoint('M',(this.defTri.A.x+this.defTri.B.x)/2,(this.defTri.A.y+this.defTri.B.y)/2,{label:'M',color:pickCol(null,'t2')});
      sc.addPoint('D',(this.defTri.A.x+this.defTri.C.x)/2,(this.defTri.A.y+this.defTri.C.y)/2,{label:'D',color:pickCol(null,'t2')});
      const M=sc.get('M'), D=sc.get('D'), A=sc.get('A'), B=sc.get('B'), C=sc.get('C');
      M.constrain=q=>{ const t=clampSegT(q,A,B); return {x:A.x+(B.x-A.x)*t, y:A.y+(B.y-A.y)*t}; };
      D.constrain=q=>{ const t=clampSegT(q,A,C); return {x:A.x+(C.x-A.x)*t, y:A.y+(C.y-A.y)*t}; };
    }
    sc.onChange=()=>{ this.capturePos(); this.save(); };
    sc.render();
  },
  capturePos(){
    if(this.mode==='thales'){
      const g=id=>this.scene.pos(id);
      this.defT1={ax:g('T1a').x,ay:g('T1a').y,bx:g('T1b').x,by:g('T1b').y};
      this.defT2={ax:g('T2a').x,ay:g('T2a').y,bx:g('T2b').x,by:g('T2b').y};
    }else{
      const g=id=>this.scene.pos(id);
      this.defTri={A:g('A'),B:g('B'),C:g('C')};
    }
  },
  snapEqual(){
    if(this.mode!=='aks') return;
    const A=this.scene.pos('A'), B=this.scene.pos('B'), C=this.scene.pos('C'), M=this.scene.pos('M');
    const t=clampSegT(M,A,B);
    const D=this.scene.get('D');
    D.x=A.x+(C.x-A.x)*t; D.y=A.y+(C.y-A.y)*t;
    this.capturePos(); this.save(); this.scene.render();
  },

  draw(c,sc){
    if(this.mode==='thales') this.drawThales(c,sc);
    else this.drawAks(c,sc);
  },

  drawThales(c,sc){
    const g=id=>sc.pos(id);
    const t1a=g('T1a'), t1b=g('T1b'), t2a=g('T2a'), t2b=g('T2b');
    const Ls=[this.L1,this.L2,this.L3];
    // خطوط موازی
    Ls.forEach((y,i)=>{
      drawSeg(c,{x:40,y},{x:1160,y},{w:3,color:T('const')});
      drawLabel(c,'ℓ'+faDigits(i+1),{x:66,y:y-14},{color:T('dim'),size:14,bold:false});
    });
    // قطع‌کننده‌ها
    drawSeg(c,t1a,t1b,{w:2.2,color:T('ink')});
    drawSeg(c,t2a,t2b,{w:2.2,color:T('ink')});
    // نقاط برخورد
    const xs1=Ls.map(y=>t1a.x+(t1b.x-t1a.x)*(y-t1a.y)/((t1b.y-t1a.y)||1e-9));
    const xs2=Ls.map(y=>t2a.x+(t2b.x-t2a.x)*(y-t2a.y)/((t2b.y-t2a.y)||1e-9));
    const P1=xs1.map((x,i)=>({x,y:Ls[i]}));
    const P2=xs2.map((x,i)=>({x,y:Ls[i]}));
    const names1=['A','B','C'], names2=['D','E','F'];
    P1.forEach((p,i)=>{ drawDot(c,p,5,T('ink'));
      drawLabel(c,names1[i],{x:p.x-20,y:p.y-14},{size:19}); });
    P2.forEach((p,i)=>{ drawDot(c,p,5,T('ink'));
      drawLabel(c,names2[i],{x:p.x+20,y:p.y-14},{size:19}); });
    // پاره‌خط‌های رنگی
    drawSeg(c,P1[0],P1[1],{w:5,color:pickCol(null,'a'),alpha:.85});
    drawSeg(c,P1[1],P1[2],{w:5,color:pickCol(null,'b'),alpha:.85});
    drawSeg(c,P2[0],P2[1],{w:5,color:pickCol(null,'a'),alpha:.85});
    drawSeg(c,P2[1],P2[2],{w:5,color:pickCol(null,'b'),alpha:.85});
    // محاسبه نسبت‌ها
    const AB=dist(P1[0],P1[1]), BC=dist(P1[1],P1[2]);
    const DE=dist(P2[0],P2[1]), EF=dist(P2[1],P2[2]);
    const r1=AB/(BC||1e-9), r2=DE/(EF||1e-9);
    const eq=Math.abs(r1-r2)<0.01;
    const f1=fracApprox(r1), f2=fracApprox(r2);
    $('#thalesCard').innerHTML=
      '<div class="num">AB / BC = '+faNum(r1)+(f1?' ≈ '+faDigits(f1):'')+'</div>'+
      '<div class="num">DE / EF = '+faNum(r2)+(f2?' ≈ '+faDigits(f2):'')+'</div>'+
      '<div class="dim">AB = '+faNum(AB/50,1)+' و BC = '+faNum(BC/50,1)+' و DE = '+faNum(DE/50,1)+' و EF = '+faNum(EF/50,1)+' سانتی‌متر</div>'+
      '<div class="badge'+(eq?'':' off')+'">'+(eq?'برابرند ✓ قضیه تالس':'برابر نیستند!')+'</div>';
  },

  drawAks(c,sc){
    const g=id=>sc.pos(id);
    const A=g('A'), B=g('B'), C=g('C'), M=g('M'), D=g('D');
    // مثلث
    drawSeg(c,A,B,{w:3,color:T('ink')});
    drawSeg(c,B,C,{w:3,color:T('ink')});
    drawSeg(c,C,A,{w:3,color:T('ink')});
    // پاره‌خط MD
    const AM=dist(A,M), MB=dist(M,B), AD=dist(A,D), DC=dist(D,C);
    const r1=AM/(MB||1e-9), r2=AD/(DC||1e-9);
    const eq=Math.abs(r1-r2)<0.012;
    drawSeg(c,M,D,{w:eq?5:3.4,color:eq?T('ok'):T('dim')});
    if(eq) parallelArrow(c,M,D,T('ok'));
    drawSeg(c,B,C,{w:3,color:T('ink')});
    // نسبت‌ها روی شکل
    drawLabel(c,'AM/MB = '+faNum(r1),{x:(A.x+M.x)/2-70,y:(A.y+M.y)/2+30},{color:pickCol(null,'t2'),size:15});
    drawLabel(c,'AD/DC = '+faNum(r2),{x:(A.x+D.x)/2+80,y:(A.y+D.y)/2+10},{color:pickCol(null,'t2'),size:15});
    $('#thalesCard').innerHTML=
      '<div class="num">AM / MB = '+faNum(r1)+' &nbsp;|&nbsp; AD / DC = '+faNum(r2)+'</div>'+
      '<div class="dim">نقطه‌های M و D را روی اضلاع جابه‌جا کنید تا نسبت‌ها برابر شوند؛ یا از دکمه‌ی «برابرسازی نسبت‌ها» استفاده کنید.</div>'+
      '<div class="badge'+(eq?'':' off')+'">'+(eq?'MD ∥ CB ✓ عکس قضیه تالس':'MD موازی CB نیست — نسبت‌ها را برابر کنید')+'</div>';
  }
};
