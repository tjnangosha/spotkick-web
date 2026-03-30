import { queryOptions } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api/client";
import { buildApiUrl, getApiBaseUrl } from "@/lib/api/config";
import { camelCaseKeys } from "@/lib/utils";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country?: string;
}

export type Player = {
  user: User;
  position?: string;
  jerseyNumber?: number;
  dateJoinedClub?: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  isActivePlayer?: boolean;
  isOnLoan?: boolean;
  bio?: string;
};

export type CreatePlayerInput = {
  first_name: string;
  last_name: string;
  country: string;
  position: string;
  jersey_number: number;
  date_joined_club: string;
  date_of_birth: string;
  height_cm: number;
  weight_kg: number;
};

export type PlayersFilters = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type PlayersResponse = {
  players: Player[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount?: number;
    totalPages: number;
  };
};

const buildPlayersUrl = (filters: PlayersFilters) => {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.pageSize !== undefined)
    params.set("page_size", String(filters.pageSize));
  if (filters.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.sortOrder) params.set("sort_order", filters.sortOrder);

  const path = "/players";
  if (!getApiBaseUrl()) {
    return `${path}?${params.toString()}`;
  }

  const url = new URL(buildApiUrl(path));
  url.search = params.toString();
  return url.toString();
};

const fetchPlayers = async (filters: PlayersFilters = {}) => {
  const response = await fetchWithAuth(buildPlayersUrl(filters));
  if (!response.ok) {
    throw new Error("Failed to fetch players");
  }

  const data = (await response.json());
  return {
    players: camelCaseKeys(data) || [],
    pagination: data.pagination || { page: 0, pageSize: 10, totalPages: 1 },
  } as PlayersResponse;
};

export const playersQueryOptions = (filters: PlayersFilters = {}) =>
  queryOptions({
    queryKey: ["players", filters],
    queryFn: () => fetchPlayers(filters),
  });

export const createPlayer = async (
  payload: CreatePlayerInput
): Promise<Player> => {
  const response = await fetchWithAuth(buildApiUrl("/players/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      (errorBody && (errorBody.detail || errorBody.message)) ||
      "Failed to create player";
    throw new Error(message);
  }

  const data = await response.json();
  return camelCaseKeys(data) as Player;
};

export const updatePlayer = async (
  playerId: string,
  payload: CreatePlayerInput
): Promise<Player> => {
  const response = await fetchWithAuth(
    buildApiUrl(`/players/${playerId}/`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      (errorBody && (errorBody.detail || errorBody.message)) ||
      "Failed to update player";
    throw new Error(message);
  }

  const data = await response.json();
  return camelCaseKeys(data) as Player;
};

export const deletePlayer = async (playerId: string): Promise<void> => {
  const response = await fetchWithAuth(
    buildApiUrl(`/players/${playerId}/`),
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      (errorBody && (errorBody.detail || errorBody.message)) ||
      "Failed to delete player";
    throw new Error(message);
  }
};
