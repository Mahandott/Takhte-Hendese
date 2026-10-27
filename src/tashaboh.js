'use strict';
/* ================= ماژول تشابه مثلث‌ها ================= */
function triAngles(A,B,C){
  // زاویه‌ها بر حسب درجه: a در رأس A و ...
  const a=dist(B,C), b=dist(C,A), c=dist(A,B);
  if(a<1e-6||b<1e-6||c<1e-6) return null;
  const A_=(b*b+c*c-a*a)/(2*b*c);
  const B_=(a*a+c*c-b*b)/(2*a*c);
  const CC=(a*a+b*b-c*c)/(2*a*b);
  if(A_>1||A_<-1||B_>1||B_<-1||CC>1||CC<-1) return null;
  return { A:Math.acos(A_)*180/Math.PI, B:Math.acos(B_)*180/Math.PI, C:Math.acos(CC)*180/Math.PI,
           a,b,c };
}

const Tash={
  view:null, scene:null,
  def:{ A:{x:330,y:250},B:{x:170,y:590},C:{x:540,y:590},
        A2:{x:821,y:159},B2:{x:686,y:597},C2:{x:1133,y:534} },

  init(){
    this.view=new View($('#tashCanvas'),1200,740);
    const saved=Store.get('tash',null);
    if(saved&&saved.def) this.def=saved.def;
    this.scene=new GeoScene(this.view,{ draw:(c,sc)=>this.draw(c,sc), onChange:()=>this.save() });
    this.build();
    $('#tashReset').addEventListener('click',()=>{
      this.def={ A:{x:330,y:250},B:{x:170,y:590},C:{x:540,y:590},
                 A2:{x:821,y:159},B2:{x:686,y:597},C2:{x:1133,y:534} };
      this.build(); this.save();
      toast('شکل به حالت اولیه برگشت');
    });
    $('#tashWhy').addEventListener('click',()=>Cards.show('tashaboh'));
    addEventListener('resize',()=>{this.view.resize();this.scene.render();});
  },
  build(){
    const sc=this.scene;
    sc.points=[];
    [['A','A'],['B','B'],['C','C'],['A2','A′'],['B2','B′'],['C2','C′']].forEach(([id,lab],i)=>{
      const p=this.def[id];
      sc.addPoint(id,p.x,p.y,{label:lab, color:i<3?pickCol(null,'t1'):pickCol(null,'t2')});
    });
    sc.render();
  },
  save(){
    const g=id=>this.scene.pos(id);
    ['A','B','C','A2','B2','C2'].forEach(id=>{ this.def[id]=g(id); });
    Store.set('tash',{def:this.def});
  },

  draw(c,sc){
    const g=id=>sc.pos(id);
    const A=g('A'),B=g('B'),C=g('C'), A2=g('A2'),B2=g('B2'),C2=g('C2');
    const t1=triAngles(A,B,C), t2=triAngles(A2,B2,C2);
    // مثلث‌ها
    const fill=(pts,color)=>{
      c.save(); c.globalAlpha=THEME==='night'?0.16:0.09; c.fillStyle=color;
      c.beginPath(); c.moveTo(pts[0].x,pts[0].y);
      pts.slice(1).forEach(p=>c.lineTo(p.x,p.y));
      c.closePath(); c.fill(); c.restore();
    };
    fill([A,B,C],pickCol(null,'t1')); fill([A2,B2,C2],pickCol(null,'t2'));
    drawSeg(c,A,B,{w:3,color:pickCol(null,'t1')});
    drawSeg(c,B,C,{w:3,color:pickCol(null,'t1')});
    drawSeg(c,C,A,{w:3,color:pickCol(null,'t1')});
    drawSeg(c,A2,B2,{w:3,color:pickCol(null,'t2')});
    drawSeg(c,B2,C2,{w:3,color:pickCol(null,'t2')});
    drawSeg(c,C2,A2,{w:3,color:pickCol(null,'t2')});

    if(!t1||!t2){
      $('#tashCard').innerHTML='<div class="dim">رأس‌های هر دو مثلث را باز کنید تا مثلث درست ساخته شود.</div>';
      return;
    }
    // زاویه‌ها روی شکل
    const arc=(V,P1,P2,color,eq)=>{
      const u1=unit(P1.x-V.x,P1.y-V.y), u2=unit(P2.x-V.x,P2.y-V.y);
      angMark(c,V,u1,u2,1,eq?T('ok'):color);
    };
    arc(A,B,C,pickCol(null,'t1'),Math.abs(t1.A-t2.A)<2.5);
    arc(B,C,A,pickCol(null,'t1'),Math.abs(t1.B-t2.B)<2.5);
    arc(C,A,B,pickCol(null,'t1'),Math.abs(t1.C-t2.C)<2.5);
    arc(A2,B2,C2,pickCol(null,'t2'),Math.abs(t1.A-t2.A)<2.5);
    arc(B2,C2,A2,pickCol(null,'t2'),Math.abs(t1.B-t2.B)<2.5);
    arc(C2,A2,B2,pickCol(null,'t2'),Math.abs(t1.C-t2.C)<2.5);

    // نسبت ضلع‌ها
    const rAB=t1.c/t2.c, rBC=t1.a/t2.a, rCA=t1.b/t2.b;
    const eps=0.035;
    const eqA=Math.abs(t1.A-t2.A)<2.5, eqB=Math.abs(t1.B-t2.B)<2.5, eqC=Math.abs(t1.C-t2.C)<2.5;
    const eqAB=Math.abs(rAB-rCA)<eps&&Math.abs(rAB-rBC)<eps; // هر سه برابر
    const eqABr=Math.abs(rAB-rBC)<eps, eqACr=Math.abs(rAB-rCA)<eps, eqBCr=Math.abs(rBC-rCA)<eps;
    // حالت‌ها
    const cases=[];
    const nEq=(eqA?1:0)+(eqB?1:0)+(eqC?1:0);
    if(nEq>=2) cases.push('ز‌ز');
    // ض‌ز‌ض: دو ضلع متناسب + زاویه بین آن‌ها
    const sas=[[eqA,eqABr,rAB],[eqB,eqACr,rCA],[eqC,eqBCr,rBC]];
    if(sas.some(s=>s[0]&&s[1])) cases.push('ض‌ز‌ض');
    if(eqAB) cases.push('ض‌ض‌ض');
    const cong=eqAB&&Math.abs(rAB-1)<0.03;
    const k=(rAB+rBC+rCA)/3;
    const row=(l1,v1,l2,v2,eq)=>'<span class="'+(eq?'':'ne')+'">'+l1+' = '+faNum(v1,0)+'° / '+l2+' = '+faNum(v2,0)+'°</span>';
    $('#tashCard').innerHTML=
      '<div class="angle-row">'+
        row('∠A',t1.A,'∠A′',t2.A,eqA)+
        row('∠B',t1.B,'∠B′',t2.B,eqB)+
        row('∠C',t1.C,'∠C′',t2.C,eqC)+
      '</div>'+
      '<div class="angle-row">'+
        '<span>AB/A′B′ = '+faNum(rAB)+'</span>'+
        '<span>BC/B′C′ = '+faNum(rBC)+'</span>'+
        '<span>AC/A′C′ = '+faNum(rCA)+'</span>'+
      '</div>'+
      '<div class="dim">نسبت تشابه ≈ '+faNum(k)+' &nbsp;•&nbsp; رأس‌ها را بکشید و حالت تشابه را ببینید</div>'+
      (cases.length?
        '<div class="badge">تشابه به حالت '+faDigits(cases.join(' و '))+(cong?' — و برابر (≅) هم هستند':'')+'</div>':
        '<div class="badge off">هنوز مشابه نیستند — رأس‌ها را جابه‌جا کنید</div>');
  }
};
