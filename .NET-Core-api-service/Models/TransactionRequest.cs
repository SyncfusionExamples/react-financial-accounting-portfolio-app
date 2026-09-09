using System.ComponentModel.DataAnnotations;

namespace FinPortfolio.Api.Models;

/// <summary>Request body for creating or updating a transaction.</summary>
public class TransactionRequest
{
    [Required]
    public DateTime TransactionDate { get; set; }

    [Required]
    public string Type { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "AccountId is required.")]
    public int AccountId { get; set; }

    public string? Symbol { get; set; }
    public decimal? Quantity { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    public string Status { get; set; } = "Completed";
    public string? Notes { get; set; }
}
