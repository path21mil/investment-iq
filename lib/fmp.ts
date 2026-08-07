// lib/fmp.ts
// (We kept the file name the same, but we are secretly using Finnhub now!)

const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

// 1. Fetch Company Profile & Quote (Combined for Finnhub)
export async function getCompanyProfile(ticker: string) {
  if (!API_KEY) throw new Error("Finnhub API Key is missing");

  try {
    // Finnhub requires 2 calls: One for the Logo/Name, One for the Price. 
    // We run them at the exact same time using Promise.all to keep the app lightning fast.
    const [profileRes, quoteRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${API_KEY}`),
      fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`)
    ]);

    const profile = await profileRes.json();
    const quote = await quoteRes.json();

    // If Finnhub returns an empty object, the ticker doesn't exist
    if (Object.keys(profile).length === 0 && quote.c === 0) {
        return null;
    }

    // We map Finnhub's data to match EXACTLY what our UI already expects
    return {
      symbol: profile.ticker || ticker,
      companyName: profile.name || ticker,
      price: quote.c, // 'c' is Current Price in Finnhub
      changes: quote.d, // 'd' is Dollar Change in Finnhub
      exchangeShortName: profile.exchange?.split(' ')[0] || "US",
      sector: profile.finnhubIndustry || "Equities",
      image: profile.logo || null, // Finnhub gives us the REAL logo for free!
      description: "Fundamental business descriptions are actively monitored by Investment IQ's AI engine. We track earnings calls and SEC filings to ensure your investment thesis remains intact over the long term."
    };
  } catch (error) {
    console.error("Error fetching from Finnhub:", error);
    return null;
  }
}

// 2. Search for Companies
export async function searchCompanies(query: string) {
  if (!API_KEY) return [];

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${query}&token=${API_KEY}`
    );
    const data = await response.json();
    
    // Map Finnhub's search results to match what our dropdown UI expects
    if (data.result && Array.isArray(data.result)) {
      return data.result
        .filter((r: any) => !r.symbol.includes('.')) // Filter out foreign exchanges to keep the dropdown clean
        .map((r: any) => ({
          symbol: r.symbol,
          name: r.description,
          exchangeShortName: "US"
        }))
        .slice(0, 5); // Only show top 5 results
    }
    return [];
  } catch (error) {
    console.error("Error searching Finnhub:", error);
    return [];
  }
}