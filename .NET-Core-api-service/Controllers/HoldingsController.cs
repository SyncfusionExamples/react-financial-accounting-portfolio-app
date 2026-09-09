using FinPortfolio.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HoldingsController : ControllerBase
{
    private readonly PortfolioService _portfolio;

    public HoldingsController(PortfolioService portfolio) => _portfolio = portfolio;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? portfolioId)
        => Ok(await _portfolio.GetHoldingsAsync(portfolioId));
}
