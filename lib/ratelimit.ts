// lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Conectamos con Upstash Redis usando las variables de entorno
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Creamos el limitador: 5 peticiones por cada bloque de 1 minuto
export const registroRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true, // Te genera gráficas bonitas en el panel de Upstash
  prefix: "@ratelimit/registro",
});