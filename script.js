const STATIC_DATA_PATH = "./data.json";

const destinationFilter = document.getElementById("destinationFilter");
const statusFilter = document.getElementById("statusFilter");
const paymentFilter = document.getElementById("paymentFilter");
const sortBySelect = document.getElementById("sortBy");
const resetFilters = document.getElementById("resetFilters");
const metricsContainer = document.getElementById("metrics");
const insightsList = document.getElementById("insightsList");
const statusBanner = document.getElementById("statusBanner");
const heatmapContainer = document.getElementById("heatmapContainer");
const topCustomersTableBody = document.querySelector("#topCustomersTable tbody");
const destinationDetailTableBody = document.querySelector("#destinationDetailTable tbody");

let trips = [];

let bookingsChart;
let revenueChart;
let statusChart;
let ratingByDestinationChart;
let monthlyTrendChart;
let revenueVsCostChart;
let paretoChart;
let paymentMethodChart;
let productThemeChart;
let priceBandChart;
let destinationStatusStackChart;
let revealObserver;

Chart.defaults.color = "#c7dbf7";
Chart.defaults.borderColor = "rgba(125, 211, 252, 0.15)";

const CHART_COLORS = {
  cyan: "rgba(34, 211, 238, 0.85)",
  orange: "rgba(249, 115, 22, 0.82)",
  blue: "rgba(56, 189, 248, 0.82)",
  indigo: "rgba(99, 102, 241, 0.82)",
  rose: "rgba(251, 113, 133, 0.82)",
  slate: "rgba(148, 163, 184, 0.82)",
  mint: "rgba(45, 212, 191, 0.82)",
  violet: "rgba(167, 139, 250, 0.82)"
};

const DESTINATION_THEME_MAP = {
  Paris: "Culture",
  London: "Urban",
  "New York": "Urban",
  Berlin: "Culture",
  Tokyo: "Tech",
  Sydney: "Leisure",
  Rome: "Culture",
  Cairo: "Heritage",
  Bangkok: "Leisure",
  Istanbul: "Heritage",
  Dublin: "Leisure",
  Moscow: "Urban",
  Shanghai: "Tech",
  "Mexico City": "Culture",
  "Cape Town": "Adventure"
};

function setStatus(message, kind = "ok") {
  statusBanner.textContent = message;
  statusBanner.classList.remove("warn", "error");

  if (kind === "warn") statusBanner.classList.add("warn");
  if (kind === "error") statusBanner.classList.add("error");
}

function derivePriceBand(payment) {
  if (payment >= 1200) return "Premium";
  if (payment >= 600) return "Mid-Tier";
  return "Value";
}

function deriveTheme(destination) {
  return DESTINATION_THEME_MAP[destination] || "Explorer";
}

function normalizeTrip(row) {
  const startDateRaw = row.start_date || row.startDate || null;
  const startDate = startDateRaw ? new Date(startDateRaw) : null;
  const payment = Number(row.total_payment ?? row.payment ?? 0);

  return {
    id: row.travel_plan_id ?? row.id ?? 0,
    customerName: `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Unknown",
    destination: row.destination || "Unknown",
    status: row.status || "Unknown",
    paymentMethod: row.payment_method || row.paymentMethod || "Unknown",
    payment,
    rating: Number(row.avg_rating ?? row.rating ?? 0),
    activityCost: Number(row.total_activity_cost ?? row.activity_cost ?? 0),
    feedbackCount: Number(row.feedback_count ?? row.feedbackCount ?? 0),
    productTheme: deriveTheme(row.destination || "Unknown"),
    priceBand: derivePriceBand(payment),
    startDate
  };
}

async function loadTripsFromStaticJson() {
  if (Array.isArray(window.STATIC_TRIPS) && window.STATIC_TRIPS.length) {
    return window.STATIC_TRIPS.map(normalizeTrip);
  }

  const response = await fetch(STATIC_DATA_PATH);
  if (!response.ok) {
    throw new Error(`Static data request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Static data is not an array");
  }

  return data.map(normalizeTrip);
}

function uniqueValues(key) {
  return ["All", ...new Set(trips.map((row) => row[key]))];
}

function fillFilter(selectEl, values) {
  selectEl.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
}

