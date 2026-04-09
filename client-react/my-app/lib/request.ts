import API_CONFIG, { getFullUrl, getLocalApiUrl } from './api';

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  useLocal?: boolean;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  result?: T;
}

class RequestError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
  }
}

const request = async <T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    headers = {},
    body,
    params,
    useLocal = true,
  } = config;

  const url = useLocal ? getLocalApiUrl(endpoint) : getFullUrl(endpoint, params);

  const requestHeaders = {
    ...API_CONFIG.HEADERS,
    ...headers,
  };

  const requestConfig: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    requestConfig.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestConfig);

    if (!response.ok) {
      throw new RequestError(
        `HTTP Error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data: ApiResponse<T> = await response.json();

    if (data.code !== 200 && data.code !== undefined) {
      throw new RequestError(data.message || '请求失败', data.code);
    }

    return data;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }
    throw new RequestError(
      error instanceof Error ? error.message : '网络请求失败',
      500
    );
  }
};

export const get = <T = any>(
  endpoint: string,
  config?: Omit<RequestConfig, 'method' | 'body'>
): Promise<ApiResponse<T>> => {
  return request<T>(endpoint, { ...config, method: 'GET' });
};

export const post = <T = any>(
  endpoint: string,
  body?: any,
  config?: Omit<RequestConfig, 'method' | 'body'>
): Promise<ApiResponse<T>> => {
  return request<T>(endpoint, { ...config, method: 'POST', body });
};

export const put = <T = any>(
  endpoint: string,
  body?: any,
  config?: Omit<RequestConfig, 'method' | 'body'>
): Promise<ApiResponse<T>> => {
  return request<T>(endpoint, { ...config, method: 'PUT', body });
};

export const del = <T = any>(
  endpoint: string,
  config?: Omit<RequestConfig, 'method'>
): Promise<ApiResponse<T>> => {
  return request<T>(endpoint, { ...config, method: 'DELETE' });
};

export const patch = <T = any>(
  endpoint: string,
  body?: any,
  config?: Omit<RequestConfig, 'method' | 'body'>
): Promise<ApiResponse<T>> => {
  return request<T>(endpoint, { ...config, method: 'PATCH', body });
};

export default request;
