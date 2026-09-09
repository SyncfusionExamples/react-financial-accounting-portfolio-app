using Microsoft.EntityFrameworkCore;

namespace FinPortfolio.Database.Data;

/// <summary>
/// EF Core context for the Financial Accounting Portfolio database.
/// Migrations live in the dedicated database project.
/// </summary>
public class FinPortfolioDbContext : DbContext
{
    public FinPortfolioDbContext(DbContextOptions<FinPortfolioDbContext> options)
        : base(options)
    {
    }

    public DbSet<Portfolio> Portfolios => Set<Portfolio>();
    public DbSet<Holding> Holdings => Set<Holding>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<PortfolioSnapshot> PortfolioSnapshots => Set<PortfolioSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Portfolio>(e =>
        {
            e.ToTable("portfolios");
            e.HasKey(p => p.Id);
            e.Property(p => p.Name).IsRequired().HasMaxLength(200);
            e.Property(p => p.Description).HasMaxLength(1000);
            e.Property(p => p.BaseCurrency).IsRequired().HasMaxLength(3);
        });

        modelBuilder.Entity<Holding>(e =>
        {
            e.ToTable("holdings");
            e.HasKey(h => h.Id);
            e.Property(h => h.Symbol).IsRequired().HasMaxLength(20);
            e.Property(h => h.AssetName).IsRequired().HasMaxLength(200);
            e.Property(h => h.MarketValue).HasPrecision(18, 2);
            e.Property(h => h.AverageCostBasis).HasPrecision(18, 4);
            e.Property(h => h.CurrentPrice).HasPrecision(18, 4);
            e.Property(h => h.UnrealizedGainLoss).HasPrecision(18, 2);
            e.Property(h => h.UnrealizedGainLossPercent).HasPrecision(9, 4);

            e.HasOne(h => h.Portfolio)
             .WithMany(p => p.Holdings)
             .HasForeignKey(h => h.PortfolioId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Account>(e =>
        {
            e.ToTable("accounts");
            e.HasKey(a => a.Id);
            e.Property(a => a.Name).IsRequired().HasMaxLength(200);
            e.Property(a => a.AccountType).IsRequired().HasMaxLength(50);
            e.Property(a => a.Institution).HasMaxLength(200);
            e.Property(a => a.Currency).IsRequired().HasMaxLength(3);
            e.Property(a => a.CurrentBalance).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.ToTable("transactions");
            e.HasKey(t => t.Id);
            e.Property(t => t.Type).IsRequired().HasMaxLength(30);
            e.Property(t => t.Status).IsRequired().HasMaxLength(20);
            e.Property(t => t.Symbol).HasMaxLength(20);
            e.Property(t => t.Amount).HasPrecision(18, 2);
            e.Property(t => t.Quantity).HasPrecision(18, 6);
            e.Property(t => t.Notes).HasMaxLength(500);
            e.HasOne(t => t.Account)
             .WithMany(a => a.Transactions)
             .HasForeignKey(t => t.AccountId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LedgerEntry>(e =>
        {
            e.ToTable("ledger_entries");
            e.HasKey(l => l.Id);
            e.Property(l => l.AccountCode).IsRequired().HasMaxLength(20);
            e.Property(l => l.Account).IsRequired().HasMaxLength(200);
            e.Property(l => l.Description).HasMaxLength(500);
            e.Property(l => l.Debit).HasPrecision(18, 2);
            e.Property(l => l.Credit).HasPrecision(18, 2);
        });

        modelBuilder.Entity<PortfolioSnapshot>(e =>
        {
            e.ToTable("portfolio_snapshots");
            e.HasKey(s => s.Id);
            e.Property(s => s.Value).HasPrecision(18, 2);
            e.Property(s => s.BenchmarkValue).HasPrecision(18, 2);
        });
    }
}