function filterRows() {
  const selectedDestination = destinationFilter.value;
  const selectedStatus = statusFilter.value;
  const selectedPayment = paymentFilter.value;

  return trips.filter((row) => {
    const destinationMatch = selectedDestination === "All" || row.destination === selectedDestination;
    const statusMatch = selectedStatus === "All" || row.status === selectedStatus;
    const paymentMatch = selectedPayment === "All" || row.paymentMethod === selectedPayment;
    return destinationMatch && statusMatch && paymentMatch;
  });
}

function aggregateDestinations(rows) {
  const map = {};

  rows.forEach((row) => {
    if (!map[row.destination]) {
      map[row.destination] = {
        destination: row.destination,
        bookings: 0,
        completed: 0,
        revenue: 0,
        activityCost: 0,
        ratings: []
      };
    }

    const bucket = map[row.destination];
    bucket.bookings += 1;
    if (row.status.toLowerCase() === "completed") bucket.completed += 1;
    bucket.revenue += row.payment;
    bucket.activityCost += row.activityCost;
    if (row.rating > 0) bucket.ratings.push(row.rating);
  });

  return Object.values(map).map((bucket) => ({
    ...bucket,
    avgRating: bucket.ratings.length ? bucket.ratings.reduce((sum, value) => sum + value, 0) / bucket.ratings.length : 0,
    completionRate: bucket.bookings ? (bucket.completed / bucket.bookings) * 100 : 0
  }));
}

function sortDestinationStats(stats, focus) {
  const sorted = [...stats];
  if (focus === "bookings") sorted.sort((a, b) => b.bookings - a.bookings);
  else if (focus === "rating") sorted.sort((a, b) => b.avgRating - a.avgRating);
  else sorted.sort((a, b) => b.revenue - a.revenue);
  return sorted;
}

function groupCount(rows, key) {
  const map = {};
  rows.forEach((row) => {
    map[row[key]] = (map[row[key]] || 0) + 1;
  });
  return map;
}

