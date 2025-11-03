/* SMART ALARM — Routine Analysis Module v1.0 (by Party & Hyunji) */
(function(){
  const LOG_KEY = "smart_alarm_logs";
  const loadLogs = ()=>JSON.parse(localStorage.getItem(LOG_KEY)||"[]");
  const saveLogs = logs=>localStorage.setItem(LOG_KEY,JSON.stringify(logs));

  // 🔹 기록 시작 (알람 울릴 때)
  window.startLog = function(profile){
    const logs=loadLogs();
    const now=new Date();
    logs.push({
      date: now.toISOString().split("T")[0],
      startTime: now.toISOString(),
      stopTime: null,
      snoozeCount: 0,
      profile,
      scheduleLinked:false,
      scheduleText:null
    });
    saveLogs(logs);
    console.log("📊 Log started:", now.toISOString());
  };

  // 🔹 스누즈 기록
  window.addSnooze = function(){
    const logs=loadLogs();
    if(logs.length===0)return;
    logs[logs.length-1].snoozeCount++;
    saveLogs(logs);
  };

  // 🔹 알람 종료 기록
  window.stopLog = function(scheduleLinked,scheduleText){
    const logs=loadLogs();
    if(logs.length===0)return;
    const now=new Date();
    const latest=logs[logs.length-1];
    latest.stopTime=now.toISOString();
    latest.scheduleLinked=scheduleLinked||false;
    latest.scheduleText=scheduleText||null;
    saveLogs(logs);
    console.log("📊 Log stopped:", latest);
  };

  // 🔹 분석 함수 (하루 점수 계산)
  function analyze(log){
    if(!log.stopTime)return null;
    const start=new Date(log.startTime), stop=new Date(log.stopTime);
    const diff=(stop-start)/1000; // 초 단위
    const snooze=log.snoozeCount||0;
    const profileWeight={SOFT:1,MEDIUM:1.2,HARD:1.5}[log.profile]||1;

    // 점수 계산
    const reactivity=Math.max(0,100 - (snooze*15 + diff/6));
    const regularity=100; // 주간 편차 계산은 추후
    const motivation=(log.scheduleLinked?40:0)+(profileWeight*20);
    const wakeScore=Math.min(100,(0.4*reactivity)+(0.3*regularity)+(0.3*motivation));

    return {...log,reactivity,regularity,motivation,wakeScore};
  }

  // 🔹 전체 로그 분석
  window.analyzeLogs = function(){
    const logs=loadLogs();
    const analyzed=logs.map(analyze).filter(x=>x);
    localStorage.setItem("smart_alarm_analyzed",JSON.stringify(analyzed));
    console.table(analyzed.map(a=>({
      날짜:a.date,
      반응성:a.reactivity.toFixed(1),
      규칙성:a.regularity.toFixed(1),
      의지력:a.motivation.toFixed(1),
      점수:a.wakeScore.toFixed(1)
    })));
    return analyzed;
  };

  // 🔹 리포트 팝업 (간단형)
  window.showReport = function(){
    const data=JSON.parse(localStorage.getItem("smart_alarm_analyzed")||"[]");
    if(data.length===0){alert("아직 분석된 기록이 없습니다.");return;}
    const latest=data[data.length-1];
    const msg=`오늘의 기상 리포트 🌤️
- 반응성: ${latest.reactivity.toFixed(1)}
- 규칙성: ${latest.regularity.toFixed(1)}
- 의지력: ${latest.motivation.toFixed(1)}
- 총점: ${latest.wakeScore.toFixed(1)}점`;
    alert(msg);
  };

  console.log("🌞 Routine Analysis Module v1.0 Loaded (Wake Quality Scoring Active)");
})();
