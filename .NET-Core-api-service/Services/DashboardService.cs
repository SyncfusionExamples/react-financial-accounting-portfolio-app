using FinPortfolio.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace FinPortfolio.Api.Services;

/// <summary>Aggregated metrics for the dashboard and analytics screens.</summary>
public class DashboardService
{
    private readonly FinPortfolioDbContext _db;

    public DashboardService(FinPortfolioDbContext db) => _db = db;

    public async Task<object> GetSummaryAsync()
    {
        var holdings = await _db.Holdings.AsNoTracking().ToListAsync();
        var accounts = await _db.Accounts.AsNoTracking().ToListAsync();
        var recentTransactions = await _db.Transactions
            .AsNoTracking()
            .OrderByDescending(t => t.TransactionDate)
            .Take(10)
            .Select(t => new
            {
                t.Id,
                t.TransactionDate,
                t.Type,
                AccountName = t.Account.Name,
                t.Symbol,
                t.Amount,
                t.Status,
            })
            .ToListAsync();

        var snapshots = await _db.PortfolioSnapshots
            .AsNoTracking()
            .OrderBy(s => s.SnapshotDate)
            .ToListAsync();

        decimal portfolioValue = holdings.Sum(h => h.MarketValue);
        decimal cash = accounts.Sum(a => a.CurrentBalance);
        decimal unrealized = holdings.Sum(h => h.UnrealizedGainLoss);
        decimal costBasis = holdings.Sum(h => h.AverageCostBasis * h.Quantity);
        decimal unrealizedPct = costBasis == 0
            ? 0
            : unrealized / costBasis * 100m;

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthTransactions = await _db.Transactions
            .AsNoTracking()
            .Where(t => t.TransactionDate >= monthStart)
            .ToListAsync();
        decimal monthlyIncome = monthTransactions
            .Where(t => t.Type == "Income" || t.Type == "Deposit")
            .Sum(t => t.Amount);
        decimal monthlyExpenses = monthTransactions
            .Where(t => t.Type == "Expense" || t.Type == "Withdrawal")
            .Sum(t => t.Amount);

        return new
        {
            PortfolioValue = portfolioValue,
            TotalAssets = portfolioValue + cash,
            TotalLiabilities = 0m,
            NetWorth = portfolioValue + cash,
            UnrealizedGainLoss = unrealized,
            UnrealizedGainLossPercent = unrealizedPct,
            RealizedGainLoss = 0m,
            CashOnHand = cash,
            MonthlyIncome = monthlyIncome,
            MonthlyExpenses = monthlyExpenses,
            RecentTransactions = recentTransactions,
            InvestmentDistribution = holdings
                .GroupBy(h => h.AssetClass)
                .Select(g => new
                {
                    AssetClass = g.Key,
                    Label = g.Key,
                    MarketValue = g.Sum(h => h.MarketValue),
                })
                .ToList(),
            PortfolioHistory = snapshots.Select(s => new
            {
                s.SnapshotDate,
                s.Value,
                s.BenchmarkValue,
            }).ToList(),
        };
    }
}