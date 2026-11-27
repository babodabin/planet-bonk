// Planet Bonk — 별가루 · 키우기 · 나의 공간(MY SPACE)
// 게임(index.html)이 PBSpace.init(api)로 행성 그리기 함수 등을 넘겨줌
(function(){
  // ───────── 저장 ─────────
  const K = { dust:'pb-dust', lv:'pb-lv', skin:'pb-skin', ships:'pb-ships', oldGrow:'pb-grow' };
  function load(key, fallback){
    try{ const v=JSON.parse(localStorage.getItem(key)); return v===null || v===undefined ? fallback : v; }catch(e){ return fallback; }
  }
  function store(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch(e){} }
  const asObj = v => v && typeof v==='object' && !Array.isArray(v) ? v : {};
  let dust = Math.max(0, Math.floor(Number(load(K.dust,0))||0));
  let lv = asObj(load(K.lv,{})), skin = asObj(load(K.skin,{})), ships = asObj(load(K.ships,{}));
  let dirty = false;
  function save(){ if(!dirty) return; dirty=false; store(K.dust, dust); store(K.ships, ships); }

  // v1.3에서 박치기로 키운 레벨을 그대로 옮겨 옴 (한 번만)
  (function migrate(){
    const g = load(K.oldGrow, null);
    if(!Array.isArray(g)) return;
    const steps=[10,30,80,200], ease=[1,1,0.8,0.7,0.6,0.5,0.4,0.3,0.2,0.1];
    g.forEach((n,t)=>{
      let l=1; for(let i=0;i<4;i++) if(n>=Math.ceil(steps[i]*ease[t])) l=i+2;
      if(l>(lv['p'+t]||1)) lv['p'+t]=l;
    });
    store(K.lv, lv);
    try{ localStorage.removeItem(K.oldGrow); }catch(e){}
  })();

  // ───────── 우주선과 특별한 것 (게임 중에 지나감) ─────────
  const SHIPS = {
    sputnik:{ name:'Sputnik 1', type:'First satellite · 1957', fact:'Sputnik 1 was the first satellite people ever put into orbit.' },
    apollo: { name:'Apollo 11', type:'Crewed Moon mission · 1969', fact:'Apollo 11 carried the first people to walk on the Moon.' },
    voyager:{ name:'Voyager 1', type:'Space probe · 1977', fact:'Voyager 1 is farther from Earth than anything else people have made.' },
    hubble: { name:'Hubble', type:'Space telescope · 1990', fact:'Hubble has photographed space from Earth orbit since 1990.' },
    iss:    { name:'Space Station', type:'International Space Station', fact:'People have lived on the International Space Station without a break since 2000.' },
    webb:   { name:'James Webb', type:'Space telescope · 2021', fact:'The James Webb telescope works about 1.5 million km away from Earth.' },
    rocket: { name:'Reusable Rocket', type:'Modern rocket', fact:'A reusable rocket can land its booster and fly it again.' },
    halley: { name:"Halley's Comet", type:'Comet', fact:"Halley's Comet comes back about every 76 years. Next time: 2061." }
  };
  const SHIP_IDS = Object.keys(SHIPS), SHIP_MAX=3;

  // ───────── 위성: 행성을 키우면 하나씩 생김 (수성·금성은 실제로 위성이 없음) ─────────
  const MOONS = {
    p2:[['Phobos','#9a8678','Phobos is slowly moving closer to Mars.'],['Deimos','#b5a596','Deimos is the smaller of the two moons of Mars.']],
    p5:[['Triton','#d9c9c4','Triton orbits Neptune backwards.']],
    p6:[['Titania','#b9b2ad','Titania is the largest moon of Uranus.'],['Miranda','#cfd3d6','Miranda has some of the tallest cliffs known.']],
    p7:[['Titan','#e0b25a','Titan has a thick atmosphere.'],['Rhea','#c9c9c9',"Rhea is Saturn's second-largest moon."],['Enceladus','#f2f7fa','Enceladus sprays water ice into space.']],
    p8:[['Io','#e6d36a','Io is the most volcanic world we know.'],['Europa','#d8cdbd','Europa probably hides an ocean under its ice.'],['Ganymede','#a99c8c','Ganymede is the largest moon in the solar system.'],['Callisto','#7d7468','Callisto is covered in craters.']]
  };

  // ───────── 먼 천체(왜소행성) · 다른 우주의 행성. tier는 빌려 쓰는 표면, tint는 색 ─────────
  const FAR = [
    { id:'pluto', name:'Pluto', tier:0, tint:[1.12,0.98,0.82], at:[0.09,0.07], type:'Dwarf planet', size:'About 0.19× as wide as Earth', facts:['Pluto has a heart-shaped plain of ice.','One trip around the Sun takes Pluto about 248 Earth years.'] },
    { id:'eris', name:'Eris', tier:0, tint:[1.05,1.08,1.15], at:[0.92,0.06], type:'Dwarf planet', size:'About 0.18× as wide as Earth', facts:['Finding Eris in 2005 led to the new group called dwarf planets.'] },
    { id:'haumea', name:'Haumea', tier:0, tint:[0.95,1,1.1], at:[0.08,0.95], type:'Dwarf planet', size:'About 0.13× as wide as Earth', facts:['Haumea spins so fast that it is shaped like an egg.'] },
    { id:'makemake', name:'Makemake', tier:1, tint:[1.25,0.95,0.8], at:[0.93,0.94], type:'Dwarf planet', size:'About 0.11× as wide as Earth', facts:['Makemake is one of the brightest objects beyond Neptune.'] }
  ];
  const EXO = [
    ['b',1,[1.2,0.8,0.65],'1.1','1.5'],['c',3,[1,0.8,0.7],'1.1','2.4'],['d',2,[0.8,0.85,1.1],'0.8','4'],
    ['e',4,[0.85,1,0.9],'0.9','6'],['f',5,[0.8,1.15,1.1],'1.0','9'],['g',6,[0.75,0.85,1],'1.1','12'],['h',0,[0.85,0.95,1.2],'0.8','19']
  ].map(([c,tier,tint,w,days],i)=>({ id:'t1'+c, name:'TRAPPIST-1 '+c, tier, tint, type:'Exoplanet · '+(i+1)+(['st','nd','rd'][i]||'th')+' from its star',
    size:'About '+w+'× as wide as Earth', facts:['A year here lasts about '+days+' Earth days.','Its real colors are unknown. This look is imaginary.'] }));

  const WORLDS = [
    { id:'solar', name:'SOLAR SYSTEM' },
    { id:'trappist', name:'TRAPPIST-1 SYSTEM', about:'A real star with seven planets, about 40 light-years away.' },
    { id:'nebula', name:'ORION NEBULA', about:'A cloud where new stars are born.' },
    { id:'core', name:'GALAXY CENTER', about:'A giant black hole in the middle of the Milky Way.' }
  ];

  // ───────── 키우기 규칙 ─────────
  const EARTH = 'p4';
  const STEP = [20,40,80,150,220,300,400,500,650];
  const FIND_FAR = 60, FIND_EXO = 100;
  // 게임에서 만나기 어려운 큰 행성은 별가루로도 찾을 수 있음 (막다른 길 방지)
  const FIND_PLANET = [0,40,60,80,0,150,200,250,300,400];
  let api = null;
  function maxLv(id){ return id===EARTH ? 10 : SHIPS[id] ? SHIP_MAX : FAR.some(f=>f.id===id) ? 3 : 5; }
  function levelOf(id){ return Math.min(maxLv(id), Math.max(1, lv[id]||1)); }
  function costOf(id){
    const l=levelOf(id);
    if(l>=maxLv(id)) return 0;
    if(SHIPS[id] || FAR.some(f=>f.id===id)) return [30,60][l-1];
    return Math.ceil(STEP[l-1]*(EXO.some(e=>e.id===id) ? 1.5 : 1));
  }
  function found(id){
    if(/^p\d$/.test(id)) return id===EARTH || api.isFound(+id[1]);
    if(SHIPS[id]) return (ships[id]||0)>0;
    return !!lv[id];
  }
  // 키운 보람
  function bonkBonus(t){ return Math.floor((levelOf('p'+t)-1)/2); }
  function shipBonus(id){ return (levelOf(id)-1)*5; }
  function shieldsAt(l){ return l>=8 ? 2 : l>=4 ? 1 : 0; }
  function perk(id){
    if(SHIPS[id]){ const b=shipBonus(id); return 'Bonus: +'+b+' ✦ each time you hit it'+(levelOf(id)<SHIP_MAX ? '. Next: +'+(b+5) : ''); }
    if(!/^p\d$/.test(id)) return '';
    const t=+id[1], l=levelOf(id), cap=Math.floor((maxLv(id)-1)/2), b=bonkBonus(t);
    let s='Bonus: +'+b+' ✦ each '+api.PLANETS[t].name+' bonk'+(b<cap ? '. Next at LV '+(b*2+3) : '');
    if(id===EARTH){ const n=shieldsAt(l); s+='\nShields each game: '+n+(n<2 ? '. Next at LV '+(n ? 8 : 4) : ''); }
    return s;
  }
  function spend(n){ if(dust<n) return false; dust-=n; dirty=true; save(); return true; }
  function earn(n){ dust+=n; dirty=true; }
  function grow(id){
    const c=costOf(id);
    if(!c || !spend(c)) return false;
    lv[id]=levelOf(id)+1; store(K.lv, lv);
    return true;
  }
  function solarProgress(){ let n=0; for(let t=0;t<10;t++) if(api.isFound(t)) n+=Math.min(5, levelOf('p'+t)); return n; }
  function exoProgress(){ let n=0; for(const e of EXO) if(found(e.id)) n+=levelOf(e.id); return n; }
  function worldState(i){
    if(i===0) return { open:true };
    if(i===1){ const n=solarProgress(); return { open:n>=50, n, of:50, text:'Grow all 10 planets to LV 5 to open' }; }
    const n=exoProgress();
    if(i===2) return { open:false, n, of:35, text:'Grow all 7 planets of TRAPPIST-1 to LV 5 to open' };
    return { open:false, text:'Open ORION NEBULA first' };
  }

  // ───────── 우주선 그리기 (로고 없이 단순한 모양). 가운데가 원점, s = 절반 크기 ─────────
  function drawShip(c, id, s, t){
    c.save(); c.lineWidth=Math.max(0.8,s*0.1); c.lineCap='round'; c.strokeStyle='#d5dada'; c.fillStyle='#aab2b8';
    const line=(x1,y1,x2,y2)=>{ c.beginPath(); c.moveTo(x1*s,y1*s); c.lineTo(x2*s,y2*s); c.stroke(); };
    const box=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x*s,y*s,w*s,h*s); };
    const disc=(x,y,r,col)=>{ c.fillStyle=col; c.beginPath(); c.arc(x*s,y*s,r*s,0,Math.PI*2); c.fill(); };
    if(id==='sputnik'){
      line(-0.1,-0.1,-1,-0.7); line(-0.1,0.1,-1,0.7); line(0,-0.2,-0.9,-0.95); line(0,0.2,-0.9,0.95);
      disc(0.2,0,0.45,'#c3c9ce'); disc(0.05,-0.15,0.12,'#f2f5f7');
    }else if(id==='apollo'){
      box(-0.6,-0.3,0.9,0.6,'#b9bfc4');
      c.fillStyle='#8d959b'; c.beginPath(); c.moveTo(0.3*s,-0.3*s); c.lineTo(0.95*s,0); c.lineTo(0.3*s,0.3*s); c.fill();
      c.fillStyle='#6b7278'; c.beginPath(); c.moveTo(-0.6*s,-0.12*s); c.lineTo(-0.95*s,-0.3*s); c.lineTo(-0.95*s,0.3*s); c.lineTo(-0.6*s,0.12*s); c.fill();
    }else if(id==='voyager'){
      line(0,0,-1,0.75); line(0,0,0.9,0.7); line(0,0,-0.3,0.95);
      c.fillStyle='#e3e7ea'; c.beginPath(); c.ellipse(0.05*s,-0.15*s,0.62*s,0.3*s,-0.25,0,Math.PI*2); c.fill();
      disc(0.05,-0.15,0.1,'#8d959b'); box(-0.18,0.1,0.36,0.22,'#c4a45a');
    }else if(id==='hubble'){
      box(-0.85,-0.26,1.5,0.52,'#b9bfc4'); box(0.65,-0.2,0.25,0.4,'#7d858b');
      box(-0.3,-0.95,0.4,0.6,'#4a78b8'); box(-0.3,0.35,0.4,0.6,'#4a78b8');
    }else if(id==='iss'){
      line(-1,0,1,0); box(-0.3,-0.16,0.6,0.32,'#c3c9ce'); box(-0.08,-0.5,0.16,1,'#aab2b8');
      for(const x of [-0.95,-0.62,0.42,0.75]){ box(x,-0.75,0.2,0.65,'#b98d3e'); box(x,0.1,0.2,0.65,'#b98d3e'); }
    }else if(id==='webb'){
      c.fillStyle='#8fa0b8'; c.beginPath(); c.moveTo(-1*s,0.45*s); c.lineTo(0,0.2*s); c.lineTo(1*s,0.45*s); c.lineTo(0,0.75*s); c.fill();
      c.fillStyle='#e3b64a';
      for(const [x,y] of [[0,-0.75],[-0.36,-0.54],[0.36,-0.54],[-0.36,-0.12],[0.36,-0.12],[0,0.09],[0,-0.33]]){
        c.beginPath(); for(let i=0;i<6;i++) c.lineTo((x+Math.cos(i*Math.PI/3)*0.2)*s, (y+Math.sin(i*Math.PI/3)*0.2)*s); c.fill();
      }
    }else if(id==='rocket'){
      const f=0.25+0.12*Math.sin((t||0)*18);
      c.fillStyle='#ff9d3c'; c.beginPath(); c.moveTo(-0.6*s,-0.14*s); c.lineTo((-0.75-f)*s,0); c.lineTo(-0.6*s,0.14*s); c.fill();
      c.fillStyle='#e3e7ea'; c.beginPath(); c.moveTo(-0.6*s,-0.2*s); c.lineTo(0.5*s,-0.2*s); c.quadraticCurveTo(0.9*s,-0.12*s,1*s,0); c.quadraticCurveTo(0.9*s,0.12*s,0.5*s,0.2*s); c.lineTo(-0.6*s,0.2*s); c.fill();
      c.fillStyle='#7d858b'; c.beginPath(); c.moveTo(-0.6*s,-0.2*s); c.lineTo(-0.8*s,-0.5*s); c.lineTo(-0.3*s,-0.2*s); c.moveTo(-0.6*s,0.2*s); c.lineTo(-0.8*s,0.5*s); c.lineTo(-0.3*s,0.2*s); c.fill();
    }else{ // 핼리 혜성
      const g=c.createLinearGradient(0.5*s,0,-1.9*s,0); g.addColorStop(0,'rgba(190,225,255,0.75)'); g.addColorStop(1,'rgba(120,180,255,0)');
      c.fillStyle=g; c.beginPath(); c.moveTo(0.5*s,-0.28*s); c.lineTo(-1.9*s,-0.6*s); c.lineTo(-1.9*s,0.6*s); c.lineTo(0.5*s,0.28*s); c.fill();
      disc(0.5,0,0.32,'#eaf5ff');
    }
    c.restore();
  }

  // ───────── 색 바꾸기: 원래 색 / 어스름(LV3) / 희귀(LV5). MY SPACE에서만 보임 ─────────
  const SKINS = [['NATURAL',1],['DUSK',3],['RARE',5]];
  function recolor(tex, fn){
    const d=new Uint8ClampedArray(tex.data.length), s=tex.data;
    for(let i=0;i<s.length;i+=4){ const o=fn(s[i],s[i+1],s[i+2]); d[i]=o[0]; d[i+1]=o[1]; d[i+2]=o[2]; d[i+3]=255; }
    return { data:d, w:tex.w, h:tex.h };
  }
  const texCache = new Map();
  function texFor(b, sk){
    const key=b.id+':'+sk;
    if(texCache.has(key)) return texCache.get(key);
    let tex=api.texture(b.tier);
    if(b.tint) tex=recolor(tex,(r,g,bl)=>[r*b.tint[0],g*b.tint[1],bl*b.tint[2]]);
    if(sk===1) tex=recolor(tex,(r,g,bl)=>[r*0.62,g*0.48,bl*0.85]);
    if(sk===2) tex=recolor(tex,(r,g,bl)=>[bl*0.9+g*0.1,r*0.75+g*0.25,r*0.35+bl*0.4+g*0.35]);
    texCache.set(key, tex);
    return tex;
  }
  function skinOf(id){ const s=skin[id]||0; return SKINS[s] && levelOf(id)>=SKINS[s][1] ? s : 0; }
  function solarBody(t){ const f=api.FACTS[t]; return { id:'p'+t, tier:t, name:api.PLANETS[t].name, type:f.type, size:f.size, facts:f.facts }; }
  function bodyById(id){ return /^p\d$/.test(id) ? solarBody(+id[1]) : FAR.find(f=>f.id===id) || EXO.find(e=>e.id===id); }

  // ───────── 화면 ─────────
  const $ = id => document.getElementById(id);
  const ORBIT=[0,1,2,3,5,6,7,8,9];
  const R0=[7,8,9.5,11.5,30,14,15,15,19,21], T0=[16,22,28,34,0,42,50,58,66,76];
  let view=null, page=0, slide=0, lastS=0, raf=0, sprites=new Map();

  let buildBudget=1;   // 한 장면에 새로 만드는 행성 그림 수 (한꺼번에 만들면 화면이 굳음)
  function spriteFor(b, r){
    const sk=skinOf(b.id), key=b.id, old=sprites.get(key);
    if(old && old.r===r && old.sk===sk) return old;
    if(buildBudget<=0) return old || null;
    buildBudget--;
    const css=r*2*(b.tier===9 ? 1.75 : api.padOf(b.tier))/0.94;
    const cv=document.createElement('canvas');
    const s={ cv, css, r, sk, draw:api.planetPainter(cv, b.tier, css, true, texFor(b,sk)) };
    s.draw(0,0); sprites.set(key, s);
    return s;
  }
  function radius(base, id, k){ return base*k*(1+(id===EARTH ? 0.06 : 0.12)*(levelOf(id)-1)); }

  function build(){
    const el=$('space'), cv=$('space-cv'), d=Math.min(window.devicePixelRatio||1, 2);
    const vw=el.clientWidth, vh=el.clientHeight;
    cv.width=Math.round(vw*d); cv.height=Math.round(vh*d);
    const top=document.querySelector('.sp-top').getBoundingClientRect().bottom+8;
    const bottom=document.querySelector('.sp-bottom').getBoundingClientRect().top-30;
    const k=Math.max(0.6, Math.min(1.4, Math.min(vw/400, (bottom-top)/560)));
    // 배경 별은 1배 해상도로 한 번만 그려 두고 늘려 씀 (크게 그리면 여는 순간 굳음)
    const bg=document.createElement('canvas'); bg.width=Math.round(vw); bg.height=Math.round(vh);
    const c=bg.getContext('2d');
    c.fillStyle='#03050a'; c.fillRect(0,0,vw,vh);
    const rnd=api.seeded(21);
    for(let i=0;i<190;i++){
      c.fillStyle='rgba(255,255,255,'+(0.12+rnd()*0.5).toFixed(2)+')';
      c.beginPath(); c.arc(rnd()*vw, rnd()*vh, 0.3+rnd()*0.9, 0, Math.PI*2); c.fill();
    }
    view={ vw, vh, d, top, bottom, k, bg, cx:vw/2, cy:(top+bottom)/2,
      rx:Math.min(vw/2-34*k, 330), ry:0, hits:[], n:0 };
    view.ry=Math.min((bottom-top)/2-34*k, view.rx*1.5);
  }

  function ring(c, v, f, color, dashed){
    c.lineWidth=1; c.strokeStyle=color; c.setLineDash(dashed ? [3,6] : []);
    c.beginPath(); c.ellipse(v.cx, v.cy, v.rx*f, v.ry*f, 0, 0, Math.PI*2); c.stroke(); c.setLineDash([]);
  }
  function unknown(c, x, y, r){
    c.fillStyle='#0a0d0d'; c.strokeStyle='#333a3a'; c.lineWidth=1.2;
    c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); c.stroke();
    c.fillStyle='#667070'; c.font=Math.round(r*1.25)+'px "Special Elite", monospace'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('?', x, y+1);
  }
  function drawBody(c, o, s, n){
    const sp=spriteFor(o.b, o.r);
    if(!sp){ c.fillStyle=api.rgba(api.PLANETS[o.b.tier].color,0.35); c.beginPath(); c.arc(o.x,o.y,o.r,0,Math.PI*2); c.fill(); return; }
    if((n+o.b.tier)%3===0) sp.draw(s/(api.PERIOD[o.b.tier]||40), s);
    const list=(MOONS[o.b.id]||[]).slice(0, levelOf(o.b.id)-1);
    const moons=list.map((m,i)=>{ const a=s/(4+i*2.3)*Math.PI*2+i*2, q=o.r*1.55+i*4.5*view.k; return { x:o.x+Math.cos(a)*q, y:o.y+Math.sin(a)*q*0.4, back:Math.sin(a)<0, col:m[1] }; });
    const dot=m=>{ c.fillStyle=m.col; c.beginPath(); c.arc(m.x,m.y,Math.max(1.3,1.9*view.k),0,Math.PI*2); c.fill(); };
    moons.filter(m=>m.back).forEach(dot);
    c.drawImage(sp.cv, o.x-sp.css/2, o.y-sp.css/2, sp.css, sp.css);
    moons.filter(m=>!m.back).forEach(dot);
  }

  function drawSolar(c, s, hits){
    const v=view, all=[];
    ORBIT.forEach((t,i)=>{
      const f=0.36+0.64*i/(ORBIT.length-1), id='p'+t, ok=found(id);
      ring(c, v, f, ok ? api.rgba(api.PLANETS[t].color,0.2) : 'rgba(255,255,255,0.06)', !ok);
      const a=i*2.4+s/T0[t]*Math.PI*2;
      all.push({ id, b:solarBody(t), ok, r:radius(R0[t], id, v.k), x:v.cx+Math.cos(a)*v.rx*f, y:v.cy+Math.sin(a)*v.ry*f });
    });
    all.push({ id:EARTH, b:solarBody(4), ok:true, r:radius(R0[4], EARTH, v.k), x:v.cx, y:v.cy });
    // 먼 천체: 궤도 바깥 구석에 작고 어둡게
    for(const b of FAR){
      const x=v.vw*b.at[0]+Math.sin(s*0.1+b.at[1]*9)*2, y=v.top+(v.bottom-v.top)*b.at[1], ok=found(b.id);
      const r=3.6*v.k*(1+0.22*(levelOf(b.id)-1));
      if(ok){ c.save(); c.globalAlpha*=0.75; drawBody(c, { b, r, x, y }, s, v.n); c.restore(); }
      else unknown(c, x, y, 6);
      hits.push({ kind:'body', id:b.id, x, y, r:Math.max(r,8) });
    }
    // 내 우주선: 평소에는 지구 옆을 돌고, 탐험 중에는 목적지까지 갔다가 돌아옴
    {
      const er=radius(R0[4], EARTH, v.k), a=s*0.35, size=13*v.k*(1+0.05*(PBShip.level()-1));
      const home=q=>[v.cx+Math.cos(q)*(er+22*v.k), v.cy+Math.sin(q)*(er*0.55+14*v.k)];
      let [x,y]=home(a), [nx,ny]=home(a+0.05);
      const to=PBShip.tripTo(), hit=to && (all.find(o=>o.id===to) || hits.find(h=>h.id===to)), pr=PBShip.progress();
      if(hit && !PBShip.ready()){
        const k=1-Math.abs(pr*2-1), hx=x, hy=y, dir=pr<0.5 ? 1 : -1;
        nx=(hit.x-hx)*dir; ny=(hit.y-hy)*dir; x=hx+(hit.x-hx)*k; y=hy+(hit.y-hy)*k; nx+=x; ny+=y;
      }
      all.push({ id:'myship', ok:true, x, y, r:size, paint(){
        c.save(); c.translate(x,y); if(!PBShip.upright()) c.rotate(Math.atan2(ny-y,nx-x)+Math.PI/2); PBShip.draw(c, size, s, false); c.restore();
        if(PBShip.ready()){ c.fillStyle='#ffd98a'; c.font='18px "Special Elite", monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('!', x, y-size-9); }
      } });
    }
    all.sort((p,q)=>p.y-q.y);
    for(const o of all){
      if(o.paint){ o.paint(); hits.push({ kind:'myship', id:'myship', x:o.x, y:o.y, r:Math.max(o.r,14) }); continue; }
      if(o.ok) drawBody(c, o, s, v.n); else unknown(c, o.x, o.y, 8.5);
      hits.push({ kind:'body', id:o.id, x:o.x, y:o.y, r:o.ok ? o.r : 9 });
    }
    // 잡은 우주선이 조용히 날아다님
    SHIP_IDS.forEach((id,i)=>{
      if(!found(id)) return;
      const w=0.045+0.007*i, p=i*1.9, size=(8+i%3)*v.k*(1+0.3*(levelOf(id)-1));
      const pos=q=>[v.cx+Math.cos(q*w*1.7+p)*v.rx*(0.55+0.4*Math.sin(p)), v.cy+Math.sin(q*w*2.3+p*1.3)*v.ry*0.92];
      const [x,y]=pos(s), [x2,y2]=pos(s+0.2);
      c.save(); c.translate(x,y); c.rotate(Math.atan2(y2-y,x2-x)); drawShip(c, id, size, s); c.restore();
      hits.push({ kind:'ship', id, x, y, r:Math.max(size,11) });
    });
  }

  function drawTrappist(c, s, open, hits){
    const v=view, R=24*v.k;
    const g=c.createRadialGradient(v.cx,v.cy,R*0.3,v.cx,v.cy,R*2.6);
    g.addColorStop(0,'rgba(255,110,70,0.55)'); g.addColorStop(1,'rgba(120,20,0,0)');
    c.fillStyle=g; c.beginPath(); c.arc(v.cx,v.cy,R*2.6,0,Math.PI*2); c.fill();
    c.fillStyle='#e0603c'; c.beginPath(); c.arc(v.cx,v.cy,R,0,Math.PI*2); c.fill();
    EXO.forEach((b,i)=>{
      const f=0.34+0.6*i/6, a=i*2.1+s/(14+i*7)*Math.PI*2, ok=!open || found(b.id);
      ring(c, v, f, 'rgba(255,150,120,0.14)', !ok);
      const x=v.cx+Math.cos(a)*v.rx*f, y=v.cy+Math.sin(a)*v.ry*f, r=radius(11, b.id, v.k);
      if(ok) drawBody(c, { b, r, x, y }, s, v.n); else unknown(c, x, y, 8.5);
      hits.push({ kind:'body', id:b.id, x, y, r:Math.max(r,9) });
    });
  }
  function drawNebula(c, s){
    const v=view, rnd=api.seeded(77);
    for(let i=0;i<14;i++){
      const a=rnd()*6.28, q=rnd()*0.75, x=v.cx+Math.cos(a)*v.rx*q, y=v.cy+Math.sin(a)*v.ry*q*0.7, r=(50+rnd()*80)*v.k;
      const col=['190,70,140','90,80,190','60,130,170','200,110,80'][i%4], al=0.10+0.025*Math.sin(s*0.5+i);
      const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'rgba('+col+','+al.toFixed(3)+')'); g.addColorStop(1,'rgba('+col+',0)');
      c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill();
    }
    for(let i=0;i<26;i++){ c.fillStyle='rgba(255,255,255,'+(0.3+rnd()*0.5).toFixed(2)+')'; c.beginPath(); c.arc(v.cx+(rnd()-0.5)*v.rx*1.5, v.cy+(rnd()-0.5)*v.ry*1.2, 0.6+rnd()*1.3, 0, 6.28); c.fill(); }
  }
  function drawCore(c, s){
    const v=view, R=46*v.k;
    c.save(); c.translate(v.cx,v.cy); c.rotate(-0.25); c.scale(1,0.34);
    for(let i=0;i<7;i++){ c.strokeStyle='rgba(255,'+(150+i*10)+',80,'+(0.34-i*0.04).toFixed(2)+')'; c.lineWidth=7*v.k; c.setLineDash([60+i*14,10+i*3]); c.lineDashOffset=-s*(26-i*3); c.beginPath(); c.arc(0,0,R*(1.35+i*0.2),0,6.28); c.stroke(); }
    c.restore();
    c.fillStyle='#000'; c.beginPath(); c.arc(v.cx,v.cy,R,0,6.28); c.fill();
    c.strokeStyle='rgba(255,200,140,0.65)'; c.lineWidth=2; c.beginPath(); c.arc(v.cx,v.cy,R*1.03,0,6.28); c.stroke();
  }

  let lastFrame=0;
  function frame(now){
    if(!view) return;
    raf=requestAnimationFrame(frame);
    // 1초에 30번만 그림 (120Hz 폰에서 120번씩 그리면 뜨거워짐)
    if(now-lastFrame<32) return;
    lastFrame=now;
    const s=now/1000, v=view, c=$('space-cv').getContext('2d');
    v.n++; v.hits=[]; buildBudget=1;
    slide+=(page-slide)*(1-Math.exp(-Math.min(0.1,Math.max(0,s-lastS))*11)); lastS=s; if(Math.abs(page-slide)<0.002) slide=page;
    c.setTransform(1,0,0,1,0,0); c.drawImage(v.bg,0,0,v.bg.width*v.d,v.bg.height*v.d);
    for(let i=0;i<WORLDS.length;i++){
      const off=(i-slide)*v.vw;
      if(Math.abs(off)>=v.vw) continue;
      c.save(); c.setTransform(v.d,0,0,v.d,off*v.d,0);
      const open=worldState(i).open, hits=[];
      if(!open) c.globalAlpha=0.5;
      if(i===0) drawSolar(c, s, hits);
      else if(i===1) drawTrappist(c, s, open, hits);
      else if(i===2) drawNebula(c, s);
      else drawCore(c, s);
      c.restore();
      if(i===page && open) v.hits=hits;
    }
  }

  function renderTop(){
    $('sp-name').textContent=WORLDS[page].name;
    $('sp-dust').textContent='✦ '+dust+' STARDUST';
    const st=worldState(page), hint=$('sp-hint'), lock=$('sp-lock');
    hint.textContent = page===0 ? 'Tap your planets and ship. Swipe to see other worlds.' : WORLDS[page].about;
    lock.style.display = st.open ? 'none' : 'block';
    if(!st.open){
      lock.innerHTML='<b>LOCKED</b><span></span>'+(st.of ? '<div class="sp-bar"><i></i></div><em></em>' : '');
      lock.querySelector('span').textContent=st.text;
      if(st.of){
        lock.querySelector('i').style.width=Math.min(100,st.n/st.of*100)+'%';
        lock.querySelector('em').textContent=st.n+' / '+st.of+' levels';
      }
    }
    const dots=$('sp-dots'); dots.innerHTML='';
    WORLDS.forEach((w,i)=>{ const b=document.createElement('button'); b.type='button'; b.className=i===page?'on':''; b.setAttribute('aria-label', w.name); b.addEventListener('click', ()=>go(i)); dots.appendChild(b); });
  }
  function go(i){ page=Math.max(0, Math.min(WORLDS.length-1, i)); renderTop(); }

  // ───────── 창 ─────────
  const el=(tag, cls, text)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e; };
  function growButton(id, onDone){
    const box=el('div','sp-grow');
    function render(){
      box.innerHTML='';
      const l=levelOf(id), c=costOf(id);
      box.appendChild(el('div','','LV '+l+' / '+maxLv(id)));
      const pk=perk(id);
      if(pk){ const d=el('div','sp-perk',pk); d.style.whiteSpace='pre-line'; box.appendChild(d); }
      if(!c){ box.appendChild(el('div','sp-done','FULLY GROWN')); return; }
      const b=el('button','sp-buy','GROW  ✦ '+c); b.type='button'; b.disabled=dust<c;
      b.addEventListener('click', ()=>{ if(grow(id)){ api.sound(740,0.3,'sine',0.16); renderTop(); render(); if(onDone) onDone(); } });
      box.appendChild(b);
      box.appendChild(el('div','sp-have', dust<c ? 'You have ✦ '+dust+'. Play to collect '+(c-dust)+' more.' : 'You have ✦ '+dust));
    }
    render();
    return box;
  }
  function openBody(id){
    const b=bodyById(id), wrap=el('div','pb-card');
    const cv=document.createElement('canvas'); cv.style.width=cv.style.height='120px';
    const head=el('div','sp-fill'), extra=el('div','sp-fill');
    let stop=()=>{};
    const paint=()=>{ stop(); stop=api.spinner(cv, b.tier, 120, texFor(b, skinOf(id))); };
    wrap.append(cv, el('div','pb-name',b.name.toUpperCase()), el('div','pb-type',b.type), el('div','pb-size',b.size), head, extra);
    function renderExtra(){
      extra.innerHTML='';
      const sk=el('div','sp-skins');
      SKINS.forEach(([name,need],i)=>{
        if(need>maxLv(id)) return;
        const ok=levelOf(id)>=need, btn=el('button', skinOf(id)===i?'on':'', ok ? name : name+' · LV '+need);
        btn.type='button'; btn.disabled=!ok;
        btn.addEventListener('click', ()=>{ skin[id]=i; store(K.skin, skin); renderExtra(); paint(); });
        sk.appendChild(btn);
      });
      extra.appendChild(sk);
      const all=MOONS[id]||[];
      if(all.length){
        const list=el('div','pb-facts'); list.appendChild(el('div','sp-label','MOONS'));
        all.forEach((m,i)=>{ const ok=levelOf(id)>=i+2, p=el('p','', ok ? m[2] : '??? (LV '+(i+2)+')'); if(!ok) p.style.color='#667070'; list.appendChild(p); });
        extra.appendChild(list);
      }
      const facts=el('div','pb-facts');
      for(const f of b.facts) facts.appendChild(el('p','',f));
      extra.appendChild(facts);
    }
    head.appendChild(growButton(id, renderExtra));
    renderExtra();
    JPI.modal(id===EARTH ? 'MY PLANET' : 'MY SPACE', wrap, ()=>stop());
    paint();
  }
  function openUnknown(id){
    const wrap=el('div','pb-card'), cv=document.createElement('canvas'); cv.style.width=cv.style.height='90px';
    api.lockedIcon(cv, 90); wrap.appendChild(cv);
    const planet = /^p\d$/.test(id) ? +id[1] : -1;
    const price = planet>=0 ? FIND_PLANET[planet] : FAR.some(f=>f.id===id) ? FIND_FAR : FIND_EXO;
    let close=()=>{};
    if(planet>=0) wrap.appendChild(el('div','pb-fact', api.howToFind(planet)));
    if(price){
      wrap.appendChild(el('div','pb-fact', planet>=0 ? 'Or search with your telescope.' : 'Something is out there, far away. Search with your telescope?'));
      const box=el('div','sp-grow'), b=el('button','sp-buy','SEARCH  ✦ '+price); b.type='button'; b.disabled=dust<price;
      b.addEventListener('click', ()=>{ if(!spend(price)) return; if(planet>=0) api.markFound(planet); lv[id]=lv[id]||1; store(K.lv, lv); api.sound(880,0.25,'sine',0.16); renderTop(); close(); openBody(id); });
      box.append(b, el('div','sp-have', dust<price ? 'You have ✦ '+dust+'. Play to collect '+(price-dust)+' more.' : 'You have ✦ '+dust));
      wrap.appendChild(box);
    }
    close=JPI.modal('???', wrap);
  }
  function shipCanvas(id, css){
    const cv=document.createElement('canvas'), d=Math.min(window.devicePixelRatio||1,2);
    cv.style.width=cv.style.height=css+'px'; cv.width=cv.height=css*d;
    const c=cv.getContext('2d'); c.setTransform(d,0,0,d,css*d/2,css*d/2);
    drawShip(c, id, css*(id==='halley'?0.24:0.4), 0);
    return cv;
  }
  function openShip(id){
    const sh=SHIPS[id], wrap=el('div','pb-card');
    wrap.append(shipCanvas(id,120), el('div','pb-name',sh.name.toUpperCase()), el('div','pb-type',sh.type),
      growButton(id), el('div','pb-size','Caught '+ships[id]+(ships[id]===1?' time':' times')), el('div','pb-fact',sh.fact));
    JPI.modal('MY SPACE', wrap);
  }
  // 게임 중 처음 잡았을 때 보여 주는 카드
  function shipCard(id, onDone){
    const sh=SHIPS[id], wrap=el('div','pb-card');
    wrap.append(shipCanvas(id,130), el('div','pb-name',sh.name.toUpperCase()), el('div','pb-type',sh.type), el('div','pb-fact',sh.fact));
    JPI.modal('NEW DISCOVERY', wrap, onDone, 'CONTINUE');
  }

  // 지구를 누르면: 점수 → 내 행성 키우기
  function openEarth(){
    const wrap=el('div','pb-card'), rows=el('div','sp-rows');
    const set=(b,t,soft)=>{ b.textContent=t; b.className=soft?'soft':''; };
    const add=(label, value, soft)=>{ const r=el('div','sp-row'), b=document.createElement('b'); set(b,value,soft); r.append(el('span','',label), b); rows.appendChild(r); return b; };
    if(PBRank.getName()) add('Player', PBRank.getName());
    const saved=api.loadProgress(), last=load('pb-last',null);
    if(saved) add('Current game', (saved.popped||0)+' · LEVEL '+(saved.level||1));
    else if(last) add('Last game', last.s+' · LEVEL '+last.l);
    else add('Last game','None yet',true);
    add('My best', String(api.record()));
    const online=PBRank.enabled();
    for(const [which,label] of [['week','World rank, this week'],['all','World rank, all time']]){
      const b=add(label, online?'…':'Coming soon', true);
      if(!online) continue;
      const best=PBRank.myBest(which);
      if(!(best>0)){ set(b,'Not ranked yet',true); continue; }
      PBRank.rankOf(which,best).then(r=>set(b,'#'+r.rank,false)).catch(()=>set(b,'Offline',true));
    }
    const b=el('button','pb-back','ABOUT EARTH'); b.type='button';
    let close=()=>{};
    b.addEventListener('click', ()=>{ close(); openBody(EARTH); });
    wrap.append(rows, growButton(EARTH), b);
    close=JPI.modal('MY PLANET', wrap);
  }

  function tap(x, y){
    let best=null, bestD=1e9;
    for(const h of view.hits){ const q=Math.hypot(h.x-x,h.y-y)-h.r; if(q<12 && q<bestD){ best=h; bestD=q; } }
    if(!best) return;
    api.sound(520,0.1,'sine',0.1);
    if(best.kind==='myship') PBShip.panel();
    else if(best.kind==='ship') openShip(best.id);
    else if(best.id===EARTH) openEarth();
    else if(found(best.id)) openBody(best.id);
    else openUnknown(best.id);
  }

  function open(){
    if(view) return;
    save(); page=0; slide=0;
    renderTop(); $('space').classList.add('on');
    build();
    cancelAnimationFrame(raf); raf=requestAnimationFrame(frame);
  }
  function close(){
    view=null; cancelAnimationFrame(raf); sprites.clear();
    $('space').classList.remove('on'); api.onClose();
  }

  function init(a){
    api=a;
    PBShip.init({ sound:a.sound, dust:()=>dust, spend, found, earn(n){ earn(n); save(); }, changed:()=>{ if(view) renderTop(); } });
    $('sp-back').addEventListener('click', close);
    $('sp-guide').addEventListener('click', ()=>api.openGuide());
    window.addEventListener('resize', ()=>{ if(view) build(); });
    // 밀면 다른 우주, 누르면 선택
    const cv=$('space-cv'); let down=null, moved=false;
    cv.addEventListener('pointerdown', e=>{ down={ x:e.clientX, y:e.clientY }; });
    cv.addEventListener('pointercancel', ()=>{ down=null; });
    cv.addEventListener('pointerup', e=>{
      if(!down || !view) return;
      const dx=e.clientX-down.x, dy=e.clientY-down.y; down=null; moved=Math.hypot(dx,dy)>=14;
      if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)) go(page+(dx<0?1:-1));
    });
    cv.addEventListener('click', e=>{ if(view && !moved && !JPI.isOpen()) tap(e.clientX, e.clientY); moved=false; });
  }

  window.PBSpace = {
    init, open, save, earn, drawShip, shipCard, SHIP_IDS, SHIPS,
    dust:()=>dust, bonkBonus, shipBonus, shields:()=>shieldsAt(levelOf(EARTH)),
    // 우주선을 잡음. 처음이면 true
    catchShip(id){ const first=!ships[id]; ships[id]=(ships[id]||0)+1; dirty=true; return first; }
  };
})();
