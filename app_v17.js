console.log("✅ app_v17.js 실행됨");

let alarmTime = null;
let alarmTimeout = null;
let alarmSound = document.getElementById("alarmSound");
let isAlarmActive = false;
let snoozeCount = 0;
let alarmStartTime = null;
let currentProfile = "SOFT";
let totalElapsed = 0;
let reachedHardOnce = false;

// ✅ 기록 저장 (프로필 반영)
function saveAlarmRecord(eventType, reactionTime, snoozeCountVal) {
  try {
    let stats = JSON.parse(localStorage.getItem("smart_alarm_stats")) || { history: [] };
    const now = new Date();
    const localDate = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];

    stats.history.push({
      ts: now.toISOString(),
      date: localDate,
      reaction_s: Number(reactionTime) || 0,
      snooze: Number(snoozeCountVal) || 0,
      profile: currentProfile
    });

    localStorage.setItem("smart_alarm_stats", JSON.stringify(stats));
    console.log("📝 기록 저장 완료:", {eventType, reactionTime, snoozeCountVal, profile: currentProfile});
  } catch (err) {
    console.error("⚠️ 기록 저장 오류:", err);
  }
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

// ✅ 알람 실행
function triggerAlarm() {
  if (isAlarmActive) return;
  isAlarmActive = true;

  currentProfile = computeProfile();

  let volume = 0.6, interval = 1000;
  if (currentProfile === "MEDIUM") { volume = 0.85; interval = 500; }
  if (currentProfile === "HARD") { volume = 1.0; interval = 300; }

  alarmSound.volume = volume;
  alarmStartTime = new Date();

  document.getElementById("status").innerText = `⏰ 알람 울리는 중 (${currentProfile})`;
  console.log(`🔔 ${currentProfile} 모드 실행 (vol=${volume}, 간격=${interval})`);

  const loop = () => {
    if (!isAlarmActive) return;
    alarmSound.currentTime = 0;
    alarmSound.play();
    setTimeout(loop, interval);
  };
  loop();
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
  console.log(`🛑 종료 (${reactionSec.toFixed(1)}초, 상태=${currentProfile})`);
}

// ✅ 스누즈
function snoozeAlarm() {
  if (!isAlarmActive) return;

  if (currentProfile === "HARD") {
    document.getElementById("status").innerText = "🚫 HARD 모드: 스누즈 불가, 알람 종료만 가능합니다.";
    console.log("🚫 HARD에서 스누즈 차단됨");
    alarmSound.play();
    return;
  }

  alarmSound.pause();
  alarmSound.currentTime = 0;
  isAlarmActive = false;
  snoozeCount++;

  const reactionSec = (new Date() - alarmStartTime) / 1000;
  totalElapsed += reactionSec;

  // ✅ 프로필 먼저 계산하고 저장해야 정확히 찍힘
  currentProfile = computeProfile();

  // ✅ HARD 최초 진입 시 마지막 스누즈만 허용
  if (currentProfile === "HARD" && !reachedHardOnce) {
    reachedHardOnce = true;
    saveAlarmRecord("snooze", totalElapsed, snoozeCount);
    const snoozeMin = Number(document.getElementById("snoozeRange").value) || 1;
    document.getElementById("status").innerText = `😴 마지막 스누즈: ${snoozeMin}분 뒤 HARD 재울림`;
    alarmTimeout = setTimeout(triggerAlarm, snoozeMin * 60 * 1000);
    return;
  }

  // HARD 이후 스누즈 금지
  if (currentProfile === "HARD" && reachedHardOnce) {
    document.getElementById("status").innerText = "🚫 HARD 모드: 스누즈 불가.";
    isAlarmActive = true;
    triggerAlarm();
    return;
  }

  // SOFT→MEDIUM 구간 정상 스누즈
  saveAlarmRecord("snooze", totalElapsed, snoozeCount);
  const snoozeMin = Number(document.getElementById("snoozeRange").value) || 1;
  document.getElementById("status").innerText = `😴 ${snoozeMin}분 뒤 다시 울림 (${currentProfile})`;
  alarmTimeout = setTimeout(triggerAlarm, snoozeMin * 60 * 1000);
  console.log(`😴 스누즈 ${snoozeCount}회 (${snoozeMin}분 후 ${currentProfile})`);
}

// ✅ 알람 설정
function setAlarm() {
  const val = document.getElementById("alarmTime").value;
  if (!val) return alert("⏰ 알람 시간을 설정하세요!");

  const [h, m] = val.split(":").map(Number);
  const now = new Date();
  alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);

  let diff = alarmTime - now;
  if (diff <= 0) diff += 24 * 60 * 60 * 1000;

  if (alarmTimeout) clearTimeout(alarmTimeout);
  alarmTimeout = setTimeout(triggerAlarm, diff);

  snoozeCount = 0;
  totalElapsed = 0;
  currentProfile = "SOFT";
  reachedHardOnce = false;
  isAlarmActive = false;

  document.getElementById("status").innerText = `🕒 ${val} 알람 설정됨`;
  console.log(`🕒 ${val} 알람 예약됨 (${Math.round(diff / 1000)}s 후)`);
}

// ✅ 버튼 연결
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("setAlarm").onclick = setAlarm;
  document.getElementById("stopAlarm").onclick = stopAlarm;
  document.getElementById("snoozeAlarm").onclick = snoozeAlarm;
  console.log("🔗 버튼 연결 완료");
});
