"use client";

import { useCallback } from "react";
import { useStore } from "@/store/useStore";
import { getClient } from "@/lib/graphql";

export function useGraphQL() {
  const token = useStore((s) => s.token);

  const query = useCallback(
    async <T>(q: string, variables?: Record<string, unknown>): Promise<T> => {
      const client = getClient(token ?? undefined);
      return client.request<T>(q, variables);
    },
    [token]
  );

  const mutate = useCallback(
    async <T>(m: string, variables?: Record<string, unknown>): Promise<T> => {
      const client = getClient(token ?? undefined);
      return client.request<T>(m, variables);
    },
    [token]
  );

  return { query, mutate };
}
