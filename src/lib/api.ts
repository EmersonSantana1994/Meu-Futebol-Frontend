export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3004";

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Nao foi possivel concluir a acao.");
  }

  return data as T;
}
