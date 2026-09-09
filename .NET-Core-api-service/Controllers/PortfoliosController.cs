using FinPortfolio.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PortfoliosController : ControllerBase
{
    private readonly PortfolioService _portfolio;

    public PortfoliosController(PortfolioService portfolio) => _portfolio = portfolio;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _portfolio.GetPortfoliosAsync());
}
