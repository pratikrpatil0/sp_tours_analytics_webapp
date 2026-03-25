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
