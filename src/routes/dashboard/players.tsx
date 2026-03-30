import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "@/features/players/player-table/columns";
import { playersQueryOptions, PlayersFilters } from "@/services/players";
import { Button } from "@/components/ui/button";
import { Player } from "@/services/players";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import PlayerPage from "@/features/players";

const playersSearchSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.union([z.literal("asc"), z.literal("desc"), z.undefined()]),
  name: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/dashboard/players")({
  component: PlayerPage,
  ssr: false,
  validateSearch: (search) => playersSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    name: search.name,
    category: search.category,
    status: search.status,
  }),
  loader: async ({ context, deps }) => {
    const filters: PlayersFilters = {
      page: deps.page,
      pageSize: deps.pageSize,
      sortBy: deps.sortBy,
      sortOrder: deps.sortOrder,
    };

    if (typeof window !== "undefined") {
      // Prefetch data using React Query
      await context.queryClient.ensureQueryData(playersQueryOptions(filters));
    } 
    return {
      crumb: "Players",
    };
  },
});
