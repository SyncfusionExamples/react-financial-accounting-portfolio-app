using FinPortfolio.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LedgerController : ControllerBase
{
    private readonly AccountingService _accounting;

    public LedgerController(AccountingService accounting) => _accounting = accounting;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _accounting.GetLedgerAsync());
}
