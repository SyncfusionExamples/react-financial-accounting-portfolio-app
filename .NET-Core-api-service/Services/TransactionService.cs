using FinPortfolio.Api.Models;
using FinPortfolio.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace FinPortfolio.Api.Services;

/// <summary>Transaction CRUD plus account-balance and ledger side effects.</summary>
public class TransactionService
{
    private readonly FinPortfolioDbContext _db;

    public TransactionService(FinPortfolioDbContext db) => _db = db;

    public async Task<List<TransactionResponse>> GetTransactionsAsync() =>
        await _db.Transactions
            .AsNoTracking()
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => ToResponse(t, t.Account.Name))
            .ToListAsync();

    public async Task<TransactionResponse> CreateAsync(Transaction tx)
    {
        tx.TransactionDate = DateTime.SpecifyKind(tx.TransactionDate, DateTimeKind.Utc);
        _db.Transactions.Add(tx);
        await _db.Entry(tx).Reference(t => t.Account).LoadAsync();
        ApplyToAccount(tx);
        await AddLedgerEntriesAsync(tx);
        await _db.SaveChangesAsync();
        return ToResponse(tx, tx.Account.Name);
    }

    public async Task<TransactionResponse?> UpdateAsync(int id, Transaction updated)
    {
        var tx = await _db.Transactions.Include(t => t.Account).FirstOrDefaultAsync(t => t.Id == id);
        if (tx is null) return null;

        ApplyToAccount(tx, reverse: true);
        tx.TransactionDate = DateTime.SpecifyKind(updated.TransactionDate, DateTimeKind.Utc);
        tx.Type = updated.Type;
        tx.AccountId = updated.AccountId;
        tx.Symbol = updated.Symbol;
        tx.Quantity = updated.Quantity;
        tx.Amount = updated.Amount;
        tx.Status = updated.Status;
        tx.Notes = updated.Notes;
        if (tx.Account is null)
        {
            await _db.Entry(tx).Reference(t => t.Account).LoadAsync();
        }
        ApplyToAccount(tx);
        await _db.SaveChangesAsync();
        return ToResponse(tx, tx.Account?.Name);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var tx = await _db.Transactions.FindAsync(id);
        if (tx is null) return false;

        await _db.Entry(tx).Reference(t => t.Account).LoadAsync();
        ApplyToAccount(tx, reverse: true);
        _db.Transactions.Remove(tx);
        await _db.SaveChangesAsync();
        return true;
    }

    internal static TransactionResponse ToResponse(Transaction t, string? accountName) => new()
    {
        Id = t.Id,
        TransactionDate = t.TransactionDate,
        Type = t.Type,
        AccountId = t.AccountId,
        AccountName = accountName,
        Symbol = t.Symbol,
        Quantity = t.Quantity,
        Amount = t.Amount,
        Status = t.Status,
        Notes = t.Notes,
    };

    /// <summary>Applies the transaction's cash effect to its account (or reverses it).</summary>
    private static void ApplyToAccount(Transaction tx, bool reverse = false)
    {
        if (tx.Account is null) return;

        int sign = tx.Type switch
        {
            "Buy" or "Withdrawal" or "TransferOut" or "Expense" => -1,
            "Sell" or "Deposit" or "TransferIn" or "Income" => 1,
            _ => 0,
        };
        if (reverse) sign *= -1;
        if (sign == 0) return;

        // Buys/sells post the total amount against cash.
        tx.Account.CurrentBalance += sign * tx.Amount;
    }

    private async Task AddLedgerEntriesAsync(Transaction tx)
    {
        // Simple two-line journal: a cash/bank line vs an offsetting account.
        const string cashAccountCode = "1000"; // Assets:Cash
        string offsetCode = tx.Type switch
        {
            "Buy" => "1500",        // Assets:Investments
            "Sell" => "1500",
            "Deposit" => "3900",    // Equity:Contributions
            "Withdrawal" => "3900",
            "Income" => "4000",     // Income
            "Expense" => "5000",    // Expenses
            _ => "1000",
        };

        bool isDebitOnCash = tx.Type is "Buy" or "Withdrawal" or "TransferOut" or "Expense";

        var journalId = await _db.LedgerEntries.CountAsync() + 1;
        _db.LedgerEntries.AddRange(
            new LedgerEntry
            {
                JournalId = journalId,
                EntryDate = tx.TransactionDate,
                AccountCode = cashAccountCode,
                Account = "Assets:Cash",
                Description = $"{tx.Type} — {tx.Account?.Name}",
                Debit = isDebitOnCash ? tx.Amount : 0m,
                Credit = isDebitOnCash ? 0m : tx.Amount,
            },
            new LedgerEntry
            {
                JournalId = journalId,
                EntryDate = tx.TransactionDate,
                AccountCode = offsetCode,
                Account = offsetCode switch
                {
                    "1500" => "Assets:Investments",
                    "4000" => "Income",
                    "5000" => "Expenses",
                    _ => "Equity:Contributions",
                },
                Description = $"{tx.Type} — {tx.Symbol ?? tx.Account?.Name}",
                Debit = isDebitOnCash ? 0m : tx.Amount,
                Credit = isDebitOnCash ? tx.Amount : 0m,
            });
    }
}