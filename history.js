document.addEventListener("DOMContentLoaded", () => {
  const stats = JSON.parse(localStorage.getItem("smart_alarm_stats")) || { history: [] };
  const table = document.getElementById("historyTable");

  if (!stats.history.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.innerText = "📭 기록이 없습니다.";
    row.appendChild(cell);
    table.appendChild(row);
    return;
  }

  // ✅ 날짜+시간 표시 & 최신순 정렬
  const sorted = stats.history.sort((a, b) => new Date(b.ts) - new Date(a.ts));

  const colors = {
    SOFT: "#FFC8DD",   // 연핑크
    MEDIUM: "#FFAFCC", // 중간핑크
    HARD: "#FF5C8A"    // 진한핑크
  };

  // 📋 표 렌더링
  sorted.forEach(record => {
    const localTime = new Date(record.ts);
    const kst = new Date(localTime.getTime() + 9 * 60 * 60 * 1000); // KST 변환
    const formattedTime = `${kst.getFullYear()}-${String(kst.getMonth()+1).padStart(2,"0")}-${String(kst.getDate()).padStart(2,"0")} ${String(kst.getHours()).padStart(2,"0")}:${String(kst.getMinutes()).padStart(2,"0")}`;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formattedTime}</td>
      <td>${record.reaction_s.toFixed(1)}</td>
      <td>${record.snooze}</td>
      <td style="color:${colors[record.profile]}; font-weight:bold;">${record.profile}</td>
    `;
    table.appendChild(row);
  });

  // 📊 그래프 데이터 구성
  const labels = sorted.map(r => {
    const localTime = new Date(r.ts);
    const kst = new Date(localTime.getTime() + 9 * 60 * 60 * 1000);
    return `${kst.getMonth()+1}/${kst.getDate()} ${String(kst.getHours()).padStart(2,"0")}:${String(kst.getMinutes()).padStart(2,"0")}`;
  });

  const data = sorted.map(r => r.reaction_s);
  const bgColors = sorted.map(r => colors[r.profile] || "#888");

  // 📈 Chart.js 그래프 생성
  new Chart(document.getElementById("historyChart"), {
    type: "scatter",
    data: {
      labels,
      datasets: [{
        label: "반응시간(초)",
        data: sorted.map((r, i) => ({ x: i + 1, y: r.reaction_s })),
        backgroundColor: bgColors,
        pointRadius: 8,
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const r = sorted[ctx.dataIndex];
              const localTime = new Date(r.ts);
              const kst = new Date(localTime.getTime() + 9 * 60 * 60 * 1000);
              const formattedTime = `${kst.getMonth()+1}/${kst.getDate()} ${String(kst.getHours()).padStart(2,"0")}:${String(kst.getMinutes()).padStart(2,"0")}`;
              return `🕒 ${formattedTime}\n⏱ ${r.reaction_s.toFixed(1)}초\n😴 스누즈 ${r.snooze}회\n💬 ${r.profile}`;
            }
          }
        }
      },
      scales: {
        x: { display: false },
        y: {
          beginAtZero: true,
          title: { display: true, text: "반응시간(초)" }
        }
      }
    }
  });
});
