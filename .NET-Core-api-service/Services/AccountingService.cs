using FinPortfolio.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace FinPortfolio.Api.Services;

/// <summary>Accounts and general ledger queries plus report builders.</summary>
public class AccountingService
{
    private readonly FinPortfolioDbContext _db;

    public AccountingService(FinPortfolioDbContext db) => _db = db;

    public Task<List<Account>> GetAccountsAsync() =>
        _db.Accounts.AsNoTracking().OrderBy(a => a.Name).ToListAsync();

    public Task<List<LedgerEntry>> GetLedgerAsync() =>
        _db.LedgerEntries.AsNoTracking().OrderByDescending(l => l.EntryDate).ToListAsync();
}