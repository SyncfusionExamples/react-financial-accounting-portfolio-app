namespace FinPortfolio.Database.Data;

/// <summary>A named collection of investment holdings.</summary>
public class Portfolio
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string BaseCurrency { get; set; } = "USD";
    public DateTime CreatedAt { get; set; }

    public ICollection<Holding> Holdings { get; set; } = new List<Holding>();
}

/// <summary>A single security position (stock, fund, ETF, or bond).</summary>
public class Holding
{
    public int Id { get; set; }
    public int PortfolioId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;

    /// <summary>Stock, MutualFund, Etf, or Bond.</summary>
    public string AssetClass { get; set; } = "Stock";

    public decimal Quantity { get; set; }
    public decimal AverageCostBasis { get; set; }
    public decimal CurrentPrice { get; set; }
    public decimal MarketValue { get; set; }
    public decimal UnrealizedGainLoss { get; set; }
    public decimal UnrealizedGainLossPercent { get; set; }

    public Portfolio Portfolio { get; set; } = null!;
}

/// <summary>A cash or investment account (bank, brokerage, cash, credit).</summary>
public class Account
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Cash, Brokerage, Savings, CreditCard, etc.</summary>
    public string AccountType { get; set; } = "Cash";

    public string Institution { get; set; } = string.Empty;
    public string Currency { get; set; } = "USD";
    public decimal CurrentBalance { get; set; }

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}

/// <summary>A financial transaction: trade, deposit, withdrawal, transfer, income, expense.</summary>
public class Transaction
{
    public int Id { get; set; }
    public DateTime TransactionDate { get; set; }

    /// <summary>Buy, Sell, Deposit, Withdrawal, TransferIn, TransferOut, Income, Expense.</summary>
    public string Type { get; set; } = "Deposit";

    public int AccountId { get; set; }
    public string? Symbol { get; set; }
    public decimal? Quantity { get; set; }
    public decimal Amount { get; set; }

    /// <summary>Pending, Completed, Failed, or Cancelled.</summary>
    public string Status { get; set; } = "Completed";

    public string? Notes { get; set; }

    public Account Account { get; set; } = null!;
}

/// <summary>A double-entry general ledger line (debit/credit pair share a journal group).</summary>
public class LedgerEntry
{
    public int Id { get; set; }
    public int? JournalId { get; set; }
    public DateTime EntryDate { get; set; }
    public string AccountCode { get; set; } = string.Empty;
    public string Account { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
}

/// <summary>Historical portfolio valuation at a point in time (for trend charts).</summary>
public class PortfolioSnapshot
{
    public int Id { get; set; }
    public DateTime SnapshotDate { get; set; }
    public decimal Value { get; set; }
    public decimal? BenchmarkValue { get; set; }
}
