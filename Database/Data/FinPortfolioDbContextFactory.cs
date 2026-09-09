using FinPortfolio.Database.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FinPortfolio.Database.Data;

/// <summary>
/// Design-time factory so `dotnet ef migrations add` works from the
/// financial-accounting-portfolio-database project without running the API.
/// Connection string comes from appsettings or the DATABASE_CONNECTION env var.
/// </summary>
public class FinPortfolioDbContextFactory : IDesignTimeDbContextFactory<FinPortfolioDbContext>
{
    public FinPortfolioDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("DATABASE_CONNECTION")
            ?? "Host=localhost;Port=5432;Database=finportfolio;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<FinPortfolioDbContext>();
        optionsBuilder.UseNpgsql(connectionString);
        return new FinPortfolioDbContext(optionsBuilder.Options);
    }
}
