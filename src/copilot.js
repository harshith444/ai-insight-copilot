export function analyzeQuestion(question, rows) {
  const q = question.toLowerCase();
  const revenue = sum(rows, "revenue");
  const orders = sum(rows, "orders");
  const averageOrderValue = revenue / orders;

  if (q.includes("region")) {
    const byRegion = groupSum(rows, "region", "revenue");
    const top = topEntry(byRegion);
    return response({
      intent: "Top revenue region",
      sql: "SELECT region, SUM(revenue) AS revenue FROM sales GROUP BY region ORDER BY revenue DESC;",
      answer: `${top.key} leads revenue with $${format(top.value)}.`,
      recommendation: "Prioritize campaign analysis for the leading region, then compare channel mix against underperforming regions.",
      chart: toChart(byRegion, "Revenue by region")
    });
  }

  if (q.includes("channel")) {
    const byChannel = groupSum(rows, "channel", "revenue");
    const top = topEntry(byChannel);
    return response({
      intent: "Channel performance",
      sql: "SELECT channel, SUM(revenue) AS revenue FROM sales GROUP BY channel ORDER BY revenue DESC;",
      answer: `${top.key} is the strongest channel at $${format(top.value)}.`,
      recommendation: "Double down on the top channel and inspect satisfaction scores before increasing volume.",
      chart: toChart(byChannel, "Revenue by channel")
    });
  }

  if (q.includes("product")) {
    const byProduct = groupSum(rows, "product", "revenue");
    const top = topEntry(byProduct);
    return response({
      intent: "Product revenue mix",
      sql: "SELECT product, SUM(revenue) AS revenue FROM sales GROUP BY product ORDER BY revenue DESC;",
      answer: `${top.key} is the highest revenue product at $${format(top.value)}.`,
      recommendation: "Package the top product with the highest satisfaction segment for expansion.",
      chart: toChart(byProduct, "Revenue by product")
    });
  }

  if (q.includes("satisfaction") || q.includes("rating")) {
    const avg = average(rows.map((row) => row.customer_satisfaction));
    return response({
      intent: "Customer satisfaction",
      sql: "SELECT AVG(customer_satisfaction) AS avg_satisfaction FROM sales;",
      answer: `Average satisfaction is ${avg.toFixed(2)} out of 5.`,
      recommendation: avg >= 4.5 ? "Satisfaction is strong; protect quality while scaling." : "Investigate low-scoring segments before scaling acquisition.",
      chart: toChart(groupAverage(rows, "region", "customer_satisfaction"), "Satisfaction by region")
    });
  }

  if (q.includes("trend") || q.includes("daily") || q.includes("over time")) {
    const byDate = groupSum(rows, "date", "revenue");
    const entries = Object.entries(byDate);
    const first = entries[0][1];
    const last = entries.at(-1)[1];
    const direction = last >= first ? "up" : "down";
    return response({
      intent: "Revenue trend",
      sql: "SELECT date, SUM(revenue) AS revenue FROM sales GROUP BY date ORDER BY date;",
      answer: `Revenue is trending ${direction}, moving from $${format(first)} to $${format(last)} across the sample window.`,
      recommendation: "Compare the final three days against channel and product mix to explain the movement.",
      chart: toChart(byDate, "Revenue trend")
    });
  }

  return response({
    intent: "Executive summary",
    sql: "SELECT SUM(revenue) AS revenue, SUM(orders) AS orders, SUM(revenue) / SUM(orders) AS aov FROM sales;",
    answer: `The dataset contains $${format(revenue)} revenue, ${format(orders)} orders, and a $${averageOrderValue.toFixed(2)} average order value.`,
    recommendation: "Start with region and channel segmentation to find the clearest growth lever.",
    chart: toChart(groupSum(rows, "region", "revenue"), "Revenue by region")
  });
}

function response(payload) {
  return {
    ...payload,
    generatedAt: new Date().toISOString()
  };
}

function sum(rows, field) {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

function average(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0) / values.length;
}

function groupSum(rows, key, field) {
  return rows.reduce((groups, row) => {
    groups[row[key]] = (groups[row[key]] || 0) + Number(row[field] || 0);
    return groups;
  }, {});
}

function groupAverage(rows, key, field) {
  const grouped = rows.reduce((groups, row) => {
    groups[row[key]] ||= [];
    groups[row[key]].push(Number(row[field] || 0));
    return groups;
  }, {});
  return Object.fromEntries(Object.entries(grouped).map(([name, values]) => [name, average(values)]));
}

function topEntry(grouped) {
  const [key, value] = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
  return { key, value };
}

function toChart(grouped, title) {
  return {
    title,
    labels: Object.keys(grouped),
    values: Object.values(grouped)
  };
}

function format(value) {
  return Math.round(value).toLocaleString("en-US");
}
