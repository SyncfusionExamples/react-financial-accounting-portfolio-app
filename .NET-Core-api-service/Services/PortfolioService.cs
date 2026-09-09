using FinPortfolio.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace FinPortfolio.Api.Services;

/// <summary>Portfolio and holdings queries.</summary>
public class PortfolioService
{
    private readonly FinPortfolioDbContext _db;

    public PortfolioService(FinPortfolioDbContext db) => _db = db;

    public Task<List<Portfolio>> GetPortfoliosAsync() =>
        _db.Portfolios.AsNoTracking().OrderBy(p => p.Name).ToListAsync();

    public Task<List<Holding>> GetHoldingsAsync(int? portfolioId)
    {
        var query = _db.Holdings.AsNoTracking().AsQueryable();
        if (portfolioId is not null)
        {
            query = query.Where(h => h.PortfolioId == portfolioId);
        }
        return query.OrderBy(h => h.Symbol).ToListAsync();
    }
}