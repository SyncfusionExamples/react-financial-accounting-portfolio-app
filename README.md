# Financial Accounting & Portfolio Management

A full-stack personal finance application for tracking accounts, investment portfolios, holdings, transactions, and double-entry ledger accounting — with a React dashboard showing real-time analytics.

![.NET](https://img.shields.io/badge/.NET-10.0-512BD4) ![React](https://img.shields.io/badge/React-19-61DAFB) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## Projects

| Project | Type | URL |
| ------- | ---- | --- |
| `React-frontend` | React + Vite frontend (Syncfusion UI) | http://localhost:5173 |
| `.NET-Core-api-service` | ASP.NET Core REST API | http://localhost:5130 |
| `Database` | EF Core class library (entities + migrations) | — |

## Prerequisites

- [.NET SDK 10.0](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 16](https://www.postgresql.org/download/)

## Database Connection

Configure in `.NET-Core-api-service/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=finportfolio;Username=postgres;Password=postgres"
  }
}
```

- The API **auto-migrates and seeds** the database on startup in Development — no manual setup needed.
- To apply migrations manually:

```powershell
cd Database
dotnet ef database update --project . --startup-project .
```

## Frontend ↔ Backend Connection

The frontend consumes the API via Redux Toolkit Query, based on the URL in the frontend `.env` file.

`React-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5130/api
```

- All RTK Query endpoints are typed and defined in `src/api/apiSlice.ts`.
- The API allows cross-origin requests from `http://localhost:5173` via the `FrontendDev` CORS policy (see `Program.cs`).

## Steps to Run

1. **Start the backend** (migrates + seeds the database automatically):

   ```powershell
   dotnet run --project .NET-Core-api-service
   ```

2. **Install frontend dependencies** (first time only):

   ```powershell
   cd React-frontend
   npm install
   ```

3. **Start the frontend**:

   ```powershell
   npm run dev
   ```

4. Open **http://localhost:5173** in your browser.


## Syncfusion Licensing (frontend)

Set your license key as an environment variable and activate it:

```powershell
$env:SYNCFUSION_LICENSE = "<your-license-key>"
npx syncfusion-license activate
```

## Features

- 📊 **Dashboard** — account balances, portfolio value, profit/loss summary charts
- 💼 **Portfolio** — holdings across multiple portfolios with value and allocation
- 💸 **Transactions** — buy/sell/dividend/income/expense entries with a Syncfusion Grid
- 📒 **Ledger** — double-entry accounting entries per transaction
- 📈 **Analytics** — report-style views over the ledger
