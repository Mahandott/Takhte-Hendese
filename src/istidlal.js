'use strict';
/* ================= ماژول استدلال + کارت قضیه‌ها ================= */
const REASONS=[
  'فرض مسئله','معلوم است','ضلع یا زاویه مشترک','زاویه‌های متقابل به رأس',
  'زاویه‌های متناوب داخلی','زاویه‌های متناوب خارجی','زاویه‌های متناظر','زاویه‌های هم‌داخلی',
  'جمع زاویه‌های مثلث (۱۸۰°)','زاویه‌های قاعده مثلث متساوی‌الساقین',
  'قضیه تالس','عکس قضیه تالس','تناسب اضلاع',
  'تشابه ز‌ز','تشابه ض‌ز‌ض','تشابه ض‌ض‌ض',
  'برابری مثلث‌ها (ض‌ز‌ض)','برابری مثلث‌ها (ض‌ض‌ض)',
  'عمودمنصف','نیمساز زاویه','خط موازی','دیگر…'
];
const OTHER='دیگر…';

const Cards={
  show(keys){
    const body=$('#cardsBody');
    if(typeof keys==='string') keys=[keys];
    body.innerHTML=keys.map(k=>CARDS[k]||'').join('');
    $('#cardsModal').hidden=false;
  }
};

const CARDS={
  thales:
  '<div class="thm"><h4>قضیه تالس</h4>'+
  '<div class="fig"><svg width="250" height="140" viewBox="0 0 250 140">'+
  '<g stroke="currentColor" fill="none" stroke-width="1.6">'+
  '<line x1="12" y1="28" x2="238" y2="28"/><line x1="12" y1="70" x2="238" y2="70"/><line x1="12" y1="112" x2="238" y2="112"/>'+
  '<line x1="70" y1="10" x2="130" y2="130"/><line x1="150" y1="10" x2="215" y2="130"/>'+
  '</g>'+
  '<g font-size="12" fill="currentColor" font-family="Vazirmatn, Tahoma, sans-serif">'+
  '<text x="52" y="24">A</text><text x="84" y="66">B</text><text x="116" y="108">C</text>'+
  '<text x="142" y="24">D</text><text x="172" y="66">E</text><text x="200" y="108">F</text></g>'+
  '</svg></div>'+
  '<p>اگر سه خط موازی با دو خط دیگر قطع شوند، روی هر قطع‌کننده نسبت‌های مساوی ساخته می‌شود:</p>'+
  '<div class="formula">AB / BC = DE / EF</div></div>',

  aks:
  '<div class="thm"><h4>عکس قضیه تالس</h4>'+
  '<div class="fig"><svg width="220" height="140" viewBox="0 0 220 140">'+
  '<g stroke="currentColor" fill="none" stroke-width="1.6">'+
  '<path d="M110 12 L30 128 L190 128 Z"/>'+
  '<line x1="86" y1="46" x2="146" y2="52" stroke-dasharray="5 4"/>'+
  '</g>'+
  '<g font-size="12" fill="currentColor" font-family="Vazirmatn, Tahoma, sans-serif">'+
  '<text x="112" y="12">A</text><text x="16" y="132">B</text><text x="194" y="132">C</text>'+
  '<text x="70" y="42">M</text><text x="150" y="46">D</text></g>'+
  '</svg></div>'+
  '<p>در مثلث ABC، اگر نقاط M و D روی دو ضلع طوری باشند که نسبت‌ها برابر شود، آن‌گاه MD با ضلع سوم موازی است:</p>'+
  '<div class="formula">AM/MB = AD/DC  ⟹  MD ∥ CB</div></div>',

  tashaboh:
  '<div class="thm-grid">'+
  '<div class="thm"><h4>حالت ز‌ز (زاویه ـ زاویه)</h4>'+
  '<div class="fig"><svg width="220" height="110" viewBox="0 0 220 110">'+
  '<g stroke="currentColor" fill="none" stroke-width="1.6">'+
  '<path d="M20 95 L60 15 L110 95 Z"/><path d="M130 100 L175 35 L215 100 Z"/></g>'+
  '<g stroke="#e8710a" fill="none" stroke-width="2">'+
  '<path d="M45 60 A28 28 0 0 1 63 62"/><path d="M158 68 A22 22 0 0 1 174 70"/></g>'+
  '<g stroke="#1565c0" fill="none" stroke-width="2">'+
  '<path d="M76 62 A26 26 0 0 1 88 82"/><path d="M178 74 A20 20 0 0 1 188 88"/></g>'+
  '</svg></div>'+
  '<p>دو زاویه از یک مثلث با دو زاویه از مثلث دیگر برابر باشند.</p></div>'+
  '<div class="thm"><h4>حالت ض‌ز‌ض</h4>'+
  '<div class="fig"><svg width="220" height="110" viewBox="0 0 220 110">'+
  '<g stroke="currentColor" fill="none" stroke-width="1.6">'+
  '<path d="M20 95 L55 15 L110 95 Z"/><path d="M130 100 L168 30 L215 100 Z"/></g>'+
  '<g stroke="#d23f31" stroke-width="2.4" fill="none"><line x1="38" y1="56" x2="48" y2="60"/><line x1="146" y1="66" x2="156" y2="70"/></g>'+
  '<g stroke="#d23f31" stroke-width="2.4" fill="none"><line x1="66" y1="56" x2="74" y2="66"/><line x1="184" y1="66" x2="192" y2="76"/></g>'+
  '<g stroke="#1e8e3e" fill="none" stroke-width="2"><path d="M52 48 A20 20 0 0 1 66 52"/><path d="M164 56 A18 18 0 0 1 176 60"/></g>'+
  '</svg></div>'+
  '<p>دو ضلع متناسب باشند و زاویه‌ی بین آن دو برابر باشد.</p></div>'+
  '<div class="thm"><h4>حالت ض‌ض‌ض</h4>'+
  '<div class="fig"><svg width="220" height="110" viewBox="0 0 220 110">'+
  '<g stroke="currentColor" fill="none" stroke-width="1.6">'+
  '<path d="M20 95 L58 15 L110 95 Z"/><path d="M128 100 L170 32 L215 100 Z"/></g>'+
  '<g stroke="#d23f31" stroke-width="2.2" fill="none"><line x1="40" y1="55" x2="49" y2="59"/></g>'+
  '<g stroke="#1565c0" stroke-width="2.2" fill="none"><line x1="66" y1="56" x2="75" y2="60"/><line x1="66" y1="62" x2="75" y2="66"/><line x1="176" y1="66" x2="185" y2="70"/></g>'+
  '<g stroke="#1e8e3e" stroke-width="2.2" fill="none"><line x1="90" y1="95" x2="100" y2="95"/><line x1="92" y1="89" x2="102" y2="89"/></g>'+
  '</svg></div>'+
  '<p>هر سه جفت ضلع متناظر، نسبت‌های مساوی داشته باشند؛ آن‌گاه نسبت تشابه برای هر سه جفت یکی است.</p></div>'+
  '<div class="thm"><h4>شرط ساخت مثلث</h4>'+
  '<p>سه پاره‌خط فقط وقتی مثلث می‌سازند که هر ضلع از مجموع دو ضلع دیگر کوچک‌تر باشد:</p>'+
  '<div class="formula">c &lt; a + b</div>'+
  '<p style="margin-top:6px">و به‌طور قرینه برای دو ضلع دیگر. اگر برقرار نباشد، دو کمان پرگار همدیگر را قطع نمی‌کنند.</p></div>'+
  '</div>'
};

