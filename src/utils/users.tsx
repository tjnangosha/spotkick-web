import { queryOptions } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api/client";

export type User = {
  id: number
  name: string
  email: string
}

export const DEPLOY_URL = 'http://localhost:3000'

export const usersQueryOptions = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetchWithAuth(DEPLOY_URL + "/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return (await response.json()) as Array<User>;
    },
  })

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await fetchWithAuth(
        DEPLOY_URL + "/api/users/" + id
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return (await response.json()) as User;
    },
  })
