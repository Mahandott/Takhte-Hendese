'use strict';
/* ================= ماژول ترسیم‌های هندسی ================= */
function arcFace(c, ctr, toward, r, span, st){
  const a = angOf({x:toward.x-ctr.x, y:toward.y-ctr.y});
  drawArc(c, ctr, r, a-span/2, a+span/2, st||{});
}
function cmpPoint(u, v){ return u.y - v.y; } // نقطه بالاتر (y کوچک‌تر)

const Tarsim={
  view:null, scene:null, cur:'bisector', step:0, n:4, triA:6, triB:5,
  playing:false, playTimer:null, defs:{},

  init(){
    this.view=new View($('#tarsimCanvas'),1200,740);
    this.buildDefs();
    const saved=Store.get('tarsim',{});
    if(saved.cur&&this.defs[saved.cur]) this.cur=saved.cur;
    this.n=saved.n||4; this.triA=saved.triA||6; this.triB=saved.triB||5;
    $('#triA').value=this.triA; $('#triB').value=this.triB;
    $('#triAVal').textContent=faNum(this.triA,1); $('#triBVal').textContent=faNum(this.triB,1);
    $('#tarsimNVal').textContent=faDigits(this.n);

    $('#tarsimSel').addEventListener('change',e=>this.select(e.target.value));
    $('#tarsimNext').addEventListener('click',()=>this.go(1));
    $('#tarsimPrev').addEventListener('click',()=>this.go(-1));
    $('#tarsimFirst').addEventListener('click',()=>{this.step=0;this.stopPlay();this.update();});
    $('#tarsimLast').addEventListener('click',()=>{this.step=this.stepsLen()-1;this.stopPlay();this.update();});
    $('#tarsimReset').addEventListener('click',()=>this.build(true));
    $('#tarsimPlay').addEventListener('click',()=>this.togglePlay());
    $('#tarsimNMinus').addEventListener('click',()=>{this.n=clamp(this.n-1,2,6);$('#tarsimNVal').textContent=faDigits(this.n);this.build();});
    $('#tarsimNPlus').addEventListener('click',()=>{this.n=clamp(this.n+1,2,6);$('#tarsimNVal').textContent=faDigits(this.n);this.build();});
    $('#triA').addEventListener('input',e=>{this.triA=+e.target.value;$('#triAVal').textContent=faNum(this.triA,1);this.update();this.save();});
    $('#triB').addEventListener('input',e=>{this.triB=+e.target.value;$('#triBVal').textContent=faNum(this.triB,1);this.update();this.save();});

    this.select(this.cur,true);
    addEventListener('resize',()=>{this.view.resize();this.scene.render();});
  },

  buildDefs(){
    const D=this.defs;

    /* ---------- ۱) عمودمنصف پاره‌خط ---------- */
    D.bisector={
      name:'عمودمنصف پاره‌خط',
      why:'پایه‌ی استدلال: AP = BP و AP′ = BP′ (شعاع‌های برابر) و ضلع مشترک؛ پس دو مثلث با ض‌ض‌ض برابرند و خط واصل، هم عمود است هم از وسط پاره‌خط می‌گذرد.',
      pts:[{id:'A',x:330,y:420,label:'A'},{id:'B',x:800,y:420,label:'B'}],
      steps(sc){
        const A=sc.pos('A'), B=sc.pos('B'), r=dist(A,B)*0.62+26;
        return [
          {t:'پاره‌خط AB را با خط‌کش رسم کنید. (نقاط A و B را می‌توانید با ماوس جابه‌جا کنید)',
           d(c){ drawSeg(c,A,B,{w:3,color:T('ink')}); }},
          {t:'پرگار را کمی بیشتر از نصف AB باز کنید؛ مرکز آن را روی A بگذارید و کمانی بزنید.',
           d(c){ arcFace(c,A,B,r,2.1,{dash:[7,6]}); }},
          {t:'با همان شعاع، مرکز پرگار را روی B بگذارید و کمانی بزنید تا کمان اول را قطع کند.',
           d(c){ arcFace(c,A,B,r,2.1,{dash:[7,6]}); arcFace(c,B,A,r,2.1,{dash:[7,6]}); }},
          {t:'دو محل برخورد کمان‌ها (P و P′) را پیدا کنید و با خط‌کش به هم وصل کنید.',
           d(c){ const ps=circleXcircle(A,r,B,r);
                  if(ps.length){ ps.sort(cmpPoint);
                    drawDot(c,ps[0],4.5,T('accent')); drawLabel(c,'P',{x:ps[0].x,y:ps[0].y-16},{color:T('accent'),size:17});
                    drawDot(c,ps[1],4.5,T('accent')); drawLabel(c,'P′',{x:ps[1].x,y:ps[1].y+18},{color:T('accent'),size:17});
                    drawLine(c,ps[0],ps[1],{w:1.6,color:T('const'),dash:[9,7]});
                  } }},
          {t:'این خط عمودمنصف پاره‌خط AB است؛ محل برخوردش با AB، وسط پاره‌خط (M) است.',
           d(c){ const ps=circleXcircle(A,r,B,r);
                  if(ps.length){ ps.sort(cmpPoint);
                    drawLine(c,ps[0],ps[1],{w:3.4,color:T('accent')});
                    const M=mid(A,B); drawDot(c,M,4.5,T('ok')); drawLabel(c,'M',{x:M.x,y:M.y-18},{color:T('ok'),size:17});
                    rightAngleMark(c,M,unit(B.x-A.x,B.y-A.y),unit(ps[0].x-M.x,ps[0].y-M.y),18,T('ok'));
                  } }}
        ];
      }
    };

    /* ---------- ۲) نیمساز زاویه ---------- */
    D.angbisector={
      name:'نیمساز زاویه',
      why:'پایه‌ی استدلال: OX = OY (شعاع اول) و XP = YP (شعاع دوم) و ضلع مشترک OP؛ پس دو مثلث با ض‌ض‌ض برابرند و زاویه‌های متناظرشان برابر است.',
      pts:[{id:'O',x:430,y:520,label:'O'},
           {id:'A',x:430+430*Math.cos(-0.32),y:520+430*Math.sin(-0.32),label:'A'},
           {id:'B',x:430+400*Math.cos(-1.85),y:520+400*Math.sin(-1.85),label:'B'}],
      steps(sc){
        const O=sc.pos('O'), A=sc.pos('A'), B=sc.pos('B');
        const uA=unit(A.x-O.x,A.y-O.y), uB=unit(B.x-O.x,B.y-O.y);
        const r1=170, X={x:O.x+uA.x*r1,y:O.y+uA.y*r1}, Y={x:O.x+uB.x*r1,y:O.y+uB.y*r1};
        const r2=200;
        const bis={x:uA.x+uB.x, y:uA.y+uB.y};
        const pickP=()=>{ const ps=circleXcircle(X,r2,Y,r2);
          if(!ps.length) return null;
          ps.sort((u,v)=>((v.x-O.x)*bis.x+(v.y-O.y)*bis.y)-((u.x-O.x)*bis.x+(u.y-O.y)*bis.y));
          return ps[0]; };
        return [
          {t:'زاویه‌ی AOB مفروض است. (رأس O و دو سر A و B را می‌توانید جابه‌جا کنید)',
           d(c){ drawRay(c,O,uA,{w:3,color:T('ink')}); drawRay(c,O,uB,{w:3,color:T('ink')}); }},
          {t:'مرکز پرگار را رأس O بگذارید و کمانی بزنید که دو ضلع زاویه را در X و Y قطع کند.',
           d(c){ arcBetween(c,O,r1,uA,uB,{dash:[7,6]});
                  drawDot(c,X,4.5,T('accent')); drawLabel(c,'X',{x:X.x+16,y:X.y+2},{color:T('accent'),size:17});
                  drawDot(c,Y,4.5,T('accent')); drawLabel(c,'Y',{x:Y.x+16,y:Y.y+2},{color:T('accent'),size:17}); }},
          {t:'با شعاعی ثابت و کوچک‌تر از OX، از X و Y دو کمان بزنید تا در نقطه‌ی P (داخل زاویه) همدیگر را قطع کنند.',
           d(c){ arcBetween(c,O,r1,uA,uB,{dash:[7,6]});
                  arcFace(c,X,Y,r2,1.4,{dash:[7,6]}); arcFace(c,Y,X,r2,1.4,{dash:[7,6]});
                  const P=pickP();
                  if(P){ drawDot(c,P,4.5,T('accent'));
                    drawLabel(c,'P',{x:P.x+16,y:P.y-14},{color:T('accent'),size:17}); } }},
          {t:'از O تا P نیم‌خط بکشید.',
           d(c){ const P=pickP();
                  if(P) drawRay(c,O,unit(P.x-O.x,P.y-O.y),{w:1.8,color:T('const'),dash:[9,7]}); }},
          {t:'این نیم‌خط، نیمساز زاویه است: زاویه‌ی AOP با زاویه‌ی POB برابر است.',
           d(c){ const P=pickP();
                  if(P){ const uP=unit(P.x-O.x,P.y-O.y);
                    drawRay(c,O,uP,{w:3.4,color:T('accent')});
                    angMark(c,O,uA,uP,1,T('ok'));
                    angMark(c,O,uP,uB,1,T('ok'));
                    drawLabel(c,'∠AOP = ∠POB',{x:O.x+95,y:O.y-70},{color:T('ok'),size:17}); } }}
        ];
      }
    };

    /* ---------- ۳) عمود از نقطه‌ی خارج خط ---------- */
    D.perpext={
      name:'عمود از نقطه‌ی خارج خط',
      why:'پایه‌ی استدلال: XP = YP = XP′ = YP′؛ پس چهارضلعی XPYP′ لوزی است. قطرهای لوزی بر هم عمودند و همدیگر را نصف می‌کنند؛ پس PP′ بر AB عمود است.',
      pts:[{id:'A',x:250,y:570,label:'A'},{id:'B',x:990,y:500,label:'B'},{id:'P',x:590,y:250,label:'P'}],
      steps(sc){
        const A=sc.pos('A'), B=sc.pos('B'), P=sc.pos('P');
        const H=footPerp(P,A,B);
        const d=Math.hypot(P.x-H.x,P.y-H.y)||1;
        const r=d*1.28+26;
        const P2={x:2*H.x-P.x, y:2*H.y-P.y};
        return [
          {t:'خط AB و نقطه‌ی P (بیرون خط) مفروض‌اند. می‌خواهیم از P بر خط، عمود بکشیم.',
           d(c){ drawLine(c,A,B,{w:2.6,color:T('ink')}); }},
          {t:'مرکز پرگار را روی P بگذارید و با شعاعی بیشتر از فاصله‌ی P تا خط، کمانی بزنید که خط را در دو نقطه‌ی X و Y قطع کند.',
           d(c){ drawLine(c,A,B,{w:2.6,color:T('ink')});
                  arcFace(c,P,H,r,2.0,{dash:[7,6]});
                  const xs=lineXcircle(A,B,P,r);
                  xs.sort(cmpPoint);
                  xs.forEach((X,i)=>{ drawDot(c,X,4.5,T('accent'));
                    drawLabel(c,i===0?'X':'Y',{x:X.x,y:X.y+(X.y>H.y?22:-16)},{color:T('accent'),size:17}); }); }},
          {t:'با همان شعاع، مرکز پرگار را روی X و سپس Y بگذارید؛ دو کمان، در P و در نقطه‌ی روبه‌رو (P′) همدیگر را قطع می‌کنند.',
           d(c){ const xs=lineXcircle(A,B,P,r);
                  if(xs.length>=2){
                    arcFace(c,xs[0],P2,r,1.2,{dash:[7,6]});
                    arcFace(c,xs[1],P2,r,1.2,{dash:[7,6]});
                    drawDot(c,P2,4.5,T('accent'));
                    drawLabel(c,'P′',{x:P2.x,y:P2.y-18},{color:T('accent'),size:17}); } }},
          {t:'P و P′ را با خط‌کش به هم وصل کنید.',
           d(c){ drawSeg(c,P,P2,{w:1.8,color:T('const'),dash:[9,7]}); }},
          {t:'خط PP′ بر AB عمود است؛ محل برخورد (H) پای عمود است.',
           d(c){ drawSeg(c,P,P2,{w:3.4,color:T('accent')});
                  drawDot(c,H,4.5,T('ok')); drawLabel(c,'H',{x:H.x+(H.x<P.x?-20:20),y:H.y+2},{color:T('ok'),size:17});
                  rightAngleMark(c,H,unit(P.x-H.x,P.y-H.y),unit(B.x-A.x,B.y-A.y),20,T('ok')); }}
        ];
      }
    };

    /* ---------- ۴) عمود در نقطه‌ی روی خط ---------- */
    D.perpon={
      name:'عمود در نقطه‌ی روی خط',
      why:'پایه‌ی استدلال: PX = PY و QX = QY؛ پس خط PQ عمودمنصف پاره‌خط XY است. چون P خودش وسط XY است، PQ از P می‌گذرد و بر خط اصلی عمود است.',
      pts:[{id:'A',x:230,y:520,label:'A'},{id:'B',x:1010,y:470,label:'B'},{id:'P',x:610,y:496,label:'P'}],
      setup(sc){ const A=sc.get('A'),B=sc.get('B'),P=sc.get('P');
        P.constrain=q=>{ const f=footPerp(q,A,B); return f; };
      },
      steps(sc){
        const A=sc.pos('A'), B=sc.pos('B'), P=sc.pos('P');
        const u=unit(B.x-A.x,B.y-A.y);
        const r=Math.min(120,dist(A,B)/4.5)||90;
        const X={x:P.x+u.x*r,y:P.y+u.y*r}, Y={x:P.x-u.x*r,y:P.y-u.y*r};
        const r2=r*2.7;
        return [
          {t:'نقطه‌ی P روی خط AB مفروض است؛ می‌خواهیم در P بر خط عمود بکشیم. (P را روی خط جابه‌جا کنید)',
           d(c){ drawLine(c,A,B,{w:2.6,color:T('ink')}); }},
          {t:'مرکز پرگار را روی P بگذارید و با شعاعی دلخواه، دو سوی P روی خط دو کمان بزنید (X و Y).',
           d(c){ drawLine(c,A,B,{w:2.6,color:T('ink')});
                  arcFace(c,P,B,r,2.4,{dash:[7,6]});
                  drawDot(c,X,4.5,T('accent')); drawLabel(c,'X',{x:X.x,y:X.y+24},{color:T('accent'),size:17});
                  drawDot(c,Y,4.5,T('accent')); drawLabel(c,'Y',{x:Y.x,y:Y.y+24},{color:T('accent'),size:17}); }},
          {t:'با شعاعی بزرگ‌تر از PX، از X و Y دو کمان بزنید تا در نقطه‌ی Q همدیگر را قطع کنند.',
           d(c){ arcFace(c,X,Y,r2,1.1,{dash:[7,6]}); arcFace(c,Y,X,r2,1.1,{dash:[7,6]});
                  const ps=circleXcircle(X,r2,Y,r2);
                  if(ps.length){ ps.sort(cmpPoint);
                    drawDot(c,ps[0],4.5,T('accent'));
                    drawLabel(c,'Q',{x:ps[0].x,y:ps[0].y-18},{color:T('accent'),size:17}); } }},
          {t:'P و Q را به هم وصل کنید.',
           d(c){ const ps=circleXcircle(X,r2,Y,r2);
                  if(ps.length){ ps.sort(cmpPoint);
                    drawSeg(c,P,ps[0],{w:1.8,color:T('const'),dash:[9,7]}); } }},
          {t:'خط PQ بر AB عمود است.',
           d(c){ const ps=circleXcircle(X,r2,Y,r2);
                  if(ps.length){ ps.sort(cmpPoint);
                    drawSeg(c,P,ps[0],{w:3.4,color:T('accent')});
                    rightAngleMark(c,P,u,unit(ps[0].x-P.x,ps[0].y-P.y),20,T('ok')); } }}
        ];
      }
    };

    /* ---------- ۵) خط موازی از نقطه‌ی مفروض ---------- */
    D.parallel={
      name:'خط موازی از نقطه‌ی مفروض',
      why:'پایه‌ی استدلال: در رسم، زاویه‌ی متناظر با زاویه‌ی UXV برابر ساخته می‌شود (∠WPZ = ∠UXV)؛ دو خطی که با یک قطع‌کننده زاویه‌های متناظر برابر بسازند، موازی‌اند.',
      pts:[{id:'A',x:230,y:610,label:'A'},{id:'B',x:1010,y:570,label:'B'},{id:'P',x:610,y:290,label:'P'}],
      steps(sc){
        const A=sc.pos('A'), B=sc.pos('B'), P=sc.pos('P');
        const t=clampSegT(P,A,B);
        const X={x:A.x+(B.x-A.x)*t, y:A.y+(B.y-A.y)*t};
        const uAB=unit(B.x-A.x,B.y-A.y);
        const r=150;
        const U={x:X.x+uAB.x*r,y:X.y+uAB.y*r};
        const uXP=unit(P.x-X.x,P.y-X.y);
        const V={x:X.x+uXP.x*r,y:X.y+uXP.y*r};
        const W={x:P.x+r*uXP.x,y:P.y+r*uXP.y};
        const uv=dist(U,V);
        let Z=null;
        const ps=circleXcircle(W,uv,P,r);
        if(ps.length===1) Z=ps[0];
        else if(ps.length===2){
          const d0=Math.abs((ps[0].x-P.x)*uAB.x+(ps[0].y-P.y)*uAB.y)/(dist(ps[0],P)||1);
          const d1=Math.abs((ps[1].x-P.x)*uAB.x+(ps[1].y-P.y)*uAB.y)/(dist(ps[1],P)||1);
          Z= d0>=d1? ps[0]:ps[1];
        }
        return [
          {t:'خط AB و نقطه‌ی P مفروض‌اند؛ می‌خواهیم از P خطی موازی AB بکشیم.',
           d(c){ drawLine(c,A,B,{w:2.6,color:T('ink')}); }},
          {t:'از P خطی دلخواه بکشید که AB را در نقطه‌ی X قطع کند (خط قطع‌کننده).',
           d(c){ drawLine(c,A,B,{w:2.6,color:T('ink')});
                  drawLine(c,P,X,{w:1.8,color:T('const'),dash:[9,7]});
                  drawDot(c,X,4.5,T('accent')); drawLabel(c,'X',{x:X.x,y:X.y+24},{color:T('accent'),size:17}); }},
          {t:'مرکز پرگار را روی X بگذارید و با شعاع دلخواه کمانی بزنید که AB را در U و XP را در V قطع کند.',
           d(c){ drawLine(c,A,B,{w:2.6,color:T('ink')}); drawLine(c,P,X,{w:1.8,color:T('const'),dash:[9,7]});
                  arcBetween(c,X,r,{x:U.x-X.x,y:U.y-X.y},{x:V.x-X.x,y:V.y-X.y},{dash:[7,6]});
                  drawDot(c,U,4.5,T('accent')); drawLabel(c,'U',{x:U.x,y:U.y+24},{color:T('accent'),size:17});
                  drawDot(c,V,4.5,T('accent')); drawLabel(c,'V',{x:V.x-18,y:V.y-6},{color:T('accent'),size:17}); }},
          {t:'با همان شعاع، مرکز پرگار را روی P بگذارید تا کمان، خط XP را در W قطع کند.',
           d(c){ arcFace(c,P,X,r,1.3,{dash:[7,6]});
                  drawDot(c,W,4.5,T('accent')); drawLabel(c,'W',{x:W.x+18,y:W.y+2},{color:T('accent'),size:17}); }},
          {t:'پرگار را به اندازه‌ی UV باز کنید؛ مرکز را روی W بگذارید و کمان بزنید تا کمان قبلی را در Z قطع کند.',
           d(c){ if(Z){ arcFace(c,W,P,uv,1.0,{dash:[7,6]});
                    arcFace(c,P,X,r,1.3,{dash:[7,6]});
                    drawDot(c,Z,4.5,T('accent')); drawLabel(c,'Z',{x:Z.x+18,y:Z.y-10},{color:T('accent'),size:17}); } }},
          {t:'P و Z را وصل کنید؛ چون زاویه‌های متناظر ∠UXV و ∠WPZ برابرند، خط PZ موازی AB است.',
           d(c){ if(Z){ drawRay(c,P,unit(Z.x-P.x,Z.y-P.y),{w:3.4,color:T('accent')});
                    drawRay(c,P,{x:-unit(Z.x-P.x,Z.y-P.y).x,y:-unit(Z.x-P.x,Z.y-P.y).y},{w:3.4,color:T('accent')});
                    parallelArrow(c,P,Z,T('ok'));
                    angMark(c,X,{x:U.x-X.x,y:U.y-X.y},{x:V.x-X.x,y:V.y-X.y},1,T('ok'));
                    angMark(c,P,{x:W.x-P.x,y:W.y-P.y},{x:Z.x-P.x,y:Z.y-P.y},1,T('ok'));
                    drawLabel(c,'∠UXV = ∠WPZ',{x:X.x+40,y:X.y-60},{color:T('ok'),size:17}); } }}
        ];
      }
    };

    /* ---------- ۶) تقسیم پاره‌خط به n قسمت مساوی ---------- */
    D.divide={
      name:'تقسیم پاره‌خط به n قسمت مساوی (کاربرد تالس)',
      why:'پایه‌ی استدلال (قضیه تالس): خط‌های موازی، روی دو قطع‌کننده نسبت‌های مساوی می‌سازند. چون فاصله‌ی Cها روی نیم‌خط مساوی است، قسمت‌های روی AB هم مساوی‌اند.',
      hasN:true,
      pts:[{id:'A',x:300,y:580,label:'A'},{id:'B',x:900,y:580,label:'B'}],
      steps(sc){
        const A=sc.pos('A'), B=sc.pos('B'), n=Tarsim.n;
        const L=dist(A,B)||1;
        const uR={x:Math.cos(-0.62),y:Math.sin(-0.62)};
        const s=L*1.22/n;
        const Cs=[]; for(let i=1;i<=n;i++) Cs.push({x:A.x+uR.x*s*i, y:A.y+uR.y*s*i});
        const Cn=Cs[n-1];
        const Ds=[];
        for(let i=1;i<n;i++){
          const P=lineXline(Cs[i-1],{x:Cs[i-1].x+(B.x-Cn.x),y:Cs[i-1].y+(B.y-Cn.y)},A,B);
          Ds.push(P);
        }
        const part=L/n;
        return [
          {t:'پاره‌خط AB مفروض است؛ از A یک نیم‌خط دلخواه بکشید (جهتش مهم نیست).',
           d(c){ drawSeg(c,A,B,{w:3,color:T('ink')});
                  drawRay(c,A,uR,{w:1.6,color:T('const')}); }},
          {t:'پرگار را به شعاعی ثابت باز کنید و روی نیم‌خط، n بار به اندازه‌ی همان شعاع جلو بروید تا C₁ تا C'+faDigits(n)+' ساخته شود.',
           d(c){ drawSeg(c,A,B,{w:3,color:T('ink')}); drawRay(c,A,uR,{w:1.6,color:T('const')});
                  let prev=A;
                  for(let i=0;i<n;i++){
                    const C=Cs[i];
                    drawArc(c,A,s*i+s*0.5,angOf(uR)-0.5,angOf(uR)+0.5,{dash:[4,5]});
                    drawDot(c,C,4.5,T('accent'));
                    drawLabel(c,'C'+faDigits(i+1),{x:C.x+18,y:C.y-10},{color:T('accent'),size:16});
                    prev=C;
                  } }},
          {t:'C'+faDigits(n)+' را به B وصل کنید.',
           d(c){ drawSeg(c,Cn,B,{w:2.4,color:T('ink')}); }},
          {t:'از هر C یک خط به موازات C'+faDigits(n)+'B بکشید تا AB را قطع کند (در کلاس با گونیا و خط‌کش).',
           d(c){ drawSeg(c,Cn,B,{w:2.4,color:T('ink')});
                  for(let i=0;i<Ds.length;i++){
                    const C=Cs[i];
                    drawLine(c,C,{x:C.x+(B.x-Cn.x),y:C.y+(B.y-Cn.y)},{w:1.5,color:T('const'),dash:[8,6]});
                    parallelArrow(c,C,{x:C.x+(B.x-Cn.x),y:C.y+(B.y-Cn.y)},T('ok'));
                    if(Ds[i]){ drawDot(c,Ds[i],4.5,T('accent'));
                      drawLabel(c,'D'+faDigits(i+1),{x:Ds[i].x,y:Ds[i].y+24},{color:T('accent'),size:16}); }
                  } }},
          {t:'AB به '+faDigits(n)+' قسمت مساوی تقسیم شد؛ طول هر قسمت: '+faNum(part/50,1)+' سانتی‌متر (مقیاس ۵۰ پیکسل = ۱ سانتی‌متر).',
           d(c){ drawSeg(c,A,B,{w:3.6,color:T('accent')});
                  let prev=A;
                  for(let i=0;i<Ds.length;i++){
                    if(Ds[i]){ tickMark(c,prev,Ds[i],1,T('ok'));
                      drawLabel(c,faNum(dist(prev,Ds[i])/50,1),{x:mid(prev,Ds[i]).x,y:mid(prev,Ds[i]).y+30},{color:T('ok'),size:14});
                      prev=Ds[i]; }
                  }
                  tickMark(c,prev,B,1,T('ok'));
                  drawLabel(c,faNum(dist(prev,B)/50,1),{x:mid(prev,B).x,y:mid(prev,B).y+30},{color:T('ok'),size:14}); }}
        ];
      }
    };

    /* ---------- ۷) رسم مثلث با سه ضلع مفروض ---------- */
    D.triangle={
      name:'رسم مثلث با سه ضلع مفروض',
      why:'پایه‌ی استدلال: با سه ضلع مشخص، شکل مثلث یکتاست (حالت ض‌ض‌ض برابری/تشابه). شرط ساخت مثلث: هر ضلع باید کوچک‌تر از مجموع دو ضلع دیگر باشد.',
      hasTri:true,
      pts:[{id:'A',x:400,y:560,label:'A'},{id:'B',x:850,y:560,label:'B'}],
      steps(sc){
        const A=sc.pos('A'), B=sc.pos('B');
        const c=dist(A,B)/50, a=Tarsim.triA, b=Tarsim.triB;
        const rb=b*50, ra=a*50;
        const possible=(a+b>c+0.05)&&(a+c>b+0.05)&&(b+c>a+0.05);
        const ps=possible? circleXcircle(A,rb,B,ra):[];
        let C=null;
        if(ps.length){ ps.sort(cmpPoint); C=ps[0]; }
        const MAB=mid(A,B);
        return [
          {t:()=> 'ضلع AB را رسم کنید. طول آن همین‌جا c = '+faNum(c,1)+' سانتی‌متر است (با کشیدن A و B عوض می‌شود). a = '+faNum(a,1)+' و b = '+faNum(b,1)+' را با لغزنده بالای صفحه تنظیم کنید.',
           d(c2){ drawSeg(c2,A,B,{w:3,color:T('ink')});
                   drawLabel(c2,'c = '+faNum(c,1),{x:MAB.x,y:MAB.y+26},{color:T('ink'),size:16}); }},
          {t:()=> 'مرکز پرگار را روی A بگذارید و به شعاع b = '+faNum(b,1)+' سانتی‌متر کمانی بزنید.',
           d(c2){ drawCircle(c2,A,rb,{dash:[7,6],color:T('const'),alpha:.8}); }},
          {t:()=> 'مرکز پرگار را روی B بگذارید و به شعاع a = '+faNum(a,1)+' سانتی‌متر کمانی بزنید.',
           d(c2){ drawCircle(c2,A,rb,{dash:[7,6],color:T('const'),alpha:.55});
                   drawCircle(c2,B,ra,{dash:[7,6],color:T('const'),alpha:.8}); }},
          {t:()=> possible? 'محل برخورد دو کمان، رأس C است.' :
                    'کمان‌ها همدیگر را قطع نمی‌کنند؛ پس با این سه طول مثلثی ساخته نمی‌شود! (شرط: هر ضلع کوچک‌تر از مجموع دو ضلع دیگر)',
           d(c2){ drawCircle(c2,A,rb,{dash:[7,6],color:T('const'),alpha:.4});
                   drawCircle(c2,B,ra,{dash:[7,6],color:T('const'),alpha:.55});
                   if(C){ drawDot(c2,C,4.5,T('accent'));
                     drawLabel(c2,'C',{x:C.x,y:C.y-18},{color:T('accent'),size:17});
                     drawSeg(c2,A,C,{w:1.8,color:T('const')}); drawSeg(c2,B,C,{w:1.8,color:T('const')}); }
                   else{ drawLabel(c2,'مثلث ممکن نیست',{x:(A.x+B.x)/2,y:300},{color:T('err'),size:22}); } }},
          {t:()=>'مثلث ABC با سه ضلع مفروض رسم شد: AB = '+faNum(c,1)+' ، BC = '+faNum(a,1)+' ، AC = '+faNum(b,1)+' سانتی‌متر.',
           d(c2){ if(C){ drawSeg(c2,A,B,{w:3,color:T('ink')});
                     drawSeg(c2,A,C,{w:3.2,color:T('accent')}); drawSeg(c2,B,C,{w:3.2,color:T('accent')});
                     drawLabel(c2,'a',{x:mid(B,C).x+14,y:mid(B,C).y-6},{color:T('accent'),size:16});
                     drawLabel(c2,'b',{x:mid(A,C).x-14,y:mid(A,C).y-6},{color:T('accent'),size:16}); } }}
        ];
      }
    };
  },

  /* ---------- مدیریت ---------- */
  select(id, first){
    this.stopPlay();
    this.cur=id;
    $('#tarsimSel').value=id;
    const def=this.defs[id];
    $('#tarsimNCtl').hidden=!def.hasN;
    $('#tarsimTriCtl').hidden=!def.hasTri;
    this.build();
    if(!first) this.save();
  },
  build(resetPts){
    const def=this.defs[this.cur];
    if(this.scene){ this.scene.points=[]; }
    const sc=this.scene|| new GeoScene(this.view,{
      draw:(c,scene)=>this.drawSteps(c,scene),
      onChange:()=>this.save()
    });
    this.scene=sc;
    def.pts.forEach(p=>{
      sc.addPoint(p.id,p.x,p.y,{label:p.label});
    });
    if(def.setup) def.setup(sc);
    // بازیابی موقعیت ذخیره‌شده
    if(!resetPts){
      const pts=Store.get('tarsim.pts.'+this.cur,null);
      if(pts) pts.forEach(pp=>{ const q=sc.get(pp.id); if(q){q.x=pp.x;q.y=pp.y;} });
    }
    const saved=Store.get('tarsim',{});
    this.step=clamp(saved['step.'+this.cur]||0, 0, def.steps(sc).length-1);
    this.update();
  },
  stepsLen(){ return this.defs[this.cur].steps(this.scene).length; },
  go(dir){
    this.stopPlay();
    const L=this.stepsLen();
    const ns=clamp(this.step+dir,0,L-1);
    if(ns!==this.step){ this.step=ns; this.update(); this.save(); }
    else if(dir>0) toast('این آخرین مرحله است');
  },
  togglePlay(){
    if(this.playing){ this.stopPlay(); return; }
    this.playing=true;
    $('#tarsimPlay').textContent='توقف';
    $('#tarsimPlay').classList.add('on');
    this.playTimer=setInterval(()=>{
      if(this.step>=this.stepsLen()-1){ this.stopPlay(); return; }
      this.step++; this.update(); this.save();
    },2300);
    if(this.step>=this.stepsLen()-1) this.step=-1;
  },
  stopPlay(){
    this.playing=false;
    clearTimeout(this.playTimer); clearInterval(this.playTimer);
    const b=$('#tarsimPlay'); if(b){ b.textContent='پخش خودکار'; b.classList.remove('on'); }
  },
  update(){
    const sc=this.scene, def=this.defs[this.cur];
    const steps=def.steps(sc);
    this.step=clamp(this.step,0,steps.length-1);
    const st=steps[this.step];
    $('#tarsimStepNum').textContent='مرحله '+faDigits(this.step+1)+' از '+faDigits(steps.length);
    $('#tarsimStepBody').textContent=typeof st.t==='function'? st.t():st.t;
    $('#tarsimWhy').textContent=def.why;
    // نقطه‌ها
    const dots=$('#tarsimDots'); dots.innerHTML='';
    steps.forEach((s,i)=>{
      const d=document.createElement('i');
      if(i<this.step) d.className='done';
      if(i===this.step) d.classList.add('cur');
      d.title='مرحله '+(i+1);
      d.addEventListener('click',()=>{this.stopPlay();this.step=i;this.update();this.save();});
      dots.appendChild(d);
    });
    sc.render();
  },
  drawSteps(c,sc){
    const steps=this.defs[this.cur].steps(sc);
    for(let i=0;i<=this.step&&i<steps.length;i++) steps[i].d(c,sc);
  },
  save(){
    const data=Store.get('tarsim',{});
    data.cur=this.cur; data.n=this.n; data.triA=this.triA; data.triB=this.triB;
    data['step.'+this.cur]=this.step;
    Store.set('tarsim',data);
    Store.set('tarsim.pts.'+this.cur, this.scene.points.map(p=>({id:p.id,x:p.x,y:p.y})));
  },
  onPager(dir){ this.go(dir); }
};
