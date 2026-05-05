const dataset = document.querySelector("#dataset");
const question = document.querySelector("#question");
const ask = document.querySelector("#ask");
const intent = document.querySelector("#intent");
const answer = document.querySelector("#answer");
const recommendation = document.querySelector("#recommendation");
const sql = document.querySelector("#sql");
const context = document.querySelector("#context");
const chartTitle = document.querySelector("#chart-title");
const canvas = document.querySelector("#chart");
const ctx = canvas.getContext("2d");

ask.addEventListener("click", () => run(question.value));
question.addEventListener("keydown", (event) => {
  if (event.key === "Enter") run(question.value);
});

dataset.addEventListener("change", () => run(question.value));

document.querySelectorAll("[data-q]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.dataset) dataset.value = button.dataset.dataset;
    question.value = button.dataset.q;
    run(button.dataset.q);
  });
});

async function boot() {
  const response = await fetch("/api/datasets");
  const body = await response.json();
  dataset.innerHTML = body.datasets
    .map((item) => `<option value="${item.id}">${item.name} - ${item.rows} rows</option>`)
    .join("");
  run(question.value);
}

async function run(q) {
  const response = await fetch(`/api/ask?dataset=${encodeURIComponent(dataset.value || "sales")}&q=${encodeURIComponent(q)}`);
  const insight = await response.json();
  intent.textContent = insight.intent;
  answer.textContent = insight.answer;
  recommendation.textContent = insight.recommendation;
  sql.textContent = insight.sql;
  renderContext(insight.retrievedContext);
  draw(insight.chart);
}

function renderContext(items) {
  context.innerHTML = `
    <div class="context-list">
      ${items
        .map(
          (item) => `
            <div class="context-item">
              <strong>${item.title} <span>score ${item.score}</span></strong>
              <p>${item.text}</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function draw(chart) {
  chartTitle.textContent = chart.title;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!chart.values.length) return;

  const max = Math.max(...chart.values.map(Math.abs), 1);
  const gap = 26;
  const barWidth = Math.max(24, (canvas.width - gap * (chart.values.length + 1)) / chart.values.length);

  chart.values.forEach((value, index) => {
    const height = (Math.abs(value) / max) * 220;
    const x = gap + index * (barWidth + gap);
    const y = 260 - height;

    ctx.fillStyle = "#10b981";
    ctx.fillRect(x, y, Math.min(barWidth, 110), height);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "14px Inter, sans-serif";
    ctx.fillText(String(chart.labels[index]).slice(0, 13), x, 292);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "13px Inter, sans-serif";
    ctx.fillText(Number(value).toLocaleString("en-US", { maximumFractionDigits: 1 }), x, y - 10);
  });
}

boot();
