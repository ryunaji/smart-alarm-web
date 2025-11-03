console.log("✅ app_v9.js 실행됨");

// ===== 공통 상태 =====
let alarmTime = null;
let alarmTimeout = null;
let alarmSound = document.getElementById("alarmSound");
let isAlarmActive = false;
let snoozeCount = 0;
let alarmStartTime = null;

// ===== 기록 저장 =====
function saveAlarmRecord(eventType, reactionTime, snoozeCountVal) {
  try {
    let stats = JSON.parse(localStorage.getItem("smart_alarm_stats")) || { history: [] };
    const now = new Date();
    const localDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)).toISOString().split("T")[0];
    const todayIndex = stats.history.findIndex(item => item.date === localDate);
    const newRecord = {
      ts: now.toISOString(),
      date: localDate,
      reaction_s: Number(reactionTime) || 0,
      snooze: Number(snoozeCountVal) || 0,
      event: eventType
    };
    if (todayIndex !== -1) stats.history[todayIndex] = newRecord;
    else stats.history.push(newRecord);
    localStorage.setItem("smart_alarm_stats", JSON.stringify(stats));
    console.log("📝 기록 저장:", newRecord);
  } catch (err) {
    console.error("⚠️ 기록 저장 오류:", err);
  }
}

// ===== 알람 설정 =====
function setAlarm() {
  const input = document.getElementById("alarmTime");
  const snoozeInput = document.getElementById("snoozeRange");

  if (!input || !snoozeInput) {
    alert("⏰ 알람 입력창이 없습니다!");
    return;
  }

  const timeValue = input.value;
  if (!timeValue) {
    alert("알람 시간을 입력하세요!");
    return;
  }

  const [hours, minutes] = timeValue.split(":").map(Number);
  const now = new Date();
  alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

  const diff = alarmTime.getTime() - now.getTime();
  if (diff <= 0) {
    alert("현재 이후 시간을 설정해주세요!");
    return;
  }

  if (alarmTimeout) clearTimeout(alarmTimeout);
  alarmTimeout = setTimeout(triggerAlarm, diff);
  alarmStartTime = new Date();
  isAlarmActive = true;
  snoozeCount = 0;

  alert(`🔔 ${timeValue} 에 알람이 설정되었습니다!`);
  console.log(`🕒 알람 예약됨: ${timeValue} (${Math.round(diff/1000)}초 후 울림)`);
  document.getElementById("status").innerText = `🕒 ${timeValue} 알람 예약됨`;
}

// ===== 알람 울림 =====
function triggerAlarm() {
  if (!isAlarmActive) return;
  try {
    alarmSound.loop = true;
    alarmSound.play();
  } catch (e) {
    console.warn("🔇 자동재생 제한");
  }
  document.body.dataset.alarming = "true";
  document.getElementById("status").innerText = "⏰ 알람 울리는 중...";
  console.log("⏰ 알람 울림");
}

// ===== 알람 종료 =====
function stopAlarm() {
  if (!isAlarmActive) return;

  // 즉시 상태 변경
  document.getElementById("status").innerText = "🛑 알람 종료";

  const reactionTime = (new Date() - (alarmStartTime || new Date())) / 1000;
  alarmSound.pause();
  alarmSound.currentTime = 0;
  clearTimeout(alarmTimeout);
  document.body.dataset.alarming = "false";

  // 상태 리셋
  isAlarmActive = false;

  // 저장
  saveAlarmRecord("stop", reactionTime, snoozeCount);
  console.log("🛑 알람 종료:", { reactionTime: reactionTime.toFixed(2), snoozeCount });
}

// ===== 스누즈 =====
function snoozeAlarm() {
  if (!isAlarmActive) return;

  // 소리 끄기
  alarmSound.pause();
  alarmSound.currentTime = 0;
  document.body.dataset.alarming = "false";

  // 스누즈 누적
  snoozeCount++;
  localStorage.setItem("smart_alarm_temp_snooze", snoozeCount);

  // 스누즈 설정
  const snoozeMin = Number(document.getElementById("snoozeRange").value) || 5;
  alarmTimeout = setTimeout(() => {
    isAlarmActive = true;
    triggerAlarm();
  }, snoozeMin * 60 * 1000);

  document.getElementById("status").innerText = `😴 ${snoozeMin}분 후 다시 울림 (${snoozeCount}회)`;
  console.log(`😴 스누즈 ${snoozeCount}회 (${snoozeMin}분)`);
  alert(`${snoozeMin}분 후 다시 울립니다!`);
}

// ===== 버튼 연결 =====
document.addEventListener("DOMContentLoaded", () => {
  const setBtn = document.getElementById("setAlarm");
  const stopBtn = document.getElementById("stopAlarm");
  const snoozeBtn = document.getElementById("snoozeAlarm");

  [setBtn, stopBtn, snoozeBtn].forEach(btn => { if (btn) btn.disabled = false; });

  setBtn?.addEventListener("click", setAlarm);
  stopBtn?.addEventListener("click", stopAlarm);
  snoozeBtn?.addEventListener("click", snoozeAlarm);

  console.log("🔗 버튼 바인딩 완료");
});
