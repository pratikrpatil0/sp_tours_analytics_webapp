# SP Tours Advanced Analytics Dashboard

This project is fully static, interactive, and ready for GitHub Pages.

## Architecture

- `index.html`: multi-section dashboard structure
- `styles.css`: premium visual styling and responsive layout
- `script.js`: analytics engine, transformations, and chart rendering
- `data.json`: dataset snapshot
- `data.js`: embedded dataset fallback for direct file opening

No backend is required at runtime.

## Analytics Flow

1. Data loads from `data.js`/`data.json`.
2. User applies filters (destination, status) and ranking focus (revenue/bookings/rating).
3. Dashboard recalculates all metrics and charts from the filtered dataset.
4. Executive insights and top-customer intelligence update automatically.

## Advanced Modules Included

- KPI intelligence layer:
	- total bookings
	- total revenue
	- completion rate
	- average rating
	- efficiency proxy (cost-to-revenue)
	- average activity cost
- Performance overview:
	- bookings by destination
	- revenue by destination
	- status mix
	- average rating by destination
- Trend and efficiency analytics:
	- monthly bookings and revenue trend (combo chart)
	- revenue vs activity cost economics (bubble chart)
	- Pareto-style destination impact (revenue + cumulative %)
- Customer/action intelligence:
	- payment method mix
	- executive insight bullets
	- top customers by payment with bookings and average rating

## Run Locally

You can open `index.html` directly, or use a local server:

python -m http.server 5500

Then open:

http://127.0.0.1:5500/index.html

## Deploy on GitHub Pages

1. Push this folder to GitHub.
2. Open repository Settings -> Pages.
3. Source: Deploy from a branch.
4. Branch: main, folder: root.
5. Save and open your Pages URL.

## Refresh Dataset Later

When you get a new export, update `data.json` and regenerate `data.js` in the same format, then push.

## SECTION-2: Enterprise BI Data Visualization Questions (Assignment Answer)

### 11. Data Visualization Graphs Showing Bookings per Destination and Other Insights

The interactive dashboard includes a full set of visualization graphs equivalent to Power BI/Tableau style analytics.

Implemented graph set:

- Bookings by Destination (bar chart)
- Revenue by Destination (bar chart)
- Status Mix (doughnut chart)
- Average Rating by Destination (bar chart)
- Monthly Booking and Revenue Trend (combo line+bar)
- Revenue vs Activity Cost (bubble chart)
- Destination Revenue Share and Cumulative Impact (Pareto chart)
- Payment Method Mix (doughnut chart)
- Product Theme Mix (derived intelligence chart)
- Price Band Distribution (derived intelligence chart)
- Destination x Status Drilldown (stacked bar)
- Destination-Status Heatmap Drilldown (interactive table heatmap)

Intelligence insights extracted from current dataset snapshot (`data.json`):

- Total bookings: 15
- Destination count: 15 unique destinations
- Booking distribution by destination: 1 booking each (uniform spread)
- Total revenue: $1,500
- Average rating: 4.67/5
- Completed vs Planned: 1 completed, 14 planned
- Completion rate: 6.7%
- Highest execution destination: Istanbul with 100% completion (1/1)
- Peak revenue month: 2024-05 with 4 bookings and $400 revenue
- Cost-to-revenue efficiency proxy: 52.3%

These insights are generated dynamically by the dashboard logic and visible in both KPI cards and chart-level insight text.

### 12. Dashboard for Customer Ratings and Feedback Correlated with Destinations and Hotels

The dashboard supports correlation and drilldown analysis between customer quality signals and travel dimensions:

- Ratings by destination are visualized in "Average Rating by Destination".
- Feedback intensity is computed and shown as KPI "Avg Feedback Intensity".
- Destination-specific quality and execution are shown in the "Destination Drilldown Table" with bookings, revenue, rating, and completion %.
- Customer-level quality intelligence is shown in "Top Customers by Total Payment" including average rating.
- Interactive drilldowns are enabled by clicking charts, heatmap cells, and destination table rows to filter destination/status/payment channel instantly.

Correlation findings from the current snapshot:

- High service satisfaction overall: average rating is 4.67/5.
- No severe dissatisfaction cases in current data: ratings below 4.0 are 0.
- Best-rated destinations (5.0 average) include Paris, Tokyo, Rome, Cairo, Istanbul, Moscow, Mexico City, and Cape Town.
- All payments are currently through Credit Card, indicating concentrated channel behavior.
- Since each trip uses a distinct hotel name in this snapshot, destination-rating correlation is stronger than hotel-level trend grouping in the current dataset.

### Evidence for Q11 and Q12

Evidence available directly in this project:

1. Interactive dashboard UI with all chart components is defined in `index.html`.
2. Metrics, chart rendering, and insight-generation logic are implemented in `script.js`.
3. Assignment dataset snapshot used for analysis is stored in `data.json` and fallback `data.js`.
4. Dynamic chart evidence text is produced by `renderChartInsights()` in `script.js`.
5. Executive intelligence evidence text is produced by `renderInsights()` in `script.js`.

How to present evidence in your assignment submission:

1. Add screenshots of the dashboard sections:
	- Performance Overview
	- Trend and Efficiency Analytics
	- Customer and Actions Intelligence
2. Add one screenshot showing drilldown interaction (for example, click a heatmap cell and show filtered dashboard).
3. Include the numeric insights listed above as "Observed Results from Dashboard".
4. Mention that the dashboard is fully interactive and recalculates insights under filter combinations.
