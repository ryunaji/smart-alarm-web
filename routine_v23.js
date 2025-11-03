/* SMART ALARM — Routine Module v23 (Schedule Toggle + UX Flow) */
(function(){
  const LS_KEY = "smart_alarm_routines";
  const toKST = (d)=>new Date(d.getTime()+9*3600*1000);
const fmtKST = (iso)=>{
  const k=new Date(iso);
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")} ${String(k.getHours()).padStart(2,"0")}:${String(k.getMinutes()).padStart(2,"0")}`;
};
  const load=()=>JSON.parse(localStorage.getItem(LS_KEY)||"[]");
  const save=a=>localStorage.setItem(LS_KEY,JSON.stringify(a));
  const withinToday=(iso)=>{
    const now=toKST(new Date()),k=toKST(new Date(iso));
    return k.getFullYear()===now.getFullYear()&&k.getMonth()===now.getMonth()&&k.getDate()===now.getDate();
  };

  // 랜덤 응원 문구
  const MOTIVATION={
    SOFT:["오늘은 상쾌한 하루예요 🌞","기분 좋은 아침이에요 ✨","조용히 성공하는 하루 🌸"],
    MEDIUM:["조금 피곤하지만 잘 해냈어요 💪","꾸준함이 당신의 무기예요 🔥","천천히, 하지만 확실하게 ☕️"],
    HARD:["오늘 하루, 스스로를 칭찬해 주세요 💖","제 시간에 일어난 것만으로도 대단해요 🌈","힘든 아침을 이겨낸 당신, 최고예요 🏆"]
  };
  const randomMsg=(p)=>(MOTIVATION[p]||MOTIVATION.SOFT)[Math.floor(Math.random()*3)];

  function ensureUI(){
    if(document.getElementById("routineSection")) return;
    const host=document.querySelector(".container")||document.body;

    // 🟢 일정 유무 토글
    const toggleWrap=document.createElement("div");
    toggleWrap.className="toggle-section";
    toggleWrap.innerHTML=`
      <label style="font-family:'맑은 고딕';font-weight:bold;margin-right:6px;">📅 일정</label>
      <label class="switch">
        <input type="checkbox" id="routineToggle">
        <span class="slider"></span>
      </label>
      <span id="toggleText" style="margin-left:6px;">없음</span>
    `;
    host.insertBefore(toggleWrap, document.getElementById("setAlarm"));

    // 🩷 일정 입력 섹션
    const wrap=document.createElement("div");
    wrap.id="routineSection";
    wrap.className="routine-section";
    wrap.style.display="none";
    wrap.innerHTML=`
      ${[1,2,3].map(i=>`
        <div class="routine-item">
          <input type="datetime-local" id="routineDT${i}">
          <input type="text" id="routineText${i}" placeholder="예: 오전 러닝">
        </div>`).join("")}
      <button id="saveRoutines" class="btn-save-routine">💗 일정 저장</button>
      <div id="routineBoard" class="routine-board" style="display:none"></div>`;
    host.appendChild(wrap);

    // 토글 동작
    const toggle=document.getElementById("routineToggle");
    const toggleText=document.getElementById("toggleText");
    const setBtn=document.getElementById("setAlarm");

    toggle.addEventListener("change",()=>{
      if(toggle.checked){
        wrap.style.display="block";
        toggleText.innerText="있음";
        setBtn.disabled=true;
      }else{
        wrap.style.display="none";
        toggleText.innerText="없음";
        setBtn.disabled=false;
      }
    });

    document.getElementById("saveRoutines").onclick=()=>{
      const arr=[];
      for(let i=1;i<=3;i++){
        const dt=document.getElementById(`routineDT${i}`).value;
        const txt=document.getElementById(`routineText${i}`).value.trim();
        if(dt&&txt){
          const local=new Date(dt);
          const utcDate = new Date(dt + ":00");
          arr.push({iso:utcDate.toISOString(),text:txt});
        }
      }
      if(arr.length===0){alert("⚠️ 최소 1개 이상의 일정을 입력해주세요!");return;}
      save(arr);
      alert("✅ 일정이 저장되었습니다!");
      document.getElementById("setAlarm").disabled=false;
      renderBoard();
    };
  }

  function renderBoard(todayOnly=false){
    const board=document.getElementById("routineBoard");
    if(!board) return;
    const arr = load();
    const items=todayOnly?arr.filter(r=>withinToday(r.iso)):arr;
    if(!items.length){board.style.display="none";board.innerHTML="";return;}
    board.style.display="block";
    board.innerHTML=`
      <h4>${todayOnly?"☀️ 오늘 일정":"🗓 저장된 일정"}</h4>
      <ul style="margin:0;padding-left:18px">
        ${items.map(r=>`<li>${fmtKST(r.iso)} — ${r.text}</li>`).join("")}
      </ul>`;
  }

  // 폭죽 효과
  function fireworks(){
    const c=document.createElement("canvas");
    Object.assign(c.style,{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999});
    document.body.appendChild(c);
    const x=c.getContext("2d");c.width=innerWidth;c.height=innerHeight;
    const p=[];for(let i=0;i<120;i++)p.push({x:c.width/2,y:c.height/2,r:Math.random()*4+2,
      c:`hsl(${Math.random()*360},100%,70%)`,vx:(Math.random()-0.5)*7,vy:(Math.random()-0.5)*7,a:1});
    (function draw(){
      x.clearRect(0,0,c.width,c.height);
      p.forEach(q=>{q.x+=q.vx;q.y+=q.vy;q.vy+=0.07;q.a-=0.01;
        x.fillStyle=q.c;x.globalAlpha=Math.max(q.a,0);
        x.beginPath();x.arc(q.x,q.y,q.r,0,Math.PI*2);x.fill();});
      if(p.some(q=>q.a>0))requestAnimationFrame(draw);else c.remove();
    })();
  }

  // 반짝임 효과
  window.blinkEffect=function(profile){
    const b=document.body;let color;
    if(profile==="SOFT")color="#ffd6e8";
    else if(profile==="MEDIUM")color="#ff9ec4";
    else color="#ff597b";
    let on=true;
    const blink=setInterval(()=>{b.style.backgroundColor=on?color:"white";on=!on;},
      profile==="SOFT"?1000:profile==="MEDIUM"?500:300);
    setTimeout(()=>{clearInterval(blink);b.style.backgroundColor="white";},3000);
  }

  // 팝업
  function showPopup(){
    const arr = load();
    const p=window.currentProfile||"SOFT";
    const msg=randomMsg(p);
    const modal=document.createElement("div");
    modal.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9998;`;
    modal.innerHTML=`
      <div style="background:white;padding:20px 30px;border-radius:16px;max-width:420px;text-align:center;font-family:'맑은 고딕';box-shadow:0 4px 15px rgba(0,0,0,0.2);">
        <h2 style="color:#ff5c8a;margin-bottom:8px;">🎉 축하합니다!</h2>
        <p style="color:#ff7aa2;margin-bottom:12px;font-weight:bold;">${msg}</p>
        <ul style="list-style:none;padding:0;margin:0 0 12px 0;">
          ${arr.length?arr.map(r=>`<li>${fmtKST(r.iso)} — ${r.text}</li>`).join(""):"<li>등록된 일정이 없습니다.</li>"}
        </ul>
        <button id="closePopup" style="margin-top:10px;background:#ffafcc;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;">닫기</button>
      </div>`;
    document.body.appendChild(modal);
    fireworks();
    document.getElementById("closePopup").onclick=()=>modal.remove();
  }

  const orig={trigger:window.triggerAlarm,stop:window.stopAlarm};
  window.triggerAlarm=function(){
  try{ if(typeof startLog==='function'){ startLog(window.currentProfile||'SOFT'); } }catch(e){ console.warn('startLog hook fail', e); }

    renderBoard(true);
    if(orig.trigger) orig.trigger();
  
};
  window.stopAlarm=function(){
  try{
    // schedule link summary for logging
    var arr=[]; try{ arr = load().filter(function(r){return withinToday(r.iso);}); }catch(_e){}
    var linked = Array.isArray(arr) && arr.length>0;
    var text = linked ? arr.map(function(r){return (typeof fmtKST==='function'?fmtKST(r.iso):r.iso)+' — '+r.text;}).join(' | ') : null;
    if(typeof stopLog==='function'){ stopLog(linked, text); }
    if(typeof analyzeLogs==='function'){ analyzeLogs(); }
  }catch(e){ console.warn('stopLog/analyze hook fail', e); }

    if(orig.stop) orig.stop();
    showPopup();
  
};

  document.addEventListener("DOMContentLoaded",()=>{
    ensureUI();
    renderBoard(false);
    console.log("🌸 Routine v23 모듈 로드됨 (Schedule Toggle + UX Flow)");
  });
})();
