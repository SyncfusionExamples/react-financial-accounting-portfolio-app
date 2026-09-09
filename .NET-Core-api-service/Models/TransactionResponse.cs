namespace FinPortfolio.Api.Models;

/// <summary>
/// Serialized transaction shape — flattens the account name and avoids
/// EF navigation-property reference cycles (Transaction ↔ Account ↔ Transactions).
/// </summary>
public class TransactionResponse
{
    public int Id { get; set; }
    public DateTime TransactionDate { get; set; }
    public string Type { get; set; } = string.Empty;
    public int AccountId { get; set; }
    public string? AccountName { get; set; }
    public string? Symbol { get; set; }
    public decimal? Quantity { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
