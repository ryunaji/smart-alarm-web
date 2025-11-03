console.log("✅ app_v15.js 실행됨");

let alarmTime = null;
let alarmTimeout = null;
let alarmSound = document.getElementById("alarmSound");
let isAlarmActive = false;
let snoozeCount = 0;
let alarmStartTime = null;
let currentProfile = "SOFT";
let totalElapsed = 0;

// ✅ 기록 저장 (profile 동적 반영)
function saveAlarmRecord(eventType, reactionTime, snoozeCountVal) {
  try {
    let stats = JSON.parse(localStorage.getItem("smart_alarm_stats")) || { history: [] };
    const now = new Date();
    const localDate = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];

    // 프로필 계산 (매번 최신 반영)
    const profile = computeProfile();

    const record = {
      ts: now.toISOString(),
      date: localDate,
      reaction_s: Number(reactionTime) || 0,
      snooze: Number(snoozeCountVal) || 0,
      profile
    };

    stats.history.push(record);
    localStorage.setItem("smart_alarm_stats", JSON.stringify(stats));

    console.log("📝 기록 저장 완료:", record);
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
  if (diff <= 0) diff += 24 * 60 * 60 * 1000;

  if (alarmTimeout) clearTimeout(alarmTimeout);
  alarmTimeout = setTimeout(triggerAlarm, diff);

  alarmStartTime = new Date();
  snoozeCount = 0;
  totalElapsed = 0;
  currentProfile = "SOFT";
  isAlarmActive = false;

  document.getElementById("status").innerText = `🕒 ${timeValue} 알람 설정됨`;
  console.log(`🕒 ${timeValue} 알람 예약 (${diff / 1000}s 후)`);
}

// ✅ 프로필 계산
function computeProfile() {
  const snoozeMin = Number(document.getElementById("snoozeRange").value) || 1;
  const mediumThreshold = 60 * snoozeMin;
  const hardThreshold = 120 * snoozeMin;

  if (totalElapsed >= hardThreshold || snoozeCount >= 3) return "HARD";
  if (totalElapsed >= mediumThreshold || snoozeCount >= 1) return "MEDIUM";
  return "SOFT";
}

// ✅ 알람 울림
function triggerAlarm() {
  if (isAlarmActive) return;
  isAlarmActive = true;

  currentProfile = computeProfile();

  let volume = 0.6, interval = 1000;
  if (currentProfile === "MEDIUM") { volume = 0.85; interval = 500; }
  if (currentProfile === "HARD") { volume = 1.0; interval = 300; }

  alarmSound.volume = volume;
  alarmSound.loop = false;
  alarmStartTime = new Date();

  document.getElementById("status").innerText = `⏰ 알람 울리는 중... (${currentProfile})`;
  console.log(`🔔 ${currentProfile} 모드 실행 (볼륨=${volume}, 간격=${interval})`);

  const playBeep = () => {
    if (!isAlarmActive) return;
    alarmSound.currentTime = 0;
    alarmSound.play();
    setTimeout(playBeep, interval);
  };
  playBeep();
}

// ✅ 알람 종료
function stopAlarm() {
  if (!isAlarmActive) return;
  isAlarmActive = false;
  alarmSound.pause();
  alarmSound.currentTime = 0;
  clearTimeout(alarmTimeout);

  const reactionSec = (new Date() - alarmStartTime) / 1000;
  totalElapsed += reactionSec;
  currentProfile = computeProfile();

  document.getElementById("status").innerText = `🛑 알람 종료 (${currentProfile})`;

  saveAlarmRecord("stop", totalElapsed, snoozeCount);
  console.log(`🛑 알람 종료 (${reactionSec.toFixed(1)}초, 상태=${currentProfile})`);
}

// ✅ 스누즈
function snoozeAlarm() {
  if (!isAlarmActive) return;

  if (currentProfile === "HARD") {
    document.getElementById("status").innerText = "🚫 Hard 모드: 스누즈 불가, 알람 종료만 가능합니다.";
    console.log("🚫 Hard 모드에서 스누즈 차단됨");
    alarmSound.play();
    return;
  }

  alarmSound.pause();
  alarmSound.currentTime = 0;
  isAlarmActive = false;
  snoozeCount++;

  const reactionSec = (new Date() - alarmStartTime) / 1000;
  totalElapsed += reactionSec;
  currentProfile = computeProfile();

  saveAlarmRecord("snooze", totalElapsed, snoozeCount);

  const snoozeMin = Number(document.getElementById("snoozeRange").value) || 1;
  document.getElementById("status").innerText = `😴 ${snoozeMin}분 뒤 다시 울림 (${snoozeCount}회, 상태=${currentProfile})`;

  alarmTimeout = setTimeout(() => triggerAlarm(), snoozeMin * 60 * 1000);
  console.log(`😴 스누즈 ${snoozeCount}회 (${snoozeMin}분) 후 알람 (${currentProfile})`);
}

// ✅ 버튼 연결
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("setAlarm").onclick = setAlarm;
  document.getElementById("stopAlarm").onclick = stopAlarm;
  document.getElementById("snoozeAlarm").onclick = snoozeAlarm;
  console.log("🔗 버튼 연결 완료");
});
