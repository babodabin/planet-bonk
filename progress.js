// Planet Bonk — 매일 목표(DAILY) · 기록 지키기(BACKUP)
(function(){
  const el=(tag, cls, text)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e; };

  // ───────── 매일 목표: 날짜마다 3개. 다 깨면 덤으로 별가루 더 ─────────
  const KEY='pb-daily', NAMES=['Moon','Mercury','Mars','Venus','Earth'], NEED=[8,8,6,5,4], REWARD=[20,30,40], ALL_BONUS=50;
  const dayKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  function today(){ return dayKey(new Date()); }
  function yesterday(){ const d=new Date(); d.setDate(d.getDate()-1); return dayKey(d); }
  // 같은 날은 누구나 같은 목표 (날짜로 정함)
  function goalsFor(day){
    let h=2166136261; for(const ch of day){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); }
    const rnd=n=>{ h=Math.imul(h^(h>>>15),2246822507); h^=h>>>13; return (h>>>0)%n; };
    const t=rnd(5);
    const easy=[{ k:'bonk', t, n:NEED[t] }, { k:'game', n:3 }][rnd(4)===0?1:0];
    const mid=[{ k:'dust', n:100 }, { k:'ship', n:3 }, { k:'bonk', t:(t+2)%5, n:NEED[(t+2)%5]+2 }][rnd(3)];
    const hard=[{ k:'score', n:50+rnd(4)*10 }, { k:'level', n:7 }, { k:'ship1', n:2 }][rnd(3)];
    return [easy, mid, hard];
  }
  function text(g){
    if(g.k==='bonk') return 'Bonk '+NAMES[g.t]+' '+g.n+' times';
    if(g.k==='game') return 'Finish '+g.n+' games';
    if(g.k==='dust') return 'Collect '+g.n+' Stardust in games';
    if(g.k==='ship') return 'Hit '+g.n+' spacecraft';
    if(g.k==='ship1') return 'Hit '+g.n+' spacecraft in one game';
    if(g.k==='score') return 'Score '+g.n+' in one game';
    return 'Reach LEVEL '+g.n;
  }
  const int=v=>Number.isFinite(v) && v>0 ? Math.floor(v) : 0;
  let st=null, dirty=false, earn=()=>{};
  function state(){
    const day=today();
    if(!st){
      let s=null; try{ s=JSON.parse(localStorage.getItem(KEY)); }catch(e){}
      st = s && typeof s==='object' && typeof s.day==='string' ? s : { day:'', p:[0,0,0], done:[false,false,false], bonus:false, streak:0, last:'' };
      st.p=[0,1,2].map(i=>int((st.p||[])[i])); st.done=[0,1,2].map(i=>!!(st.done||[])[i]); st.streak=int(st.streak);
    }
    if(st.day!==day) st={ day, p:[0,0,0], done:[false,false,false], bonus:false, streak: st.last===yesterday() ? st.streak : 0, last:st.last||'' };
    return st;
  }
  function save(){ if(!dirty) return; dirty=false; try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){} }
  // 게임에서 일어난 일을 알림. 이번에 깬 목표가 있으면 받은 별가루 수를 돌려줌
  function on(kind, v){
    const s=state(), goals=goalsFor(s.day);
    let won=0;
    goals.forEach((g,i)=>{
      if(s.done[i]) return;
      let p=s.p[i];
      if(kind==='bonk' && g.k==='bonk' && g.t===v) p++;
      else if(kind==='game' && g.k==='game') p++;
      else if(kind==='dust' && g.k==='dust') p+=v;
      else if(kind==='ship' && g.k==='ship') p++;
      else if(kind==='ship1' && g.k==='ship1') p=Math.max(p,v);
      else if(kind==='score' && g.k==='score') p=Math.max(p,v);
      else if(kind==='level' && g.k==='level') p=Math.max(p,v);
      if(p===s.p[i]) return;
      s.p[i]=Math.min(g.n,p); dirty=true;
      if(p>=g.n){
        s.done[i]=true; won+=REWARD[i];
        if(s.last!==s.day){ s.streak=(s.last===yesterday() ? s.streak : 0)+1; s.last=s.day; }
      }
    });
    if(s.done.every(Boolean) && !s.bonus){ s.bonus=true; won+=ALL_BONUS+Math.min(5,s.streak)*10; dirty=true; }
    if(won){ earn(won); save(); }
    return won;
  }
  function label(){ return 'DAILY  '+state().done.filter(Boolean).length+' / 3'; }
  function open(){
    const s=state(), goals=goalsFor(s.day), wrap=el('div','dy-list');
    goals.forEach((g,i)=>{
      const row=el('div','dy-row'+(s.done[i]?' done':''));
      const top=el('div','dy-top'); top.append(el('span','',text(g)), el('b','', s.done[i] ? 'DONE' : '✦ '+REWARD[i]));
      const bar=el('div','sp-bar'), fill=el('i'); fill.style.width=Math.min(100, s.p[i]/g.n*100)+'%'; bar.appendChild(fill);
      row.append(top, bar, el('div','dy-num', s.p[i]+' / '+g.n));
      wrap.appendChild(row);
    });
    const streak=s.last===s.day || s.last===yesterday() ? s.streak : 0;
    const bonus=ALL_BONUS+Math.min(5, s.last===s.day ? streak : streak+1)*10;
    wrap.appendChild(el('div','dy-note', s.bonus ? 'All done! New goals tomorrow.' : 'Finish all 3 for a bonus of ✦ '+bonus+'.'));
    if(streak>0) wrap.appendChild(el('div','dy-streak', streak+(streak===1?' DAY':' DAYS IN A ROW')));
    JPI.modal('DAILY GOALS', wrap);
  }

  // ───────── 기록 지키기: 모든 기록을 글자 코드로 만들어 두었다가 되살림 ─────────
  // 순위표에 올린 기록(pb-best 등)은 기기마다 다르므로 넣지 않음
  const num=(v,max)=>typeof v==='number' && Number.isFinite(v) && v>=0 && v<=max;
  const isInt=(v,max)=>num(v,max) && Math.floor(v)===v;
  const map=(v,ok)=>v && typeof v==='object' && !Array.isArray(v) && Object.keys(v).length<200 && Object.entries(v).every(([k,x])=>/^[a-z0-9]{1,16}$/i.test(k) && ok(x));
  const tiers=v=>Array.isArray(v) && v.length<=10 && v.every(t=>isInt(t,9));
  const coord=v=>typeof v==='number' && Number.isFinite(v) && Math.abs(v)<10000;
  const CHECK={
    'pb-record':v=>isInt(v,1e6), 'pb-dust':v=>isInt(v,1e7), 'pb-guide':tiers, 'pb-seen':tiers,
    'pb-lv':v=>map(v,x=>isInt(x,10)), 'pb-skin':v=>map(v,x=>isInt(x,2)), 'pb-ships':v=>map(v,x=>isInt(x,1e6)),
    'pb-last':v=>v && isInt(v.s,1e6) && isInt(v.l,1000),
    'pb-history':v=>Array.isArray(v) && v.length<=5 && v.every(g=>g && isInt(g.s,1e6) && isInt(g.l,1000) && /^\d{4}-\d\d-\d\d$/.test(g.d)),
    'pb-daily':v=>v && /^\d{4}-\d\d-\d\d$/.test(v.day) && /^(\d{4}-\d\d-\d\d)?$/.test(v.last||'') && isInt(v.streak,100000) && Array.isArray(v.p) && v.p.length===3 && v.p.every(x=>isInt(x,1e6)) && Array.isArray(v.done) && v.done.length===3,
    'pb-save':v=>v && Array.isArray(v.balls) && v.balls.length<=200 && v.balls.every(b=>b && isInt(b.tier,9) && coord(b.x) && coord(b.y) && coord(b.vx) && coord(b.vy) && isInt(b.id,1e9))
      && Array.isArray(v.queue) && v.queue.length===4 && v.queue.every(t=>isInt(t,9)) && isInt(v.level,1000) && v.level>=1 && isInt(v.popped,1e6)
      && coord(v.until) && isInt(v.record,1e6) && isInt(v.ballSeq,1e9) && (v.gd===undefined || isInt(v.gd,1e6)) && (v.sh===undefined || isInt(v.sh,9))
  };
  function sum(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(36); }
  function makeCode(){
    const o={};
    for(const k of Object.keys(CHECK)){
      try{ const v=JSON.parse(localStorage.getItem(k)); if(v!==null && CHECK[k](v)) o[k]=v; }catch(e){}
    }
    const name=localStorage.getItem('pb-name'); if(name && PBRank.validName(name)==='') o['pb-name']=name;
    const json=JSON.stringify(o);
    return 'PB1.'+btoa(json).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')+'.'+sum(json);
  }
  function readCode(raw){
    const m=/PB1\.([A-Za-z0-9_-]+)\.([a-z0-9]+)/.exec(String(raw).replace(/\s+/g,''));
    if(!m || m[1].length>200000) return null;
    try{
      const json=atob(m[1].replace(/-/g,'+').replace(/_/g,'/'));
      if(sum(json)!==m[2]) return null;
      const o=JSON.parse(json), out={};
      if(!o || typeof o!=='object') return null;
      for(const k of Object.keys(CHECK)) if(o[k]!==undefined && CHECK[k](o[k])) out[k]=o[k];
      if(typeof o['pb-name']==='string' && PBRank.validName(o['pb-name'])==='') out['pb-name']=o['pb-name'];
      return out['pb-guide'] || out['pb-record']!==undefined ? out : null;   // 빈 코드로 기록을 지우는 일 방지
    }catch(e){ return null; }
  }
  function apply(o){
    // 코드에 없는 기록은 지워서, 저장했을 때와 똑같이 만듦
    for(const k of Object.keys(CHECK)) if(o[k]===undefined) localStorage.removeItem(k);
    for(const [k,v] of Object.entries(o)) localStorage.setItem(k, k==='pb-name' ? v : JSON.stringify(v));
  }
  function summary(o){
    const lv=o['pb-lv']||{}, grown=Object.values(lv).reduce((a,b)=>a+Math.max(0,b-1),0);
    return 'Best '+(o['pb-record']||0)+' · ✦ '+(o['pb-dust']||0)+' · '+(o['pb-guide']||[]).length+' / 10 planets · '+grown+' grown levels';
  }
  async function copy(area){
    try{ await navigator.clipboard.writeText(area.value); return true; }catch(e){}
    try{ area.focus(); area.select(); return document.execCommand('copy'); }catch(e){ return false; }
  }
  function openBackup(flush){
    flush();
    const wrap=el('div','bk'), code=makeCode(), area=el('textarea','bk-code');
    area.readOnly=true; area.value=code; area.rows=3;
    const msg=el('div','bk-msg'), row=el('div','bk-row');
    const c=el('button','bk-btn','COPY CODE'); c.type='button';
    c.addEventListener('click', async()=>{ msg.textContent=await copy(area) ? 'Copied. Paste it somewhere safe, like your notes.' : 'Press and hold the code to copy it.'; });
    row.appendChild(c);
    if(navigator.share){
      const sh=el('button','bk-btn line','SEND'); sh.type='button';
      sh.addEventListener('click', ()=>{ navigator.share({ title:'Planet Bonk backup', text:code }).catch(()=>{}); });
      row.appendChild(sh);
    }
    const inp=el('textarea','bk-code'); inp.rows=3; inp.placeholder='Paste a backup code here';
    inp.setAttribute('autocapitalize','off'); inp.setAttribute('autocorrect','off'); inp.spellcheck=false;
    const r=el('button','bk-btn line','RESTORE'); r.type='button';
    const msg2=el('div','bk-msg'); let ready=null;
    inp.addEventListener('input', ()=>{ ready=null; r.textContent='RESTORE'; msg2.textContent=''; });
    r.addEventListener('click', ()=>{
      const o=readCode(inp.value);
      if(!o){ ready=null; r.textContent='RESTORE'; msg2.textContent='This code is not right. Copy the whole code and try again.'; return; }
      if(ready!==inp.value){ ready=inp.value; r.textContent='YES, REPLACE'; msg2.textContent=summary(o)+'. This replaces everything on this phone.'; return; }
      apply(o); location.reload();
    });
    wrap.append(el('p','','Your progress lives only on this phone. If you delete the app icon, it can be lost. Keep this code to bring it back.'),
      area, row, msg, el('div','sp-label','BRING BACK'), inp, r, msg2);
    JPI.modal('BACKUP', wrap);
  }

  window.PBDaily = { on, save, label, open, init(fn){ earn=fn; state(); } };
  window.PBBackup = { open:openBackup, makeCode, readCode };
})();