function monthlyMetrics(rows) {
  const map = {};

  rows.forEach((row) => {
    if (!(row.startDate instanceof Date) || Number.isNaN(row.startDate.getTime())) return;
    const monthKey = `${row.startDate.getFullYear()}-${String(row.startDate.getMonth() + 1).padStart(2, "0")}`;

    if (!map[monthKey]) {
      map[monthKey] = { monthKey, bookings: 0, revenue: 0 };
    }

    map[monthKey].bookings += 1;
    map[monthKey].revenue += row.payment;
  });

  return Object.values(map).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

function topCustomers(rows) {
  const map = {};

  rows.forEach((row) => {
    if (!map[row.customerName]) {
      map[row.customerName] = { customerName: row.customerName, bookings: 0, totalPayment: 0, ratings: [] };
    }

    const bucket = map[row.customerName];
    bucket.bookings += 1;
    bucket.totalPayment += row.payment;
    if (row.rating > 0) bucket.ratings.push(row.rating);
  });

  return Object.values(map)
    .map((row) => ({
      ...row,
      avgRating: row.ratings.length ? row.ratings.reduce((sum, rating) => sum + rating, 0) / row.ratings.length : 0
    }))
    .sort((a, b) => b.totalPayment - a.totalPayment)
    .slice(0, 10);
}

function averageRating(rows) {
  const rated = rows.filter((row) => row.rating > 0);
  if (!rated.length) return 0;
  return rated.reduce((sum, row) => sum + row.rating, 0) / rated.length;
}

function averageActivityCost(rows) {
  if (!rows.length) return 0;
  return rows.reduce((sum, row) => sum + row.activityCost, 0) / rows.length;
}

function renderMetrics(rows) {
  const completed = rows.filter((row) => row.status.toLowerCase() === "completed").length;
  const totalRevenue = rows.reduce((sum, row) => sum + row.payment, 0);
  const totalActivity = rows.reduce((sum, row) => sum + row.activityCost, 0);
  const completionRate = rows.length ? (completed / rows.length) * 100 : 0;
  const avgRating = averageRating(rows);
  const avgActivityCost = averageActivityCost(rows);
  const marginProxy = totalRevenue ? ((totalRevenue - totalActivity) / totalRevenue) * 100 : 0;
  const avgFeedback = rows.length
    ? rows.reduce((sum, row) => sum + row.feedbackCount, 0) / rows.length
    : 0;

  const metricData = [
    { label: "Total Bookings", value: rows.length.toString() },
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}` },
    { label: "Completion Rate", value: `${completionRate.toFixed(1)}%` },
    { label: "Average Rating", value: avgRating.toFixed(2) },
    { label: "Cost-to-Revenue Efficiency", value: `${marginProxy.toFixed(1)}%` },
    { label: "Avg Activity Cost", value: `$${avgActivityCost.toFixed(2)}` },
    { label: "Avg Feedback Intensity", value: avgFeedback.toFixed(2) }
  ];

  metricsContainer.innerHTML = metricData
    .map(
      (metric) => `
        <article class="metric card">
          <p class="label">${metric.label}</p>
          <p class="value">${metric.value}</p>
        </article>
      `
    )
    .join("");

  animateMetricCards();
}

function renderInsights(rows, destinationStats) {
  const topByRevenue = [...destinationStats].sort((a, b) => b.revenue - a.revenue)[0];
  const topByRating = [...destinationStats].sort((a, b) => b.avgRating - a.avgRating)[0];
  const plannedTrips = rows.filter((row) => row.status.toLowerCase() === "planned").length;
  const completedTrips = rows.filter((row) => row.status.toLowerCase() === "completed").length;
  const lowRatings = rows.filter((row) => row.rating > 0 && row.rating < 4).length;
  const themeMix = groupCount(rows, "productTheme");
  const topTheme = Object.keys(themeMix).sort((a, b) => themeMix[b] - themeMix[a])[0];
  const topPayment = Object.keys(groupCount(rows, "paymentMethod")).sort((a, b) => groupCount(rows, "paymentMethod")[b] - groupCount(rows, "paymentMethod")[a])[0];

  const lines = [
    topByRevenue
      ? `${topByRevenue.destination} is the strongest revenue destination at $${topByRevenue.revenue.toFixed(2)}.`
      : "No destination-level revenue signal found for this filter.",
    topByRating
      ? `${topByRating.destination} has the best service score at ${topByRating.avgRating.toFixed(2)} average rating.`
      : "No rating signal available.",
    `Operational flow: ${plannedTrips} planned vs ${completedTrips} completed trips under current drilldown.`,
    topTheme
      ? `Derived product intelligence: ${topTheme} theme dominates the active segment mix.`
      : "No product-theme signal available.",
    topPayment
      ? `Payment behavior indicates ${topPayment} as the dominant transaction channel.`
      : "No payment channel signal available.",
    `${lowRatings} trips need service intervention due to rating below 4.0.`
  ];

  insightsList.innerHTML = lines.map((line) => `<li>${line}</li>`).join("");
}

function renderTopCustomers(rows) {
  const customers = topCustomers(rows);

  if (!customers.length) {
    topCustomersTableBody.innerHTML = "<tr><td colspan='4'>No customer rows available.</td></tr>";
    return;
  }

  topCustomersTableBody.innerHTML = customers
    .map(
      (customer) => `
      <tr data-customer="${customer.customerName}">
        <td>${customer.customerName}</td>
        <td>${customer.bookings}</td>
        <td>$${customer.totalPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
        <td>${customer.avgRating.toFixed(2)}</td>
      </tr>
    `
    )
    .join("");
}

function renderDestinationTable(destinationStats) {
  if (!destinationStats.length) {
    destinationDetailTableBody.innerHTML = "<tr><td colspan='5'>No destination rows available.</td></tr>";
    return;
  }

  destinationDetailTableBody.innerHTML = destinationStats
    .map(
      (row) => `
      <tr data-destination="${row.destination}">
        <td>${row.destination}</td>
        <td>${row.bookings}</td>
        <td>$${row.revenue.toFixed(2)}</td>
        <td>${row.avgRating.toFixed(2)}</td>
        <td>${row.completionRate.toFixed(1)}%</td>
      </tr>
    `
    )
    .join("");

  destinationDetailTableBody.querySelectorAll("tr").forEach((tr) => {
    tr.style.cursor = "pointer";
    tr.addEventListener("click", () => {
      destinationFilter.value = tr.dataset.destination;
      renderDashboard();
    });
  });
}

function renderHeatmap(rows) {
  const destinations = [...new Set(rows.map((row) => row.destination))].sort();
  const statuses = [...new Set(rows.map((row) => row.status))].sort();

  if (!destinations.length || !statuses.length) {
    heatmapContainer.innerHTML = "<p>No heatmap data available.</p>";
    return;
  }

  const matrix = {};
  let maxValue = 0;

  destinations.forEach((destination) => {
    matrix[destination] = {};
    statuses.forEach((status) => {
      const value = rows.filter((row) => row.destination === destination && row.status === status).length;
      matrix[destination][status] = value;
      if (value > maxValue) maxValue = value;
    });
  });

  let tableHtml = "<table class='heatmap-table'><thead><tr><th>Destination</th>";
  statuses.forEach((status) => {
    tableHtml += `<th>${status}</th>`;
  });
  tableHtml += "</tr></thead><tbody>";

  destinations.forEach((destination) => {
    tableHtml += `<tr><td>${destination}</td>`;
    statuses.forEach((status) => {
      const value = matrix[destination][status];
      const intensity = maxValue ? value / maxValue : 0;
      const bg = `rgba(34, 211, 238, ${0.12 + intensity * 0.58})`;
      tableHtml += `<td class='heat-cell' data-destination='${destination}' data-status='${status}' style='background:${bg}'>${value}</td>`;
    });
    tableHtml += "</tr>";
  });

  tableHtml += "</tbody></table>";
  heatmapContainer.innerHTML = tableHtml;

  heatmapContainer.querySelectorAll(".heat-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      destinationFilter.value = cell.dataset.destination;
      statusFilter.value = cell.dataset.status;
      renderDashboard();
    });
  });
}

function makeChart(canvasId, type, labels, data, color, extraOptions = {}, customDatasets = null) {
  return new Chart(document.getElementById(canvasId), {
    type,
    data: customDatasets
      ? { labels, datasets: customDatasets }
      : {
          labels,
          datasets: [
            {
              data,
              borderRadius: type === "bar" ? 8 : 0,
              backgroundColor: color,
              borderColor: "#ffffff",
              borderWidth: 1.1
            }
          ]
        },
    options: {
      responsive: true,
      plugins: {
        legend: { display: type === "pie" || type === "doughnut" }
      },
      scales: type === "pie" || type === "doughnut" ? {} : { y: { beginAtZero: true } },
      ...extraOptions
    }
  });
}

function destroyCharts() {
  [
    bookingsChart,
    revenueChart,
    statusChart,
    ratingByDestinationChart,
    monthlyTrendChart,
    revenueVsCostChart,
    paretoChart,
    paymentMethodChart,
    productThemeChart,
    priceBandChart,
    destinationStatusStackChart
  ].forEach((chart) => {
    if (chart) chart.destroy();
  });
}

function attachDrilldownClicks(destinationStats, statusMap, paymentMix) {
  bookingsChart.options.onClick = (_event, activeEls) => {
    if (!activeEls.length) return;
    destinationFilter.value = bookingsChart.data.labels[activeEls[0].index];
    renderDashboard();
  };

  statusChart.options.onClick = (_event, activeEls) => {
    if (!activeEls.length) return;
    const selected = Object.keys(statusMap)[activeEls[0].index];
    statusFilter.value = selected;
    renderDashboard();
  };

  paymentMethodChart.options.onClick = (_event, activeEls) => {
    if (!activeEls.length) return;
    const selected = Object.keys(paymentMix)[activeEls[0].index];
    paymentFilter.value = selected;
    renderDashboard();
  };

  revenueChart.options.onClick = (_event, activeEls) => {
    if (!activeEls.length) return;
    destinationFilter.value = revenueChart.data.labels[activeEls[0].index];
    renderDashboard();
  };

  bookingsChart.update();
  statusChart.update();
  paymentMethodChart.update();
  revenueChart.update();
}

function renderCharts(rows) {
  const focus = sortBySelect.value;
  const destinationStats = sortDestinationStats(aggregateDestinations(rows), focus);
  const statusMap = groupCount(rows, "status");
  const monthly = monthlyMetrics(rows);
  const paymentMix = groupCount(rows, "paymentMethod");
  const themeMix = groupCount(rows, "productTheme");
  const priceBandMix = groupCount(rows, "priceBand");

  const bubbleData = rows.map((row) => ({ x: row.activityCost, y: row.payment, r: 6 + Math.max(row.rating, 1) * 1.7 }));

  const paretoSorted = [...destinationStats].sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = paretoSorted.reduce((sum, row) => sum + row.revenue, 0);
  let cumulative = 0;
  const cumulativePercent = paretoSorted.map((row) => {
    cumulative += row.revenue;
    return totalRevenue ? Number(((cumulative / totalRevenue) * 100).toFixed(2)) : 0;
  });

  const statuses = [...new Set(rows.map((row) => row.status))];
  const stackedDatasets = statuses.map((status, index) => ({
    label: status,
    data: destinationStats.map((row) => rows.filter((trip) => trip.destination === row.destination && trip.status === status).length),
    backgroundColor: [CHART_COLORS.cyan, CHART_COLORS.orange, CHART_COLORS.indigo, CHART_COLORS.rose, CHART_COLORS.slate][index % 5]
  }));

  destroyCharts();

  bookingsChart = makeChart(
    "bookingsChart",
    "bar",
    destinationStats.map((row) => row.destination),
    destinationStats.map((row) => row.bookings),
    CHART_COLORS.cyan
  );

  revenueChart = makeChart(
    "revenueChart",
    "bar",
    destinationStats.map((row) => row.destination),
    destinationStats.map((row) => Number(row.revenue.toFixed(2))),
    CHART_COLORS.orange
  );

  statusChart = makeChart(
    "statusChart",
    "doughnut",
    Object.keys(statusMap),
    Object.values(statusMap),
    [CHART_COLORS.cyan, CHART_COLORS.orange, CHART_COLORS.indigo, CHART_COLORS.rose, CHART_COLORS.slate]
  );

  ratingByDestinationChart = makeChart(
    "ratingByDestinationChart",
    "bar",
    destinationStats.map((row) => row.destination),
    destinationStats.map((row) => Number(row.avgRating.toFixed(2))),
    CHART_COLORS.blue
  );

  monthlyTrendChart = makeChart(
    "monthlyTrendChart",
    "bar",
    monthly.map((row) => row.monthKey),
    [],
    CHART_COLORS.cyan,
    {
      scales: {
        y: { beginAtZero: true, position: "left", title: { display: true, text: "Bookings" } },
        y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Revenue" } }
      }
    },
    [
      {
        type: "line",
        label: "Bookings",
        data: monthly.map((row) => row.bookings),
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34, 211, 238, 0.22)",
        tension: 0.28,
        yAxisID: "y"
      },
      {
        type: "bar",
        label: "Revenue",
        data: monthly.map((row) => Number(row.revenue.toFixed(2))),
        backgroundColor: "rgba(249, 115, 22, 0.52)",
        yAxisID: "y1"
      }
    ]
  );

  revenueVsCostChart = makeChart(
    "revenueVsCostChart",
    "bubble",
    [],
    [],
    CHART_COLORS.orange,
    {
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Activity Cost" }, beginAtZero: true },
        y: { title: { display: true, text: "Total Payment" }, beginAtZero: true }
      }
    },
    [
      {
        label: "Trip Economics",
        data: bubbleData,
        backgroundColor: "rgba(249, 115, 22, 0.35)",
        borderColor: "rgba(34, 211, 238, 0.95)",
        borderWidth: 1.2
      }
    ]
  );

  paretoChart = makeChart(
    "paretoChart",
    "bar",
    paretoSorted.map((row) => row.destination),
    [],
    CHART_COLORS.blue,
    {
      scales: {
        y: { beginAtZero: true, position: "left", title: { display: true, text: "Revenue" } },
        y1: {
          beginAtZero: true,
          max: 100,
          position: "right",
          grid: { drawOnChartArea: false },
          title: { display: true, text: "Cumulative %" }
        }
      }
    },
    [
      {
        type: "bar",
        label: "Revenue",
        data: paretoSorted.map((row) => Number(row.revenue.toFixed(2))),
        backgroundColor: "rgba(56, 189, 248, 0.76)",
        yAxisID: "y"
      },
      {
        type: "line",
        label: "Cumulative %",
        data: cumulativePercent,
        borderColor: "#f97316",
        backgroundColor: "#f97316",
        tension: 0.3,
        yAxisID: "y1"
      }
    ]
  );

  paymentMethodChart = makeChart(
    "paymentMethodChart",
    "doughnut",
    Object.keys(paymentMix),
    Object.values(paymentMix),
    [CHART_COLORS.cyan, CHART_COLORS.orange, CHART_COLORS.indigo, CHART_COLORS.rose, CHART_COLORS.slate]
  );

  productThemeChart = makeChart(
    "productThemeChart",
    "doughnut",
    Object.keys(themeMix),
    Object.values(themeMix),
    [CHART_COLORS.violet, CHART_COLORS.cyan, CHART_COLORS.orange, CHART_COLORS.mint, CHART_COLORS.slate]
  );

  priceBandChart = makeChart(
    "priceBandChart",
    "bar",
    Object.keys(priceBandMix),
    Object.values(priceBandMix),
    CHART_COLORS.mint
  );

  destinationStatusStackChart = makeChart(
    "destinationStatusStackChart",
    "bar",
    destinationStats.map((row) => row.destination),
    [],
    CHART_COLORS.blue,
    {
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      }
    },
    stackedDatasets
  );

  attachDrilldownClicks(destinationStats, statusMap, paymentMix);
  renderInsights(rows, destinationStats);
  renderDestinationTable(destinationStats);
  renderHeatmap(rows);
}

function animateMetricCards() {
  const metricCards = Array.from(document.querySelectorAll(".metric"));
  metricCards.forEach((card, index) => {
    card.classList.add("reveal-seq");
    card.style.transitionDelay = `${Math.min(index * 60, 320)}ms`;
    requestAnimationFrame(() => card.classList.add("in-view"));
  });
}

function setupRevealAnimations() {
  if (revealObserver) revealObserver.disconnect();

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in-view");
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
  );

  const revealTargets = document.querySelectorAll(".status, .controls, .section-title-wrap, .grid > article, footer");
  revealTargets.forEach((node) => {
    node.classList.add("reveal-item");
    revealObserver.observe(node);
  });
}

function renderDashboard() {
  const rows = filterRows();

  if (!rows.length) {
    setStatus("No rows match the selected filters. Please broaden the filter criteria.", "warn");
    metricsContainer.innerHTML = "";
    insightsList.innerHTML = "";
    topCustomersTableBody.innerHTML = "<tr><td colspan='4'>No customer rows available.</td></tr>";
    destinationDetailTableBody.innerHTML = "<tr><td colspan='5'>No destination rows available.</td></tr>";
    heatmapContainer.innerHTML = "<p>No heatmap data available.</p>";
    destroyCharts();
    return;
  }

  setStatus("Static mode: advanced multi-dashboard analytics and drilldowns are active.");
  renderMetrics(rows);
  renderCharts(rows);
  renderTopCustomers(rows);
}

function initFilters() {
  fillFilter(destinationFilter, uniqueValues("destination"));
  fillFilter(statusFilter, uniqueValues("status"));
  fillFilter(paymentFilter, uniqueValues("paymentMethod"));

  destinationFilter.addEventListener("change", renderDashboard);
  statusFilter.addEventListener("change", renderDashboard);
  paymentFilter.addEventListener("change", renderDashboard);
  sortBySelect.addEventListener("change", renderDashboard);

  resetFilters.addEventListener("click", () => {
    destinationFilter.value = "All";
    statusFilter.value = "All";
    paymentFilter.value = "All";
    sortBySelect.value = "revenue";
    renderDashboard();
  });
}

function initMermaid() {
  if (window.mermaid) {
    window.mermaid.initialize({ startOnLoad: true, theme: "dark" });
  }
}

async function init() {
  try {
    trips = await loadTripsFromStaticJson();
    if (!trips.length) {
      setStatus("Static dataset loaded, but no rows were found.", "warn");
      return;
    }
  } catch (error) {
    setStatus("Could not load dataset. If running locally, open via a local server or ensure data.js exists.", "error");
    console.error(error);
    return;
  }

  initFilters();
  setupRevealAnimations();
  initMermaid();
  renderDashboard();
}

init();
