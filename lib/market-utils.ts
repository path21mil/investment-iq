interface SanitizedBounds {
  yearHigh: number;
  yearLow: number | null;
  isValid: boolean;
}

function sanitizePriceBounds(
  currentPrice: number,
  rawHigh: number | null,
  rawLow: number | null
): SanitizedBounds {
  if (!currentPrice || currentPrice <= 0) {
    return { yearHigh: currentPrice, yearLow: null, isValid: false };
  }

  let high = rawHigh;
  let low = rawLow;

  // 1. Detect Scale Mismatches (Share class splits or currency unit errors)
  // Example: High is 1,500x too large (BRK.A vs BRK.B) or 100x too large (GBp vs GBP)
  if (high && high > currentPrice * 3) {
    const highRatio = high / currentPrice;
    const lowRatio = low && low > 0 ? low / currentPrice : highRatio;

    // If both high and low are inflated by a similar multiple, normalize them
    const avgRatio = (highRatio + lowRatio) / 2;
    if (avgRatio >= 2.5) {
      high = Number((high / avgRatio).toFixed(2));
      if (low) low = Number((low / avgRatio).toFixed(2));
    }
  }

  // Example: High is significantly smaller than current price (reverse scale mismatch)
  if (high && high < currentPrice * 0.33) {
    const scaleFactor = currentPrice / high;
    high = Number((high * scaleFactor).toFixed(2));
    if (low) low = Number((low * scaleFactor).toFixed(2));
  }

  // 2. Strict Boundary Enforcement
  // By definition: 52W Low <= Current Price <= 52W High
  if (!high || high < currentPrice) {
    high = currentPrice;
  }

  if (low && low > currentPrice) {
    low = currentPrice;
  }

  // 3. Outlier Guardrail
  // If the high remains 4x higher than current price in large caps, discard to protect scoring
  if (high > currentPrice * 4) {
    high = currentPrice;
    low = null;
  }

  return {
    yearHigh: high,
    yearLow: low,
    isValid: true
  };
}