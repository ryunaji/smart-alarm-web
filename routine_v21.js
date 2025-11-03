/* SMART ALARM — Routine Module v21 (Popup + Fireworks + Random Motivation) */
(function(){
  const LS_KEY = "smart_alarm_routines";
  const KST = (d=new Date()) => new Date(d.getTime()+9*3600*1000);
  const fmt = iso=>{
    const k=KST(new Date(iso));
    return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")} ${String(k.getHours()).padStart(2,"0")}:${String(k.getMinutes()).padStart(2,"0")}`;
  };
  const load=()=>JSON.parse(localStorage.getItem(LS_KEY)||"[]");
  const save=a=>localStorage.setItem(LS_KEY,JSON.stringify(a));
  const withinToday=iso=>{
    const k=KST(); const y=k.getUTCFullYear(),m=k.getUTCMonth(),d=k.getUTCDate();
    const start=new Date(Date.UTC(y,m,d,0,0,0)),end=new Date(Date.UTC(y,m,d,23,59,59,999));
    const t=KST(new Date(iso)); return t>=start&&t<=end;
  };

  // 🩷 응원 문구
  const MOTIVATION = {
    SOFT: [
      "오늘은 정말 상쾌한 하루를 보낼 수 있겠어요! 🌞",
      "기분 좋은 아침이에요! 오늘도 멋진 하루 시작 ✨",
      "조용히 성공하는 하루, 오늘도 당신답게 🌸"
    ],
    MEDIUM: [
      "조금 피곤하지만, 그래도 잘 일어났어요 💪",
      "오늘은 천천히, 하지만 꾸준하게 ☕️",
      "꾸준함이 곧 당신의 무기예요 🔥"
    ],
    HARD: [
      "제 시간에 일어난 것만으로도 대단해요 🌈",
      "오늘 하루, 스스로를 칭찬해 주세요 💖",
      "힘든 아침을 이겨낸 당신, 최고예요 🏆"
    ]
  };

  function randomMessage(profile){
    const arr = MOTIVATION[profile] || MOTIVATION.SOFT;
    return arr[Math.floor(Math.random()*arr.length)];
  }

  function ensureUI(){
    if(document.getElementById("routineSection")) return;
    const host=document.querySelector(".container")||document.body;
    const wrap=document.createElement("div");
    wrap.id="routineSection";
    wrap.className="routine-section";
    wrap.innerHTML=`
      <h3>🗓 일정</h3>
      ${[1,2,3].map(i=>`
        <div class="routine-item">
          <input type="datetime-local" id="routineDT${i}">
          <input type="text" id="routineText${i}" placeholder="예: 오전 러닝">
        </div>`).join("")}
      <button id="saveRoutines" class="btn-save-routine">💗 일정 저장</button>
      <div id="routineBoard" class="routine-board" style="display:none"></div>`;
    host.appendChild(wrap);

    document.getElementById("saveRoutines").onclick=()=>{
      const arr=[];
      for(let i=1;i<=3;i++){
        const dt=document.getElementById(`routineDT${i}`).value;
        const txt=document.getElementById(`routineText${i}`).value.trim();
        if(dt&&txt) arr.push({iso:new Date(dt).toISOString(),text:txt});
      }
      save(arr);
      alert("✅ 일정이 저장되었습니다!");
      renderBoard();
    };
  }

  function renderBoard(todayOnly=false){
    const board=document.getElementById("routineBoard");
    if(!board) return;
    const arr=load();
    const items=todayOnly?arr.filter(r=>withinToday(r.iso)):arr;
    if(!items.length){board.style.display="none";board.innerHTML="";return;}
    board.style.display="block";
    board.innerHTML=`
      <h4>${todayOnly?"☀️ 오늘 일정":"🗓 저장된 일정"}</h4>
      <ul style="margin:0;padding-left:18px">
        ${items.map(r=>`<li>${fmt(r.iso)} — ${r.text}</li>`).join("")}
      </ul>`;
  }

  function firework(){
    const canvas=document.createElement("canvas");
    Object.assign(canvas.style,{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999});
    document.body.appendChild(canvas);
    const ctx=canvas.getContext("2d");
    canvas.width=innerWidth; canvas.height=innerHeight;
    const particles=[];
    for(let i=0;i<120;i++){
      particles.push({
        x:canvas.width/2,y:canvas.height/2,
        r:Math.random()*4+2,
        c:`hsl(${Math.random()*360},100%,70%)`,
        vx:(Math.random()-0.5)*7,
        vy:(Math.random()-0.5)*7,
        a:1
      });
    }
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.07; p.a-=0.01;
        ctx.fillStyle=p.c;
        ctx.globalAlpha=Math.max(p.a,0);
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      });
      if(particles.some(p=>p.a>0)) requestAnimationFrame(draw);
      else canvas.remove();
    }
    draw();
  }

  function showPopup(){
    const items=load().filter(r=>withinToday(r.iso));
    const profile = window.currentProfile || "SOFT";
    const msg = randomMessage(profile);
    const modal=document.createElement("div");
    modal.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9998;`;
    modal.innerHTML=`
      <div style="background:white;padding:20px 30px;border-radius:16px;max-width:420px;text-align:center;font-family:'맑은 고딕';box-shadow:0 4px 15px rgba(0,0,0,0.2);">
        <h2 style="color:#ff5c8a;margin-bottom:8px;">🎉 축하합니다!</h2>
        <p style="color:#ff7aa2;margin-bottom:12px;font-weight:bold;">${msg}</p>
        <ul style="list-style:none;padding:0;margin:0 0 12px 0;">
          ${items.length?items.map(r=>`<li>${fmt(r.iso)} — ${r.text}</li>`).join(""):"<li>등록된 일정이 없습니다.</li>"}
        </ul>
        <button id="closePopup" style="margin-top:10px;background:#ffafcc;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;">닫기</button>
      </div>`;
    document.body.appendChild(modal);
    firework();
    document.getElementById("closePopup").onclick=()=>modal.remove();
  }

  const orig={trigger:window.triggerAlarm,stop:window.stopAlarm};
  window.triggerAlarm=function(){
    renderBoard(true);
    return orig.trigger?orig.trigger():undefined;
  };
  window.stopAlarm=function(){
    const r=orig.stop?orig.stop():undefined;
    showPopup();
    return r;
  };

  document.addEventListener("DOMContentLoaded",()=>{
    ensureUI();
    renderBoard(false);
    console.log("🌸 Routine v21 모듈 로드됨 (with Random Motivation)");
  });
})();