const Ist={
  rows:[], uid:1, lastInput:null, saveTimer:null,

  init(){
    const saved=Store.get('ist',null);
    if(saved){ this.rows=saved.rows||[]; this.uid=saved.uid||1; }
    $('#istAdd').addEventListener('click',()=>{ this.rows.push({id:this.uid++, stmt:'', reason:REASONS[0], custom:''}); this.render(); this.save(); });
    $('#istPrint').addEventListener('click',()=>this.print());
    $('#istTxt').addEventListener('click',()=>this.saveTxt());
    $('#istClear').addEventListener('click',()=>{
      if(this.rows.length&&confirm('همه‌ی ردیف‌های استدلال پاک شود؟')){ this.rows=[]; this.render(); this.save(); }
    });
    $('#istCards').addEventListener('click',()=>Cards.show(['thales','aks','tashaboh']));
    $('#istSyms').addEventListener('click',e=>{
      const r=e.currentTarget.getBoundingClientRect();
      SymPad.open(r.left, r.top-8, this.lastInput||$('#istGiven'));
    });
    ['istTitle','istGiven','istClaim'].forEach(id=>{
      $('#'+id).addEventListener('input',()=>this.save());
      $('#'+id).addEventListener('focus',e=>{this.lastInput=e.target;});
    });
    $('#istTitle').value=Store.get('istTitle','');
    $('#istGiven').value=Store.get('istGiven','');
    $('#istClaim').value=Store.get('istClaim','');
    if(!this.rows.length){
      this.rows=[
        {id:this.uid++, stmt:'∠B = ∠B′', reason:REASONS[1], custom:''},
        {id:this.uid++, stmt:'∠C = ∠C′', reason:REASONS[1], custom:''},
        {id:this.uid++, stmt:'△ABC ∼ △A′B′C′', reason:'تشابه ز‌ز', custom:''}
      ];
    }
    this.render();
  },
  save(){
    clearTimeout(this.saveTimer);
    this.saveTimer=setTimeout(()=>{
      Store.set('ist',{rows:this.rows, uid:this.uid});
      Store.set('istTitle',$('#istTitle').value);
      Store.set('istGiven',$('#istGiven').value);
      Store.set('istClaim',$('#istClaim').value);
    },300);
  },
  render(){
    const wrap=$('#istRows'); wrap.innerHTML='';
    this.rows.forEach((r,i)=>{
      const row=document.createElement('div'); row.className='ist-row';
      const num=document.createElement('div'); num.className='ist-num'; num.textContent=faDigits(i+1);
      const stmt=document.createElement('textarea'); stmt.className='ist-stmt'; stmt.rows=1;
      stmt.value=r.stmt; stmt.dir='auto'; stmt.placeholder='گزاره…';
      stmt.addEventListener('input',()=>{ r.stmt=stmt.value; stmt.style.height='auto'; stmt.style.height=stmt.scrollHeight+'px'; this.save(); });
      stmt.addEventListener('focus',e=>{this.lastInput=stmt;});
      const sel=document.createElement('select'); sel.className='ist-reason';
      REASONS.forEach(rn=>{
        const o=document.createElement('option'); o.value=rn; o.textContent=rn; sel.appendChild(o);
      });
      sel.value=(REASONS.indexOf(r.reason)>=0)? r.reason : OTHER;
      sel.addEventListener('change',()=>{
        if(sel.value===OTHER){ r.reason=OTHER; custom.style.display='block'; custom.focus(); }
        else{ r.reason=sel.value; custom.style.display='none'; }
        this.save();
      });
      const custom=document.createElement('input'); custom.className='ist-reason custom';
      custom.value=r.reason===OTHER? (r.custom||''):'';
      custom.placeholder='دلیل دلخواه…';
      custom.style.display=(sel.value===OTHER)?'block':'none';
      custom.addEventListener('input',()=>{ r.custom=custom.value; this.save(); });
      custom.addEventListener('focus',e=>{this.lastInput=custom;});
      const ctl=document.createElement('div'); ctl.className='ist-ctl';
      const mk=(txt,fn,tt)=>{ const b=document.createElement('button'); b.textContent=txt; b.title=tt; b.addEventListener('click',fn); return b; };
      ctl.appendChild(mk('▲',()=>this.move(i,-1),'بالا'));
      ctl.appendChild(mk('▼',()=>this.move(i,1),'پایین'));
      ctl.appendChild(mk('✕',()=>{ this.rows.splice(i,1); this.render(); this.save(); },'حذف'));
      row.appendChild(num); row.appendChild(stmt); row.appendChild(sel); row.appendChild(custom); row.appendChild(ctl);
      wrap.appendChild(row);
      requestAnimationFrame(()=>{ stmt.style.height='auto'; stmt.style.height=Math.max(42,stmt.scrollHeight)+'px'; });
    });
    if(!this.rows.length){
      wrap.innerHTML='<div class="dropzone" style="position:static;padding:30px"><div class="dz-text">با دکمه‌ی «افزودن گزاره» جدول اثبات را بسازید.<br>دلیل هر گزاره را از فهرست آماده انتخاب کنید.</div></div>';
    }
  },
  move(i,dir){
    const j=i+dir;
    if(j<0||j>=this.rows.length) return;
    const t=this.rows[i]; this.rows[i]=this.rows[j]; this.rows[j]=t;
    this.render(); this.save();
  },
  print(){
    this.fillPrint();
    window.print();
  },
  fillPrint(){
    const v=$('#istPrintView');
    const title=Store.get('istTitle','')||'استدلال';
    const given=Store.get('istGiven',''), claim=Store.get('istClaim','');
    const trs=this.rows.map((r,i)=>{
      const reason=r.reason===OTHER? (r.custom||'—') : r.reason;
      return '<tr><td style="width:34px">'+faDigits(i+1)+'</td><td>'+(r.stmt||'—')+'</td><td>'+reason+'</td></tr>';
    }).join('');
    v.innerHTML='<h2>'+title+'</h2>'+
      '<div class="gc"><b>فرض:</b> '+given+'<br><b>حکم:</b> '+claim+'</div>'+
      '<table><tr><th>گام</th><th>گزاره</th><th>دلیل</th></tr>'+trs+'</table>';
  },
  saveTxt(){
    const reason=r=>r.reason===OTHER? (r.custom||'—') : r.reason;
    let s=(Store.get('istTitle','')||'استدلال')+'\n';
    s+='فرض: '+(Store.get('istGiven',''))+'\n';
    s+='حکم: '+(Store.get('istClaim',''))+'\n\n';
    this.rows.forEach((r,i)=>{ s+=faDigits(i+1)+') '+(r.stmt||'—')+'  [دلیل: '+reason(r)+']\n'; });
    const blob=new Blob(['\ufeff'+s],{type:'text/plain;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='estelal.txt';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),3000);
    toast('فایل متن استدلال ذخیره شد');
  }
};
