// Planet Bonk — 닉네임 · 전 세계 순위표 (Firebase)
// CONFIG가 비어 있으면 순위표는 꺼진 상태로 동작 (화면에 "준비 중"만 표시)
(function(){
  // Firebase 콘솔 → 프로젝트 설정 → 웹 앱의 firebaseConfig 값을 그대로 붙여 넣음
  const CONFIG = null;
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

  const NAME_KEY = 'pb-name';
  const BEST_KEY = 'pb-best';      // 순위표별 내 최고 점수 (불필요한 전송을 줄임)
  const TOP_N = 20;

  // ── 닉네임 규칙 ──
  // 영어·숫자·밑줄 3~12자. 욕설은 글자 바꿔치기(0→o, 1→i 등)까지 풀어서 검사
  // STRONG: 이름 어디에 들어 있어도 막음 / WORD: 따로 떨어진 단어일 때만 막음 (grape, title 같은 말은 통과)
  const STRONG = ['fuck','fuk','phuck','shit','cunt','nigg','bitch','whore','slut','rapist',
    'nazi','hitler','pussy','penis','vagina','porn','dildo','cock','dick','jizz','wank','twat','retard',
    'kike','chink','molest','sibal','ssibal','shibal','byungsin','gaesaki'];
  const WORD = ['ass','anal','tit','tits','cum','sex','kkk','isis','hoe','fck','fack','fuc','wtf','stfu','rape','fag','spic','pedo'];
  const RESERVED = ['admin','moderator','planetbonk','official','system'];
  function normalize(s){
    return s.toLowerCase()
      .replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e').replace(/4/g,'a')
      .replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
  }
  function validName(n){
    if(typeof n!=='string') return 'Enter a name.';
    n=n.trim();
    if(n.length<3) return 'Use at least 3 characters.';
    if(n.length>12) return 'Use 12 characters or fewer.';
    if(!/^[A-Za-z0-9_]+$/.test(n)) return 'Use only English letters, numbers and _';
    if(/^[0-9_]+$/.test(n)) return 'Add at least one letter.';
    const flat=normalize(n).replace(/_/g,'');
    const tokens=n.toLowerCase().split(/[_0-9]+/).concat(normalize(n).split(/_+/)).filter(Boolean);
    const bad = STRONG.some(w=>flat.includes(w))
      || WORD.some(w=>tokens.includes(w))
      || RESERVED.some(w=>flat.includes(w));
    if(bad) return 'Please choose a different name.';
    return '';
  }
  function getName(){ try{ return localStorage.getItem(NAME_KEY)||''; }catch(e){ return ''; } }

  // ── 주간 순위표 이름: ISO 주차(UTC 기준, 월요일 시작) 예) w2026-48 ──
  function weekKey(d){
    d = d ? new Date(d) : new Date();
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const wk = Math.ceil(((t - y0) / 86400000 + 1) / 7);
    return 'w' + t.getUTCFullYear() + '-' + String(wk).padStart(2,'0');
  }
  function boardId(which){ return which==='all' ? 'all' : weekKey(); }

  function loadBest(){ try{ return JSON.parse(localStorage.getItem(BEST_KEY))||{}; }catch(e){ return {}; } }
  function myBest(which){ return loadBest()[boardId(which)]||0; }
  function storeBest(id, score){
    const b=loadBest(); b[id]=score;
    // 지난 주 기록은 정리
    for(const k of Object.keys(b)) if(k!=='all' && k!==weekKey()) delete b[k];
    try{ localStorage.setItem(BEST_KEY, JSON.stringify(b)); }catch(e){}
  }

  // ── Firebase 연결 (처음 필요할 때 한 번만 불러옴) ──
  function firebaseBackend(cfg){
    let ready=null;
    function init(){
      if(ready) return ready;
      ready = (async()=>{
        const [appM, authM, fs] = await Promise.all([
          import(SDK+'firebase-app.js'), import(SDK+'firebase-auth.js'), import(SDK+'firebase-firestore-lite.js')
        ]);
        const app = appM.initializeApp(cfg);
        const auth = authM.getAuth(app);
        await auth.authStateReady();
        if(!auth.currentUser) await authM.signInAnonymously(auth);
        return { auth, fs, db: fs.getFirestore(app) };
      })();
      ready.catch(()=>{ ready=null; });   // 실패하면 다음에 다시 시도
      return ready;
    }
    const col = (c, id)=>c.fs.collection(c.db, 'boards', id, 'scores');
    const countFn = fs => fs.getCount || fs.getCountFromServer;
    return {
      async uid(){ const c=await init(); return c.auth.currentUser.uid; },
      async put(id, data){
        const c=await init();
        await c.fs.setDoc(c.fs.doc(col(c,id), c.auth.currentUser.uid),
          { name:data.name, score:data.score, level:data.level, ts:c.fs.serverTimestamp() });
      },
      async rename(id, name){
        const c=await init();
        await c.fs.updateDoc(c.fs.doc(col(c,id), c.auth.currentUser.uid), { name, ts:c.fs.serverTimestamp() });
      },
      async top(id, n){
        const c=await init(), fs=c.fs;
        const snap=await fs.getDocs(fs.query(col(c,id), fs.orderBy('score','desc'), fs.limit(n)));
        return snap.docs.map(d=>({ uid:d.id, ...d.data() }));
      },
      async countAbove(id, score){
        const c=await init(), fs=c.fs;
        const snap=await countFn(fs)(fs.query(col(c,id), fs.where('score','>',score)));
        return snap.data().count;
      },
      async nextAbove(id, score){
        const c=await init(), fs=c.fs;
        const snap=await fs.getDocs(fs.query(col(c,id), fs.where('score','>',score), fs.orderBy('score','asc'), fs.limit(1)));
        return snap.empty ? null : snap.docs[0].data().score;
      }
    };
  }

  let backend = CONFIG ? firebaseBackend(CONFIG) : null;
  function enabled(){ return !!backend; }

  // 인터넷이 끊겨 못 보낸 기록은 모아 뒀다가 다음에 보냄
  const PENDING_KEY = 'pb-rank-pending';
  function loadPending(){ try{ return JSON.parse(localStorage.getItem(PENDING_KEY))||[]; }catch(e){ return []; } }
  function savePending(p){ try{ localStorage.setItem(PENDING_KEY, JSON.stringify(p)); }catch(e){} }

  // 서버 규칙이 거절한 기록(이미 더 높은 기록이 있음 등)은 다시 보내지 않음
  const refused = e => e && e.code==='permission-denied';

  async function sendOne(id, score, level){
    const name=getName();
    if(!name) return false;
    const best=loadBest()[id]||0;
    if(score<=best) return true;
    await backend.put(id, { name, score, level });
    storeBest(id, score);
    return true;
  }

  // 게임이 끝났을 때 호출. 이번 주/전체 최고 기록을 넘었으면 올림
  async function submit(score, level){
    const out={ week:false, all:false, failed:false };
    if(!backend || !getName() || score<=0) return out;
    await flush();
    const pending=loadPending();
    for(const which of ['week','all']){
      const id=boardId(which);
      if(score<=myBest(which)) continue;
      try{ await sendOne(id, score, level); out[which]=true; }
      catch(e){ if(!refused(e)){ out.failed=true; pending.push({ id, score, level }); } }
    }
    savePending(pending.slice(-10));
    return out;
  }
  async function flush(){
    if(!backend) return;
    const left=[];
    for(const p of loadPending()){
      // 지난 주 기록은 그 주 순위표가 끝났으므로 버림 (전체 순위표 기록은 남김)
      if(p.id!=='all' && p.id!==weekKey()) continue;
      try{ await sendOne(p.id, p.score, p.level); }
      catch(e){ if(!refused(e)) left.push(p); }
    }
    savePending(left);
  }

  // 내 순위: 나보다 점수가 높은 사람 수 + 1 (같은 점수는 같은 순위)
  async function rankOf(which, score){
    if(!backend || score<=0) return null;
    const id=boardId(which);
    const [above, next] = await Promise.all([backend.countAbove(id, score), backend.nextAbove(id, score)]);
    return { rank: above+1, toNext: next==null ? 0 : next-score+1 };
  }

  async function top(which){
    if(!backend) return [];
    return backend.top(boardId(which), TOP_N);
  }

  async function setName(n){
    n=n.trim();
    const err=validName(n);
    if(err) throw new Error(err);
    const old=getName();
    try{ localStorage.setItem(NAME_KEY, n); }catch(e){}
    // 이미 순위표에 올라간 기록은 새 이름으로 바꿈
    if(backend && old && old!==n){
      for(const which of ['week','all']){
        if(myBest(which)>0){ try{ await backend.rename(boardId(which), n); }catch(e){} }
      }
    }
    return n;
  }

  async function myUid(){ return backend ? backend.uid() : ''; }

  window.PBRank = {
    enabled, validName, getName, setName, submit, flush, rankOf, top, myBest, myUid, weekKey, TOP_N,
    // 테스트용: 가짜 서버를 끼워 넣음
    useBackend(b){ backend=b; }
  };
})();
