console.log("✅ app_v12.js 실행됨");

let alarmTime = null;
let alarmTimeout = null;
let alarmSound = document.getElementById("alarmSound");
let isAlarmActive = false;
let snoozeCount = 0;
let alarmStartTime = null;

// ✅ 기록 저장
function saveAlarmRecord(eventType, reactionTime, snoozeCountVal, profile) {
  try {
    let stats = JSON.parse(localStorage.getItem("smart_alarm_stats")) || { history: [] };
    const now = new Date();
    const localDate = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];

    stats.history.push({
      ts: now.toISOString(),
      date: localDate,
      reaction_s: Number(reactionTime) || 0,
      snooze: Number(snoozeCountVal) || 0,
      event: eventType,
      profile
    });

    localStorage.setItem("smart_alarm_stats", JSON.stringify(stats));
    console.log("📝 기록 저장 완료:", { eventType, reactionTime, snoozeCountVal, profile });
  } catch (err) {
    console.error("⚠️ 기록 저장 오류:", err);
  }
}

// ✅ 알람 설정
function setAlarm() {
  const timeValue = document.getElementById("alarmTime").value;
  const snoozeInput = Number(document.getElementById("snoozeRange").value) || 1;

  if (!timeValue) return alert("⏰ 알람 시간을 설정하세요!");

  const [h, m] = timeValue.split(":").map(Number);
  const now = new Date();
  alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);

  let diff = alarmTime.getTime() - now.getTime();
  if (diff <= 0) diff += 24 * 60 * 60 * 1000; // 다음날로 조정

  if (alarmTimeout) clearTimeout(alarmTimeout);
  alarmTimeout = setTimeout(triggerAlarm, diff);
  alarmStartTime = new Date();
  snoozeCount = 0;
  isAlarmActive = false;

  document.getElementById("status").innerText = `🕒 ${timeValue} 알람 설정됨`;
  console.log(`🕒 ${timeValue} 알람 예약 (${diff / 1000}s 후)`);
}

// ✅ 알람 울림
function triggerAlarm() {
  if (isAlarmActive) return;
  isAlarmActive = true;

  let profile = "SOFT";
  let volume = 0.6;
  let interval = 1000;

  alarmSound.volume = volume;
  alarmSound.loop = false;
  alarmStartTime = new Date();

  document.getElementById("status").innerText = `⏰ 알람 울리는 중... (${profile})`;

  const playBeep = () => {
    if (!isAlarmActive) return;
    alarmSound.currentTime = 0;
    alarmSound.play();
    setTimeout(playBeep, interval);
  };
  playBeep();

  console.log("🔔 알람 시작 (SOFT)");
}

// ✅ 알람 종료
function stopAlarm() {
  if (!isAlarmActive) return;
  isAlarmActive = false;
  alarmSound.pause();
  alarmSound.currentTime = 0;
  clearTimeout(alarmTimeout);

  const reactionSec = (new Date() - alarmStartTime) / 1000;
  const snoozeMin = Number(document.getElementById("snoozeRange").value) || 1;

  const mediumThreshold = 60 * snoozeMin;
  const hardThreshold = 120 * snoozeMin;

  let profile = "SOFT";
  if (reactionSec >= hardThreshold || snoozeCount >= 3) profile = "HARD";
  else if (reactionSec >= mediumThreshold || snoozeCount >= 1) profile = "MEDIUM";

  document.getElementById("status").innerText = `🛑 알람 종료 (${profile})`;
  console.log(`🛑 알람 종료: ${reactionSec.toFixed(1)}초 / 상태 ${profile}`);

  saveAlarmRecord("stop", reactionSec, snoozeCount, profile);
}

// ✅ 스누즈
function snoozeAlarm() {
  if (!isAlarmActive) return;

  alarmSound.pause();
  alarmSound.currentTime = 0;
  isAlarmActive = false;
  snoozeCount++;

  const snoozeMin = Number(document.getElementById("snoozeRange").value) || 1;
  document.getElementById("status").innerText = `😴 ${snoozeMin}분 뒤 다시 울림 (${snoozeCount}회)`;

  saveAlarmRecord("snooze", (new Date() - alarmStartTime) / 1000, snoozeCount, "SOFT");

  alarmTimeout = setTimeout(() => {
    triggerAlarm();
  }, snoozeMin * 60 * 1000);
}

// ✅ 버튼 연결
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("setAlarm").onclick = setAlarm;
  document.getElementById("stopAlarm").onclick = stopAlarm;
  document.getElementById("snoozeAlarm").onclick = snoozeAlarm;
  console.log("🔗 버튼 연결 완료");
});
