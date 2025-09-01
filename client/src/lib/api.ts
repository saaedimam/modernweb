import { StockRow } from '@/types';

const API_TIMEOUT = 8000;

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create abort controller for request timeout
function createAbortController(timeoutMs: number = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // Return both controller and timeout ID for cleanup
  return { controller, timeoutId };
}

// Generic API request function
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const { controller, timeoutId } = createAbortController();
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Clear timeout since request completed successfully
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    return await response.json();
  } catch (error) {
    // Clear timeout on error as well
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timeout');
    }
    throw error;
  }
}

// Stock data adapter
function adaptStockData(data: any[]): StockRow[] {
  return data.map(item => ({
    symbol: item.symbol || item.code,
    name: item.name || item.companyName,
    price: Number(item.price || item.lastPrice || 0),
    changePct: Number(item.changePct || item.changePercent || 0),
    exchange: (item.exchange || 'DSE').toUpperCase() as 'DSE' | 'CSE',
    updated: item.updated || new Date().toISOString(),
  }));
}

// Fetch stock data with fallback to mock data
export async function fetchStocks(): Promise<StockRow[]> {
  try {
    // Try to fetch from API endpoint first
    const data = await apiRequest<any[]>('/api/stocks.json');
    return adaptStockData(data);
  } catch (error) {
    console.warn('Failed to fetch live stock data, using mock data:', error);
    
    try {
      // Fallback to mock data
      const mockData = await apiRequest<any[]>('/stocks.mock.json');
      return adaptStockData(mockData);
    } catch (mockError) {
      console.error('Failed to fetch mock stock data:', mockError);
      // Return default mock data if all else fails
      return [
        {
          symbol: 'KATTALI',
          name: 'Kattali Textile Ltd.',
          price: 156.75,
          changePct: 3.45,
          exchange: 'DSE',
          updated: new Date().toISOString(),
        },
      ];
    }
  }
}

// Submit contact form
export async function submitContactForm(data: any): Promise<{ success: boolean; message: string }> {
  // Since there's no real backend, simulate form submission
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: 'Your message has been sent successfully. We will get back to you soon!'
  };
}

// Subscribe to newsletter
export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  // Simulate newsletter subscription
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    success: true,
    message: 'Successfully subscribed to our newsletter!'
  };
}
