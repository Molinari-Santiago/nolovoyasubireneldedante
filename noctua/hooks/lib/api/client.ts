const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.status}`);
  }

  return response.json();
}