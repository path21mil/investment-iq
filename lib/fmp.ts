// lib/fmp.ts

const API_KEY = process.env.FINNHUB_API_KEY;

// 1. Fetch Company Profile & Quote (Heavy data still uses Finnhub)
export async function getCompanyProfile(ticker: string) {
  if (!API_KEY) {
    console.error("❌ FINNHUB_API_KEY is missing");
    return null;
  }

  try {
    const [profileRes, quoteRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${API_KEY}`),
      fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`)
    ]);

    if (!profileRes.ok || !quoteRes.ok) {
       console.error("❌ Finnhub API returned an error status.");
       return null;
    }

    // 🛡️ DEFENSIVE FETCH: Read as raw text first to catch 503/Cloudflare HTML pages
    const rawProfile = await profileRes.text();
    const rawQuote = await quoteRes.text();

    let profile, quote;
    try {
      profile = JSON.parse(rawProfile);
      quote = JSON.parse(rawQuote);
    } catch (parseErr) {
      console.error("🚨 Finnhub returned HTML (Rate Limit/503 Error). Raw response:", rawProfile.substring(0, 150));
      return null;
    }

    // If Finnhub returns an empty object, the ticker doesn't exist or data is missing
    if (Object.keys(profile).length === 0 && quote.c === 0) {
        return null;
    }

    // We map Finnhub's data to match EXACTLY what the UI already expects
    return {
      symbol: profile.ticker || ticker,
      companyName: profile.name || ticker,
      price: quote.c, 
      changes: quote.d, 
      exchangeShortName: profile.exchange?.split(' ')[0] || "US",
      sector: profile.finnhubIndustry || "Equities",
      image: profile.logo || null, 
      description: "Fundamental business descriptions are actively monitored by Investment IQ's AI engine. We track earnings calls and SEC filings to ensure your investment thesis remains intact over the long term."
    };
  } catch (error) {
    console.error("Error fetching from Finnhub:", error);
    return null;
  }
}

// 2. Search for Companies (Swapped to Yahoo Finance to save API limits)
export async function searchCompanies(query: string) {
  if (!query || query.trim().length === 0) return [];

  try {
    // 🌐 Ping Yahoo Finance's unauthenticated public endpoint
    const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0`;
    const response = await fetch(yahooUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) return [];

    // Safely parse Yahoo's response
    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("🚨 Yahoo Search returned invalid JSON. Raw:", rawText.substring(0, 150));
      return [];
    }
    
    // Map Yahoo's search results to match what our dropdown UI expects
    if (data.quotes && Array.isArray(data.quotes)) {
      return data.quotes
        .filter((r: any) => r.quoteType === 'EQUITY' && !r.symbol.includes('.')) // Filter out foreign exchanges
        .map((r: any) => ({
          symbol: r.symbol,
          name: r.shortname || r.longname || r.symbol,
          exchangeShortName: "US"
        }))
        .slice(0, 5); // Only show top 5 results
    }
    
    return [];
  } catch (error) {
    console.error("Error searching Yahoo:", error);
    return [];
  }
}