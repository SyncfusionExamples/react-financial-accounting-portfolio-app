using FinPortfolio.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly AccountingService _accounting;

    public AccountsController(AccountingService accounting) => _accounting = accounting;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _accounting.GetAccountsAsync());
}
