import axios, { AxiosInstance } from "axios";
import { auth } from "@clerk/nextjs/server";

/**
 * Server-side API client for Next.js API routes
 * Uses Clerk's auth() to get the token server-side
 */
export async function createServerApiClient(): Promise<AxiosInstance> {
  const { getToken } = await auth();
  const token = await getToken();

  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const client = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  return client;
}
