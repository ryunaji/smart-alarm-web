/* SMART ALARM — Routine Module v19 (wraps v17 without modifying it) */
(function(){
  const LS_KEY = "smart_alarm_routines"; // [{iso, text}]
  const KST = (d=new Date()) => new Date(d.getTime()+9*3600*1000);

  function formatKST(iso){
    const d = new Date(iso);
    const k = KST(d);
    const y=k.getFullYear(), M=String(k.getMonth()+1).padStart(2,"0"), D=String(k.getDate()).padStart(2,"0");
    const hh=String(k.getHours()).padStart(2,"0"), mm=String(k.getMinutes()).padStart(2,"0");
    return `${y}-${M}-${D} ${hh}:${mm}`;
  }

  function loadRoutines(){
    try { return JSON.parse(localStorage.getItem(LS_KEY))||[]; } catch { return []; }
  }
  function saveRoutines(arr){
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  }

  function withinTodayKST(iso){
    const k = KST(); const y=k.getUTCFullYear(), m=k.getUTCMonth(), d=k.getUTCDate();
    const start = new Date(Date.UTC(y,m,d,0,0,0));
    const end   = new Date(Date.UTC(y,m,d,23,59,59,999));
    const t = KST(new Date(iso));
    return t>=start && t<=end;
  }

  function ensureUI(){
    if (document.getElementById("routineSection")) return;
    const host = document.querySelector(".container") || document.body;
    const wrap = document.createElement("div");
    wrap.id="routineSection";
    wrap.className="routine-section";
    wrap.innerHTML = `
      <h3>🗓 내일 일정 (최대 3개)</h3>
      <div class="routine-item">
        <input type="datetime-local" id="routineDT1">
        <input type="text" id="routineText1" placeholder="예: 오전 러닝">
      </div>
      <div class="routine-item">
        <input type="datetime-local" id="routineDT2">
        <input type="text" id="routineText2" placeholder="예: 줌 미팅">
      </div>
      <div class="routine-item">
        <input type="datetime-local" id="routineDT3">
        <input type="text" id="routineText3" placeholder="예: 점심 약속">
      </div>
      <button id="saveRoutines" class="btn-save-routine">🩷 일정 저장</button>
      <div id="routineBoard" class="routine-board" style="display:none"></div>
    `;
    host.appendChild(wrap);

    document.getElementById("saveRoutines").onclick = () => {
      const list=[];
      for (let i=1;i<=3;i++){
        const dt = document.getElementById(`routineDT${i}`).value;
        const txt= (document.getElementById(`routineText${i}`).value||"").trim();
        if (dt && txt) list.push({ iso: new Date(dt).toISOString(), text: txt });
      }
      saveRoutines(list);
      alert("✅ 내일 일정이 저장되었습니다!");
      renderBoard();
    };
  }

  function renderBoard(showTodayOnly=false){
    const board = document.getElementById("routineBoard");
    if (!board) return;
    const all = loadRoutines();
    const items = showTodayOnly ? all.filter(r=>withinTodayKST(r.iso)) : all;
    if (!items.length){ board.style.display="none"; board.innerHTML=""; return; }
    board.style.display="block";
    board.innerHTML = `
      <h4>${ showTodayOnly ? "☀️ 오늘 일정" : "🗓 저장된 일정" }</h4>
      <ul style="margin:0;padding-left:18px">
        ${items.map(r=>`<li>${formatKST(r.iso)} — ${r.text}</li>`).join("")}
      </ul>`;
  }

  /* --- Wrap v17 globals safely --- */
  const orig = {
    triggerAlarm: window.triggerAlarm,
    stopAlarm: window.stopAlarm
  };

  // 알람 울릴 때: 오늘 일정 보드 표시 + 강도에 따라 배경 애니메이션 클래스
  window.triggerAlarm = function(){
    try {
      document.body.classList.remove("shake-soft","shake-med","shake-hard");
      // v17의 currentProfile 사용 시 반영 (없으면 패스)
      const prof = (window.currentProfile || "SOFT");
      if (prof==="SOFT") document.body.classList.add("shake-soft");
      if (prof==="MEDIUM") document.body.classList.add("shake-med");
      if (prof==="HARD") document.body.classList.add("shake-hard");
      renderBoard(true);
    } catch(e){}
    return orig.triggerAlarm ? orig.triggerAlarm() : undefined;
  };

  // 알람 종료 시: 축하 애니메이션 + 오늘 일정 보드 표시 유지
  window.stopAlarm = function(){
    const ret = orig.stopAlarm ? orig.stopAlarm() : undefined;
    try {
      document.body.classList.remove("shake-soft","shake-med","shake-hard");
      renderBoard(true);
      // 간단 confetti (이모지)
      const layer = document.createElement("div");
      layer.className="confetti";
      const emojis = ["🎉","✨","🌟","💗","🎀","💖"];
      layer.innerHTML = `<div style="position:absolute;left:50%;top:20%;transform:translateX(-50%);font-size:40px">${emojis.join(" ")}</div>
        <div style="position:absolute;left:15%;top:40%;font-size:28px">🎉</div>
        <div style="position:absolute;right:15%;top:45%;font-size:28px">✨</div>
        <div style="position:absolute;left:25%;bottom:20%;font-size:28px">🌟</div>`;
      document.body.appendChild(layer);
      setTimeout(()=>layer.remove(), 4500);
      const status = document.getElementById("status");
      if (status) status.innerText = "🎉 축하합니다! 알람을 성공적으로 종료했습니다. (오늘 일정 확인)";
    } catch(e){}
    return ret;
  };

  document.addEventListener("DOMContentLoaded", ()=>{
    ensureUI();
    renderBoard(false);
    console.log("🧩 Routine v19 모듈 로드됨 (v17 위에 증설)");
  });
})();
