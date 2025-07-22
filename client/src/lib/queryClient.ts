import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// API request helper function
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}

// Query function helper for React Query
export function getQueryFn(urlOrOptions: string | { url?: string, on401?: string }) {
  let url: string;
  let on401: string | undefined;

  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
  } else {
    url = urlOrOptions.url || '';
    on401 = urlOrOptions.on401;
  }

  return async () => {
    try {
      const response = await apiRequest('GET', url);
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('401') && on401 === 'returnNull') {
        return null;
      }
      throw error;
    }
  };
}
