// api.ts
import axios from 'axios';
import { dinoclaim_api } from 'config';

export const axios_claim = axios.create({
  baseURL: dinoclaim_api,
  // Considérer "OK" tout < 500 => 4xx ne jette plus
  validateStatus: (status) => status < 500
});

// (Optionnel) Normalise la forme des erreurs de l’API
export function extractProblem(data: any): string {
  // RFC 7807
  if (data?.title || data?.detail) {
    return [data.title, data.detail].filter(Boolean).join(' — ');
  }
  // Backends hérités
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  return 'Unexpected error';
}
