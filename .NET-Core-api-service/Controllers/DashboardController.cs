using FinPortfolio.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboard;

    public DashboardController(DashboardService dashboard) => _dashboard = dashboard;

    /// <summary>Aggregated KPIs, recent transactions, distribution, and history.</summary>
    [HttpGet("summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary()
        => Ok(await _dashboard.GetSummaryAsync());
}
