using Microsoft.EntityFrameworkCore;

namespace FinPortfolio.Database.Data;

/// <summary>
/// Seeds a realistic demo dataset: 3 portfolios, 6 accounts, 12 holdings,
/// 50 transactions with matching double-entry ledger rows, and 12 months of
/// portfolio valuation snapshots.
/// </summary>
public static class DbSeeder
{
    // Deterministic pseudo-random source so every machine gets the same demo data.
    private static readonly Random Rand = new(20260909);

    public static async Task SeedAsync(FinPortfolioDbContext db)
    {
        if (await db.Portfolios.AnyAsync())
        {
            return; // Already seeded
        }

        // ===== Portfolios =====
        var growth = new Portfolio
        {
            Name = "Growth Portfolio",
            Description = "Long-term equity growth strategy",
            BaseCurrency = "USD",
            CreatedAt = DateTime.UtcNow.AddYears(-2),
        };
        var income = new Portfolio
        {
            Name = "Income Portfolio",
            Description = "Dividend and fixed-income focus",
            BaseCurrency = "USD",
            CreatedAt = DateTime.UtcNow.AddYears(-1),
        };
        var tech = new Portfolio
        {
            Name = "Tech Portfolio",
            Description = "Technology sector concentration",
            BaseCurrency = "USD",
            CreatedAt = DateTime.UtcNow.AddMonths(-8),
        };
        db.Portfolios.AddRange(growth, income, tech);

        // ===== Accounts =====
        var mainBrokerage = new Account
        {
            Name = "Main Brokerage",
            AccountType = "Brokerage",
            Institution = "Local Bank",
            Currency = "USD",
            CurrentBalance = 0m,
        };
        var highYieldSavings = new Account
        {
            Name = "High-Yield Savings",
            AccountType = "Savings",
            Institution = "Local Bank",
            Currency = "USD",
            CurrentBalance = 0m,
        };
        var everydayChecking = new Account
        {
            Name = "Everyday Checking",
            AccountType = "Cash",
            Institution = "Local Bank",
            Currency = "USD",
            CurrentBalance = 0m,
        };
        var marginAccount = new Account
        {
            Name = "Margin Account",
            AccountType = "Brokerage",
            Institution = "Global Traders",
            Currency = "USD",
            CurrentBalance = 0m,
        };
        var retirementIra = new Account
        {
            Name = "Retirement IRA",
            AccountType = "Retirement",
            Institution = "Future Vision",
            Currency = "USD",
            CurrentBalance = 0m,
        };
        var rewardsCard = new Account
        {
            Name = "Rewards Credit Card",
            AccountType = "CreditCard",
            Institution = "Platinum Card Co.",
            Currency = "USD",
            CurrentBalance = 0m,
        };
        db.Accounts.AddRange(mainBrokerage, highYieldSavings, everydayChecking, marginAccount, retirementIra, rewardsCard);

        await db.SaveChangesAsync(); // assign IDs

        // ===== Holdings (12 positions) =====
        // (portfolio, symbol, name, class, qty, costBasis, currentPrice)
        var holdingSpecs = new (Portfolio portfolio, string symbol, string name, string assetClass, decimal qty, decimal cost, decimal price)[]
        {
            (growth, "MSFT", "Microsoft Corp.", "Stock", 120m, 310.00m, 415.50m),
            (growth, "AAPL", "Apple Inc.", "Stock", 85m, 155.00m, 232.40m),
            (growth, "NVDA", "NVIDIA Corp.", "Stock", 60m, 480.00m, 891.20m),
            (growth, "V", "Visa Inc.", "Stock", 100m, 220.00m, 279.80m),
            (growth, "VOO", "Vanguard S&P 500 ETF", "Etf", 150m, 395.00m, 521.10m),

            (income, "JNJ", "Johnson & Johnson", "Stock", 200m, 148.00m, 162.35m),
            (income, "KO", "Coca-Cola Co.", "Stock", 300m, 54.00m, 68.90m),
            (income, "SCHD", "Schwab US Dividend ETF", "Etf", 250m, 72.00m, 84.75m),
            (income, "BND", "Vanguard Total Bond ETF", "Bond", 400m, 74.50m, 71.20m),
            (income, "AGG", "iShares Core US Agg Bond", "Bond", 180m, 99.00m, 96.40m),

            (tech, "GOOGL", "Alphabet Inc.", "Stock", 90m, 118.00m, 178.25m),
            (tech, "META", "Meta Platforms", "Stock", 45m, 295.00m, 518.60m),
        };

        foreach (var (portfolio, symbol, name, assetClass, qty, cost, price) in holdingSpecs)
        {
            var marketValue = decimal.Round(qty * price, 2);
            var gainLoss = decimal.Round(qty * (price - cost), 2);
            var costTotal = qty * cost;
            db.Holdings.Add(new Holding
            {
                PortfolioId = portfolio.Id,
                Symbol = symbol,
                AssetName = name,
                AssetClass = assetClass,
                Quantity = qty,
                AverageCostBasis = cost,
                CurrentPrice = price,
                MarketValue = marketValue,
                UnrealizedGainLoss = gainLoss,
                UnrealizedGainLossPercent = costTotal == 0 ? 0m : decimal.Round(gainLoss / costTotal * 100m, 2),
            });
        }

        // ===== Transactions (50 records with ledger side effects) =====
        var accounts = new[] { mainBrokerage, highYieldSavings, everydayChecking, marginAccount, retirementIra, rewardsCard };
        var journalCounter = 0;

        // Helper: records a transaction + updates the account balance + writes 2 ledger lines.
        void Record(
            DateTime date,
            string type,
            Account account,
            decimal amount,
            string? symbol = null,
            decimal? quantity = null,
            string? notes = null,
            string status = "Completed")
        {
            // Skip anything older than 12 months for balance relevance.
            int sign = type switch
            {
                "Buy" or "Withdrawal" or "TransferOut" or "Expense" => -1,
                "Sell" or "Deposit" or "TransferIn" or "Income" => 1,
                _ => 0,
            };
            account.CurrentBalance += sign * amount;

            journalCounter++;
            const string cashCode = "1000"; // Assets:Cash
            string offsetCode = type switch
            {
                "Buy" or "Sell" => "1500",   // Assets:Investments
                "Deposit" or "Withdrawal" => "3900", // Equity:Contributions
                "Income" => "4000",
                "Expense" => "5000",
                _ => "1000",
            };
            bool debitOnCash = sign < 0;

            db.Transactions.Add(new Transaction
            {
                TransactionDate = DateTime.SpecifyKind(date, DateTimeKind.Utc),
                Type = type,
                AccountId = account.Id,
                Symbol = symbol,
                Quantity = quantity,
                Amount = amount,
                Status = status,
                Notes = notes,
            });

            db.LedgerEntries.AddRange(
                new LedgerEntry
                {
                    JournalId = journalCounter,
                    EntryDate = DateTime.SpecifyKind(date, DateTimeKind.Utc),
                    AccountCode = cashCode,
                    Account = "Assets:Cash",
                    Description = $"{type} — {account.Name}",
                    Debit = debitOnCash ? amount : 0m,
                    Credit = debitOnCash ? 0m : amount,
                },
                new LedgerEntry
                {
                    JournalId = journalCounter,
                    EntryDate = DateTime.SpecifyKind(date, DateTimeKind.Utc),
                    AccountCode = offsetCode,
                    Account = offsetCode switch
                    {
                        "1500" => "Assets:Investments",
                        "4000" => "Income",
                        "5000" => "Expenses",
                        _ => "Equity:Contributions",
                    },
                    Description = $"{type} — {symbol ?? account.Name}",
                    Debit = debitOnCash ? 0m : amount,
                    Credit = debitOnCash ? amount : 0m,
                });
        }

        var today = DateTime.UtcNow.Date;
        var monthsAgo = (int months) => today.AddMonths(-months);

        // --- 18 months of salary deposits into checking (~monthly cadence) ---
        for (var monthBack = 17; monthBack >= 6; monthBack--)
        {
            Record(
                monthsAgo(monthBack).AddDays(1),
                "Deposit",
                everydayChecking,
                decimal.Round(5200m + (decimal)(Rand.NextDouble() * 400), 2),
                notes: "Bi-monthly salary");
        }

        // --- Initial capital injections ---
        Record(monthsAgo(17), "Deposit", mainBrokerage, 25000m, notes: "Account opening transfer");
        Record(monthsAgo(16), "Deposit", retirementIra, 12000m, notes: "IRA annual funding");
        Record(monthsAgo(15), "TransferIn", highYieldSavings, 8000m, notes: "Emergency fund");

        // --- Buys and sells ---
        Record(monthsAgo(16), "Buy", mainBrokerage, 9300m, "MSFT", 30m, "Opening position");
        Record(monthsAgo(15), "Buy", mainBrokerage, 4650m, "AAPL", 30m, "Opening position");
        Record(monthsAgo(14), "Buy", marginAccount, 24000m, "NVDA", 50m, "Momentum entry");
        Record(monthsAgo(13), "Buy", retirementIra, 5925m, "VOO", 15m, "Core allocation");
        Record(monthsAgo(12), "Buy", mainBrokerage, 3600m, "SCHD", 50m, "Dividend tilt");
        Record(monthsAgo(11), "Sell", mainBrokerage, 2600m, "AAPL", 20m, "Rebalance trim");
        Record(monthsAgo(10), "Sell", marginAccount, 12000m, "NVDA", 25m, "Profit taking");
        Record(monthsAgo(9), "Buy", mainBrokerage, 5400m, "META", 18m, "Sector add");
        Record(monthsAgo(8), "Buy", retirementIra, 4455m, "GOOGL", 45m, "Sector add");
        Record(monthsAgo(7), "Buy", mainBrokerage, 14800m, "BND", 200m, "Bond ladder");
        Record(monthsAgo(6), "Sell", mainBrokerage, 3750m, "VOO", 10m, "Tax-loss window");
        Record(monthsAgo(5), "Buy", highYieldSavings, 5000m, "AGG", 50m, "Fixed income");
        Record(monthsAgo(4), "Buy", mainBrokerage, 8900m, "NVDA", 10m, "Re-entry");
        Record(monthsAgo(3), "Buy", mainBrokerage, 2240m, "KO", 40m, "Defensive add");
        Record(monthsAgo(2), "Sell", retirementIra, 2600m, "GOOGL", 12m, "Rebalance trim");

        // --- Buys and sells end; recurring income ---
        for (var monthBack = 11; monthBack >= 0; monthBack--)
        {
            var incomeDate = monthsAgo(monthBack).AddDays(14);
            if (incomeDate > today)
            {
                incomeDate = today.AddDays(-(2 + journalCounter % 5)); // keep dates in the past
            }
            Record(
                incomeDate,
                "Income",
                mainBrokerage,
                decimal.Round(85m + (decimal)(Rand.NextDouble() * 60), 2),
                notes: "Dividend distribution");
        }

        // --- Recurring expenses and withdrawals ---
        Record(monthsAgo(10), "Expense", rewardsCard, 890.55m, notes: "Travel booking");
        Record(monthsAgo(8), "Expense", rewardsCard, 1240.10m, notes: "Insurance premium");
        Record(monthsAgo(6), "Expense", everydayChecking, 675.30m, notes: "Home maintenance");
        Record(monthsAgo(4), "Expense", rewardsCard, 512.87m, notes: "Electronics purchase");
        Record(monthsAgo(2), "Expense", everydayChecking, 329.99m, notes: "Utilities bundle");
        Record(monthsAgo(1), "Withdrawal", highYieldSavings, 1500m, notes: "Planned savings draw");
        Record(monthsAgo(0), "Expense", rewardsCard, 418.62m, notes: "Groceries and dining");

        // --- A few pending / failed items for realism ---
        Record(today.AddDays(-2), "Buy", mainBrokerage, 3100m, "V", 11m, "Pending settlement", status: "Pending");
        Record(today.AddDays(-1), "TransferOut", everydayChecking, 2000m, notes: "Awaiting processing", status: "Pending");

        // ===== Portfolio snapshots (last 12 months, upward trend with noise) =====
        decimal snapshotValue = 210000m;
        for (var monthBack = 11; monthBack >= 0; monthBack--)
        {
            snapshotValue += (decimal)(Rand.NextDouble() * 9500) - 2600m;
            if (snapshotValue < 180000m) snapshotValue = 180000m + (decimal)(Rand.NextDouble() * 5000);
            db.PortfolioSnapshots.Add(new PortfolioSnapshot
            {
                SnapshotDate = DateTime.SpecifyKind(monthsAgo(monthBack), DateTimeKind.Utc),
                Value = decimal.Round(snapshotValue, 2),
                BenchmarkValue = decimal.Round(snapshotValue * (0.88m + (decimal)(Rand.NextDouble() * 0.1)), 2),
            });
        }

        await db.SaveChangesAsync();
    }
}
