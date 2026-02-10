import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// Simple in-memory cache
const priceCache: Record<string, {
  price: number;
  currency: string;
  priceAUD: number;
  timestamp: number;
}> = {};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let audRateCache: { rate: number; timestamp: number } | null = null;

async function getUSDToAUDRate(): Promise<number> {
  if (audRateCache && Date.now() - audRateCache.timestamp < CACHE_DURATION_MS) {
    return audRateCache.rate;
  }

  try {
    const result = await yahooFinance.quote('AUDUSD=X');
    const audusd = result.regularMarketPrice;
    if (!audusd || audusd <= 0) {
      throw new Error('Invalid AUDUSD rate');
    }
    // AUDUSD=X gives "1 AUD = X USD", so "1 USD = 1/X AUD"
    const usdToAud = 1 / audusd;
    audRateCache = { rate: usdToAud, timestamp: Date.now() };
    return usdToAud;
  } catch {
    return audRateCache?.rate || 1.55;
  }
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Missing "ticker" query parameter' }, { status: 400 });
  }

  const sanitizedTicker = ticker.toUpperCase().trim();
  if (!/^[A-Z0-9.\-=]+$/.test(sanitizedTicker)) {
    return NextResponse.json({ error: 'Invalid ticker format' }, { status: 400 });
  }

  // Check cache
  const cached = priceCache[sanitizedTicker];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return NextResponse.json({
      ticker: sanitizedTicker,
      price: cached.price,
      currency: cached.currency,
      priceAUD: cached.priceAUD,
      cached: true,
    });
  }

  try {
    const result = await yahooFinance.quote(sanitizedTicker);

    if (!result || !result.regularMarketPrice) {
      return NextResponse.json(
        { error: `No price data found for "${sanitizedTicker}"` },
        { status: 404 }
      );
    }

    const price = result.regularMarketPrice;
    const currency = result.currency || 'USD';

    let priceAUD = price;
    if (currency !== 'AUD') {
      if (currency === 'USD') {
        const usdToAud = await getUSDToAUDRate();
        priceAUD = price * usdToAud;
      } else {
        try {
          const fxTicker = `${currency}AUD=X`;
          const fxResult = await yahooFinance.quote(fxTicker);
          if (fxResult?.regularMarketPrice) {
            priceAUD = price * fxResult.regularMarketPrice;
          }
        } catch {
          return NextResponse.json({
            ticker: sanitizedTicker,
            price,
            currency,
            priceAUD: price,
            warning: `Could not convert ${currency} to AUD`,
            cached: false,
          });
        }
      }
    }

    priceAUD = Math.round(priceAUD * 100) / 100;

    priceCache[sanitizedTicker] = { price, currency, priceAUD, timestamp: Date.now() };

    return NextResponse.json({
      ticker: sanitizedTicker,
      price,
      currency,
      priceAUD,
      cached: false,
    });
  } catch {
    return NextResponse.json(
      { error: `Failed to fetch price for "${sanitizedTicker}". Check the ticker symbol.` },
      { status: 500 }
    );
  }
}
