// Planet Bonk — 내 우주선(MY SHIP): 별가루로 업그레이드하면 모양이 바뀌고, 점수와 능력이 커짐. 탐험도 보냄
(function(){
  const KEY='pb-ship', MAX=10;
  // 단계: [모양, 이름, 열리는 레벨, 박치기마다 덤 점수, 능력, 색]. 능력은 다음 단계에서도 계속 유지됨
  const STAGES=[
    { type:'satellite', name:'SATELLITE', lv:1,  score:0, power:'Starter ship', color:'#4a78b8' },
    { type:'rocket',    name:'ROCKET',    lv:3,  score:1, power:'POWER SHOT: shoots 25% harder', color:'#b5493a' },
    { type:'probe',     name:'PROBE',     lv:5,  score:2, power:'MAGNET: hits spacecraft from farther away, +5 points each', color:'#4a78b8' },
    { type:'shuttle',   name:'SHUTTLE',   lv:7,  score:3, power:'RESCUE: one extra shield every game', color:'#8a6bb5' },
    { type:'saucer',    name:'SAUCER',    lv:10, score:5, power:'SWAP: tap the launcher to swap with NEXT', color:'#5f9c6b' }
  ];
  const COST=[30,50,80,120,170,230,300,380,480];
  // 탐험: 멀수록 오래 걸리고 별가루를 많이 가져옴. 이미 찾은 곳만 갈 수 있음
  const TRIPS=[
    { id:'p0', name:'Moon', min:10, dust:8 },
    { id:'p2', name:'Mars', min:60, dust:25 },
    { id:'p8', name:'Jupiter', min:180, dust:50 },
    { id:'pluto', name:'Pluto', min:480, dust:90 }
  ];
  const PARTS={ 2:'Landing lights', 3:'Side boosters', 4:'Brighter engine', 5:'Antenna', 6:'Wing lights', 7:'Twin engine flame', 8:'Shield glow', 9:'Long antenna', 10:'Golden trim' };
  let api=null, st=null;

  function valid(v){
    return !!v && typeof v==='object' && Number.isInteger(v.lv) && v.lv>=1 && v.lv<=MAX
      && (v.trip===null || (!!v.trip && TRIPS.some(t=>t.id===v.trip.to) && Number.isFinite(v.trip.start) && v.trip.start>0 && v.trip.start<1e14));
  }
  try{ const v=JSON.parse(localStorage.getItem(KEY)); if(valid(v)) st={ lv:v.lv, trip:v.trip ? { to:v.trip.to, start:v.trip.start } : null }; }catch(e){}
  if(!st) st={ lv:1, trip:null };
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){} }
  function stageIx(lv){ let i=0; STAGES.forEach((x,k)=>{ if(lv>=x.lv) i=k; }); return i; }
  const stage=()=>STAGES[stageIx(st.lv)];
  const has=type=>st.lv>=STAGES.find(x=>x.type===type).lv;

  // ───────── 그리기: 위를 향한 모양, 가운데가 원점, s = 절반 높이 ─────────
  function draw(c, type, s, lv, col, t, boost){
    const gold=lv>=10, trim=gold ? '#e0b95a' : '#aab2b8';
    c.save(); c.lineCap='round'; c.lineJoin='round'; c.lineWidth=Math.max(0.8, s*0.07);
    const P=(...a)=>{ c.beginPath(); for(let i=0;i<a.length;i+=2) c.lineTo(a[i]*s, a[i+1]*s); c.closePath(); };
    const poly=(f,...a)=>{ c.fillStyle=f; P(...a); c.fill(); };
    const disc=(x,y,r,f)=>{ c.fillStyle=f; c.beginPath(); c.arc(x*s,y*s,r*s,0,Math.PI*2); c.fill(); };
    const oval=(x,y,a,b,f)=>{ c.fillStyle=f; c.beginPath(); c.ellipse(x*s,y*s,a*s,b*s,0,0,Math.PI*2); c.fill(); };
    const line=(x1,y1,x2,y2,f)=>{ c.strokeStyle=f||'#c9d0d4'; c.beginPath(); c.moveTo(x1*s,y1*s); c.lineTo(x2*s,y2*s); c.stroke(); };
    const flame=(x,y,w,k)=>{ const h=(0.28+0.06*Math.sin((t||0)*16+x*9))*(lv>=4?1.3:1)*(boost?1.9:1)*k; poly('#ff9d3c', x-w,y, x,y+h, x+w,y); poly('#ffe0a0', x-w*0.45,y, x,y+h*0.5, x+w*0.45,y); };
    if(lv>=8){ c.fillStyle='rgba(122,184,255,0.12)'; c.beginPath(); c.arc(0,0,s*1.15,0,Math.PI*2); c.fill(); }
    // 엔진 불꽃
    if(type==='rocket'){ if(lv>=7){ flame(-0.14,0.62,0.1,1); flame(0.14,0.62,0.1,1); } else flame(0,0.62,0.15,1); }
    if(type==='shuttle'){ if(lv>=7) flame(0,0.72,0.09,1.2); flame(-0.16,0.7,0.09,1); flame(0.16,0.7,0.09,1); }
    if(type==='probe'){ flame(0,0.5,0.1,lv>=7?1.3:0.9); }
    if(type==='satellite' && (boost || lv>=7)) flame(0,0.42,0.1,0.9);
    // 옆 보조 엔진 (LV 3)
    if(lv>=3 && type!=='saucer'){
      const x=type==='shuttle'?0.42:type==='probe'?0.3:0.46, y=type==='satellite'?0.12:0.28;
      for(const d of [-1,1]){ c.fillStyle=trim; c.fillRect((d*x-0.08)*s, y*s, 0.16*s, 0.36*s); poly(col, (d*x)-0.08,y, d*x,y-0.14, (d*x)+0.08,y); if(boost) flame(d*x, y+0.36, 0.07, 0.8); }
    }
    if(type==='rocket'){
      poly(col, -0.26,0.2, -0.56,0.72, -0.22,0.6); poly(col, 0.26,0.2, 0.56,0.72, 0.22,0.6);
      c.fillStyle='#dfe4e7'; c.beginPath(); c.moveTo(0,-1*s); c.bezierCurveTo(0.36*s,-0.6*s,0.36*s,0.1*s,0.26*s,0.64*s); c.lineTo(-0.26*s,0.64*s); c.bezierCurveTo(-0.36*s,0.1*s,-0.36*s,-0.6*s,0,-1*s); c.fill();
      c.fillStyle=col; c.beginPath(); c.moveTo(0,-1*s); c.quadraticCurveTo(0.2*s,-0.78*s,0.26*s,-0.52*s); c.lineTo(-0.26*s,-0.52*s); c.quadraticCurveTo(-0.2*s,-0.78*s,0,-1*s); c.fill();
      disc(0,-0.12,0.16,trim); disc(0,-0.12,0.11,'#3f6fa8');
      if(gold){ c.fillStyle=trim; c.fillRect(-0.28*s,0.44*s,0.56*s,0.08*s); }
    }else if(type==='satellite'){
      line(-0.2,0.2,-0.6,0.9); line(0.2,0.2,0.6,0.9); line(-0.1,0.25,-0.25,0.95); line(0.1,0.25,0.25,0.95);
      disc(0,-0.1,0.46,'#c3c9ce'); c.strokeStyle=col; c.lineWidth=s*0.1; c.beginPath(); c.moveTo(-0.45*s,-0.1*s); c.lineTo(0.45*s,-0.1*s); c.stroke();
      disc(-0.15,-0.28,0.1,'#f2f5f7'); if(gold){ c.strokeStyle=trim; c.lineWidth=s*0.07; c.beginPath(); c.arc(0,-0.1*s,0.46*s,0,Math.PI*2); c.stroke(); }
    }else if(type==='probe'){
      for(const d of [-1,1]){ c.fillStyle=col; c.fillRect((d>0?0.28:-0.92)*s,-0.22*s,0.64*s,0.4*s); c.strokeStyle='rgba(255,255,255,0.35)'; c.lineWidth=Math.max(0.5,s*0.03); for(const k of [0.21,0.43]){ c.beginPath(); c.moveTo(((d>0?0.28:-0.92)+k)*s,-0.22*s); c.lineTo(((d>0?0.28:-0.92)+k)*s,0.18*s); c.stroke(); } line(d*0.2,-0.02,d*0.28,-0.02); }
      c.fillStyle=gold?'#e0b95a':'#b99b58'; c.fillRect(-0.21*s,-0.3*s,0.42*s,0.8*s);
      oval(0,-0.46,0.44,0.19,'#dfe4e7'); disc(0,-0.5,0.07,'#8d959b'); line(0,-0.6,0,-0.86);
    }else if(type==='shuttle'){
      c.fillStyle='#dfe4e7'; c.beginPath(); c.moveTo(0,-1*s); c.bezierCurveTo(0.2*s,-0.78*s,0.24*s,-0.45*s,0.24*s,-0.1*s); c.lineTo(0.72*s,0.58*s); c.lineTo(0.24*s,0.72*s); c.lineTo(-0.24*s,0.72*s); c.lineTo(-0.72*s,0.58*s); c.lineTo(-0.24*s,-0.1*s); c.bezierCurveTo(-0.24*s,-0.45*s,-0.2*s,-0.78*s,0,-1*s); c.fill();
      poly(col, 0.72,0.58, 0.24,0.72, 0.24,0.46); poly(col, -0.72,0.58, -0.24,0.72, -0.24,0.46);
      poly('#33393f', 0,-1, 0.15,-0.74, -0.15,-0.74); c.fillStyle='#3f6fa8'; c.fillRect(-0.12*s,-0.6*s,0.24*s,0.12*s); line(0,0.2,0,0.7,trim);
    }else{
      if(boost || lv>=7){ c.fillStyle='rgba(111,208,138,'+(boost?0.35:0.16)+')'; P(-0.3,0.2, -0.55,0.95, 0.55,0.95, 0.3,0.2); c.fill(); }
      oval(0,-0.12,0.46,0.42,'#6aaec0'); oval(0,0.14,0.98,0.32,'#7d868d'); oval(0,0.06,0.98,0.25,gold?'#d8bd7a':'#c3c9ce'); oval(0,-0.02,0.46,0.14,col);
      for(const x of [-0.66,-0.24,0.24,0.66]) disc(x,0.22,0.07,lv>=2?'#ffd98a':'#5d666c');
    }
    // 단계별 장식
    if(lv>=2 && type!=='saucer'){ const on=Math.sin((t||0)*3)>0; disc(-0.1,0.36,0.05,on?'#ffd98a':'#6b5a30'); disc(0.1,0.36,0.05,on?'#ffd98a':'#6b5a30'); }
    if(lv>=5){ const top=type==='saucer'?-0.5:type==='satellite'?-0.54:type==='probe'?-0.84:-0.96, len=lv>=9?0.3:0.18; line(0,top,0,top-len,trim); disc(0,top-len,0.06,'#ff8d7a'); }
    if(lv>=6){ const x=type==='saucer'?0.95:type==='probe'?0.9:type==='shuttle'?0.68:type==='rocket'?0.5:0.42, y=type==='saucer'?0.08:type==='shuttle'?0.56:type==='rocket'?0.64:0; disc(-x,y,0.06,'#ff8d7a'); disc(x,y,0.06,'#8de0a0'); }
    c.restore();
  }
  function paint(cv, css, type, lv, col, t, boost){
    const d=Math.min(window.devicePixelRatio||1,2), px=Math.round(css*d);
    if(cv.width!==px){ cv.width=cv.height=px; cv.style.width=cv.style.height=css+'px'; }
    const c=cv.getContext('2d'); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,px,px);
    c.setTransform(d,0,0,d,css*d/2,css*d/2); draw(c, type, css*0.35, lv, col, t, boost);
  }
  // 게임 발사대에 그리는 작은 우주선
  function paintLauncher(cv, t, boost){ paint(cv, 34, stage().type, st.lv, stage().color, t, boost); }

  // ───────── 탐험 ─────────
  const tripInfo=()=>st && st.trip ? TRIPS.find(t=>t.id===st.trip.to) : null;
  function leftMs(){ const i=tripInfo(); if(!i) return 0; return Math.max(0, Math.min(i.min*60000, st.trip.start+i.min*60000-Date.now())); }
  const ready=()=>!!tripInfo() && leftMs()<=0;
  function progress(){ const i=tripInfo(); return i ? 1-leftMs()/(i.min*60000) : 0; }
  const reward=i=>Math.round(i.dust*(1+0.1*(st.lv-1)));
  function clock(ms){ const m=Math.ceil(ms/60000); return m>=60 ? Math.floor(m/60)+'h '+(m%60 ? (m%60)+'m' : '') : m+'m'; }

  // ───────── 창 ─────────
  const el=(tag, cls, text)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e; };
  function panel(){
    const wrap=el('div','pb-card'), cv=document.createElement('canvas'), body=el('div','sp-fill');
    let alive=true;
    const t0=performance.now();
    (function spin(){ if(!alive) return; paint(cv, 130, stage().type, st.lv, stage().color, (performance.now()-t0)/1000, false); requestAnimationFrame(spin); })();
    wrap.append(cv, body);
    let timer=0;
    function render(){
      clearTimeout(timer);
      body.innerHTML='';
      const me=stage();
      body.append(el('div','pb-name',me.name));
      const g=el('div','sp-grow'); g.append(el('div','','LV '+st.lv+' / '+MAX), el('div','sp-perk',(me.score ? '+'+me.score+(me.score===1?' point':' points')+' every bonk  ·  ' : '')+'Trips +'+(st.lv-1)*10+'% Stardust'));
      if(st.lv<MAX){
        const c=COST[st.lv-1], b=el('button','sp-buy','UPGRADE  ✦ '+c); b.type='button'; b.disabled=api.dust()<c;
        b.addEventListener('click', ()=>{ if(!api.spend(c)) return; const was=stage(); st.lv++; save(); api.sound(stage()!==was ? 990 : 740,0.35,'sine',0.16); api.changed(); render(); });
        g.append(b, el('div','sp-have', 'LV '+(st.lv+1)+': '+(STAGES.find(x=>x.lv===st.lv+1) ? 'becomes '+STAGES.find(x=>x.lv===st.lv+1).name : PARTS[st.lv+1])+'  ·  You have ✦ '+api.dust()));
      }else g.appendChild(el('div','sp-done','FULLY UPGRADED'));
      body.appendChild(g);
      // 단계 목록: 열린 능력과 앞으로 열릴 것
      const list=el('div','ms-list');
      STAGES.forEach((x,i)=>{
        const open=st.lv>=x.lv, row=el('div','ms-row'+(open?'':' off')+(x===me?' on':''));
        const c2=document.createElement('canvas'); paint(c2, 44, x.type, x.lv, open ? x.color : '#3a4246', 1, false);
        const tx=el('div','ms-tx'); tx.append(el('b','',x.name+'  ·  LV '+x.lv), el('span','',(x.score ? '+'+x.score+(x.score===1?' point':' points')+' every bonk. ' : '')+x.power));
        row.append(c2, tx); list.appendChild(row);
      });
      body.append(list);
      // 탐험
      const box=el('div','ms-trips'); box.appendChild(el('div','sp-label','TRIPS'));
      const now=tripInfo();
      if(now && ready()){
        const n=reward(now), b=el('button','sp-buy','COLLECT  ✦ '+n); b.type='button';
        b.addEventListener('click', ()=>{ if(!ready()) return; st.trip=null; save(); api.earn(n); api.sound(880,0.3,'sine',0.16); api.changed(); render(); });
        box.append(el('div','sp-have','Back from '+now.name+'!'), b);
      }else if(now){
        const bar=el('div','sp-bar'), f=el('i'); f.style.width=progress()*100+'%'; bar.appendChild(f);
        box.append(el('div','sp-have','On the way: '+now.name+'  ·  '+clock(leftMs())+' left'), bar);
        timer=setTimeout(()=>{ if(alive) render(); }, 5000);
      }else{
        for(const i of TRIPS){
          const ok=api.found(i.id), b=el('button','ms-trip'); b.type='button'; b.disabled=!ok;
          b.append(el('span','', ok ? i.name : '???  (not found yet)'), el('b','', clock(i.min*60000)+'  ✦ '+reward(i)));
          b.addEventListener('click', ()=>{ st.trip={ to:i.id, start:Date.now() }; save(); api.sound(420,0.5,'sine',0.14); api.changed(); render(); });
          box.appendChild(b);
        }
      }
      body.appendChild(box);
    }
    render();
    JPI.modal('MY SHIP', wrap, ()=>{ alive=false; clearTimeout(timer); });
  }

  window.PBShip={
    init(a){ api=a; }, panel, ready, progress, valid, paintLauncher,
    tripTo:()=>st.trip ? st.trip.to : '',
    level:()=>st.lv, upright:()=>stage().type==='saucer' || stage().type==='satellite',
    draw(c, s, t, boost){ draw(c, stage().type, s, st.lv, stage().color, t, boost); },
    // 게임에서 쓰는 능력
    bonkScore:()=>stage().score,
    shotPower:()=>has('rocket') ? 1.25 : 1,
    catchReach:()=>has('probe') ? 34 : 15,
    catchPoints:()=>has('probe') ? 5 : 3,
    extraShields:()=>has('shuttle') ? 1 : 0,
    canSwap:()=>has('saucer')
  };
})();
