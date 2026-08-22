export const api = {
  get: async (url: string, init?: RequestInit) => {
    const res = await fetch(`/api/v1${url}`, {
      ...init,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  },
  post: async (url: string, body: any, init?: RequestInit) => {
    const res = await fetch(`/api/v1${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      ...init,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  },
};
