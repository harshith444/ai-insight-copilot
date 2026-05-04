const question = document.querySelector("#question");
const ask = document.querySelector("#ask");
const intent = document.querySelector("#intent");
const answer = document.querySelector("#answer");
const recommendation = document.querySelector("#recommendation");
const sql = document.querySelector("#sql");
const chartTitle = document.querySelector("#chart-title");
const canvas = document.querySelector("#chart");
const ctx = canvas.getContext("2d");

ask.addEventListener("click", () => run(question.value));
question.addEventListener("keydown", (event) => {
  if (event.key === "Enter") run(question.value);
});

document.querySelectorAll("[data-q]").forEach((button) => {
  button.addEventListener("click", () => {
    question.value = button.dataset.q;
    run(button.dataset.q);
  });
});

async function run(q) {
  const response = await fetch(`/api/ask?q=${encodeURIComponent(q)}`);
  const insight = await response.json();
  intent.textContent = insight.intent;
  answer.textContent = insight.answer;
  recommendation.textContent = insight.recommendation;
  sql.textContent = insight.sql;
  draw(insight.chart);
}

function draw(chart) {
  chartTitle.textContent = chart.title;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const max = Math.max(...chart.values);
  const gap = 26;
  const barWidth = (canvas.width - gap * (chart.values.length + 1)) / chart.values.length;

  chart.values.forEach((value, index) => {
    const height = (value / max) * 220;
    const x = gap + index * (barWidth + gap);
    const y = 260 - height;

    ctx.fillStyle = "#10b981";
    ctx.fillRect(x, y, barWidth, height);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "16px Inter, sans-serif";
    ctx.fillText(chart.labels[index], x, 292);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "13px Inter, sans-serif";
    ctx.fillText(Math.round(value).toLocaleString("en-US"), x, y - 10);
  });
}

run(question.value);
