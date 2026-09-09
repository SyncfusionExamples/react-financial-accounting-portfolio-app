using FinPortfolio.Database.Data;
using FinPortfolio.Api.Models;
using FinPortfolio.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly TransactionService _transactions;

    public TransactionsController(TransactionService transactions) => _transactions = transactions;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _transactions.GetTransactionsAsync());

    [HttpPost]
    [ProducesResponseType(typeof(TransactionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] TransactionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _transactions.CreateAsync(FromRequest(request));
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(TransactionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] TransactionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _transactions.UpdateAsync(id, FromRequest(request));
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _transactions.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    private static Transaction FromRequest(TransactionRequest r) => new()
    {
        TransactionDate = r.TransactionDate,
        Type = r.Type,
        AccountId = r.AccountId,
        Symbol = r.Symbol,
        Quantity = r.Quantity,
        Amount = r.Amount,
        Status = r.Status,
        Notes = r.Notes,
    };
}
