import { queryOptions } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api/client";
import { buildApiUrl, getApiBaseUrl } from "@/lib/api/config";

export type Player = {
  id: string;
  name?: string;
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

  const data = (await response.json()) as PlayersResponse;
  return {
    players: data.players || [],
    pagination: data.pagination || { page: 0, pageSize: 10, totalPages: 1 },
  } as PlayersResponse;
};

export const playersQueryOptions = (filters: PlayersFilters = {}) =>
  queryOptions({
    queryKey: ["players", filters],
    queryFn: () => fetchPlayers(filters),
  });
