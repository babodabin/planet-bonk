// Planet Bonk — 설정(배경음악·효과음·진동)과 안내 창
(function(){
  const KEYS = { music:'pb-music', sfx:'pb-sfx', vibe:'pb-vibe' };
  function on(name){ try{ return localStorage.getItem(KEYS[name])!=='off'; }catch(e){ return true; } }
  function set(name, val){ try{ localStorage.setItem(KEYS[name], val?'on':'off'); }catch(e){} }

  const canVibrate = typeof navigator!=='undefined' && typeof navigator.vibrate==='function';
  function vibrate(pattern){
    if(!canVibrate || !on('vibe')) return;
    try{ navigator.vibrate(pattern); }catch(e){}
  }

  let openCount = 0;
  function isOpen(){ return openCount>0; }

  const CSS = `
  .jpi-modal{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.82);padding:20px;}
  .jpi-box{width:min(88vw,340px);max-height:86vh;overflow-y:auto;touch-action:pan-y;
    background:#050505;border:2px solid rgba(255,255,255,0.85);border-radius:8px;
    box-shadow:0 0 18px rgba(255,255,255,0.3);padding:22px 20px 18px;
    display:flex;flex-direction:column;gap:18px;}
  .jpi-title{font-family:'Special Elite',monospace;color:#e8eaea;font-size:22px;letter-spacing:0.14em;
    text-align:center;text-shadow:0 0 12px rgba(255,255,255,0.3);}
  .jpi-list{display:flex;flex-direction:column;gap:12px;}
  .jpi-row{display:flex;justify-content:space-between;align-items:center;
    font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;font-size:15px;color:#c8cccc;}
  .jpi-toggle{font-family:'Special Elite',monospace;font-size:14px;letter-spacing:0.12em;min-width:80px;
    padding:7px 12px;border-radius:6px;border:1px solid #3a3f3f;background:transparent;color:#7a8080;cursor:pointer;}
  .jpi-toggle.on{color:#000;background:#e8eaea;border-color:#e8eaea;box-shadow:0 0 10px rgba(255,255,255,0.35);}
  .jpi-toggle:disabled{cursor:default;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;
    font-size:12px;letter-spacing:0;color:#5e6363;}
  .jpi-help{font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;font-size:14px;line-height:1.65;
    color:#c8cccc;display:flex;flex-direction:column;gap:9px;}
  .jpi-help p{position:relative;padding-left:14px;}
  .jpi-help p::before{content:'•';position:absolute;left:0;color:#6c7171;}
  .jpi-close{align-self:center;font-family:'Special Elite',monospace;font-size:15px;letter-spacing:0.16em;
    color:#000;background:#e8eaea;border:none;border-radius:4px;padding:9px 30px;cursor:pointer;
    box-shadow:0 0 14px rgba(255,255,255,0.35);}
  .jpi-extra{margin-top:6px;font-family:'Special Elite',monospace;font-size:14px;letter-spacing:0.14em;
    color:#c8cccc;background:transparent;border:1px solid #3a3f3f;border-radius:6px;padding:9px;cursor:pointer;}
  .jpi-close:active,.jpi-toggle:active,.jpi-extra:active{transform:translateY(1px);}
  `;
  function injectCss(){
    if(document.getElementById('jpi-modal-css')) return;
    const s=document.createElement('style'); s.id='jpi-modal-css'; s.textContent=CSS;
    document.head.appendChild(s);
  }

  function modal(title, body, onClose, closeLabel){
    injectCss();
    const back=document.createElement('div'); back.className='jpi-modal';
    const box=document.createElement('div'); box.className='jpi-box';
    const h=document.createElement('div'); h.className='jpi-title'; h.textContent=title;
    const close=document.createElement('button'); close.className='jpi-close'; close.textContent=closeLabel||'CLOSE';
    box.append(h, body, close);
    back.appendChild(box);
    openCount++;
    function done(){
      if(!back.parentNode) return;
      back.remove(); openCount--;
      if(onClose) onClose();
    }
    close.addEventListener('click', done);
    back.addEventListener('click', e=>{ if(e.target===back) done(); });
    document.body.appendChild(back);
    return done;
  }

  // onChange(name, value): 화면마다 배경음악을 켜고 끄는 등 즉시 반영할 일을 처리
  // help: { title, lines } 를 주면 맨 아래에 게임 방법 버튼이 생김
  function openSettings(onChange, help, extras){
    const list=document.createElement('div'); list.className='jpi-list';
    const rows=[['music','Music'],['sfx','Sound effects'],['vibe','Vibration']];
    for(const [key,label] of rows){
      const row=document.createElement('div'); row.className='jpi-row';
      const name=document.createElement('span'); name.textContent=label;
      const btn=document.createElement('button'); btn.className='jpi-toggle';
      const unsupported = key==='vibe' && !canVibrate;
      function render(){
        const v=on(key);
        btn.textContent = unsupported ? 'Not supported' : (v?'ON':'OFF');
        btn.classList.toggle('on', v && !unsupported);
      }
      if(unsupported) btn.disabled=true;
      btn.addEventListener('click', ()=>{
        const v=!on(key);
        set(key, v); render();
        if(key==='vibe' && v) vibrate(40);
        if(onChange) onChange(key, v);
      });
      render();
      row.append(name, btn);
      list.appendChild(row);
    }
    if(help){
      const b=document.createElement('button'); b.className='jpi-extra'; b.textContent=help.title;
      b.addEventListener('click', ()=>openHelp(help.title, help.lines));
      list.appendChild(b);
    }
    for(const x of extras||[]){
      const b=document.createElement('button'); b.className='jpi-extra'; b.textContent=x.title;
      b.addEventListener('click', x.run);
      list.appendChild(b);
    }
    return modal('SETTINGS', list);
  }

  function openHelp(title, lines, onClose){
    const body=document.createElement('div'); body.className='jpi-help';
    for(const line of lines){ const p=document.createElement('p'); p.textContent=line; body.appendChild(p); }
    return modal(title, body, onClose);
  }

  // 모드별로 처음 한 번만 자동 안내. 이미 봤으면 onClose를 바로 실행
  function helpOnce(id, title, lines, onClose){
    const key='pb-help-'+id;
    let seen=false;
    try{ seen = localStorage.getItem(key)==='1'; }catch(e){}
    if(seen){ if(onClose) onClose(); return false; }
    try{ localStorage.setItem(key, '1'); }catch(e){}
    openHelp(title, lines, onClose);
    return true;
  }

  window.JPI = { on, set, vibrate, canVibrate, isOpen, modal, openSettings, openHelp, helpOnce };
})();
