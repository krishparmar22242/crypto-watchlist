const MARKETS_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h';

const TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(type, message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}

export async function fetchMarkets(signal) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), TIMEOUT_MS);
  let didAbortExternally = false;

  const handleExternalAbort = () => {
    didAbortExternally = true;
    timeoutController.abort();
  };

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new ApiError('aborted', 'Request was cancelled.');
    }
    signal.addEventListener('abort', handleExternalAbort);
  }

  try {
    const response = await fetch(MARKETS_URL, {
      headers: { Accept: 'application/json' },
      signal: timeoutController.signal,
    });

    if (response.status === 429) {
      throw new ApiError('rate-limit', 'CoinGecko rate limit reached.', 429);
    }

    if (!response.ok) {
      throw new ApiError(
        'http',
        `CoinGecko returned HTTP ${response.status}.`,
        response.status
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError('response', 'CoinGecko returned invalid JSON.');
    }

    if (!Array.isArray(data)) {
      throw new ApiError('response', 'CoinGecko returned unexpected data.');
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (didAbortExternally) {
      throw new ApiError('aborted', 'Request was cancelled.');
    }
    if (timeoutController.signal.aborted) {
      throw new ApiError('timeout', 'Request timed out.');
    }
    throw new ApiError('network', 'Could not reach CoinGecko.');
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', handleExternalAbort);
    }
  }
}
