import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Player } from "@/services/players";
import { Route } from "@/routes/dashboard/players";
import { PlayersFilters, playersQueryOptions } from "@/services/players";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { PlayerForm } from "./player-form";
import { PlayerTable } from "./player-table";

export default function PlayerPage() {
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const filters: PlayersFilters = {
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
  };

  // Use React Query to fetch data
  const { data, isFetching } = useSuspenseQuery(playersQueryOptions(filters));

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize: number) => {
    navigate({
      search: {
        ...search,
        page: page,
        pageSize: pageSize,
      },
      replace: true,
    });
  };

  // Handle sorting change
  const handleSortingChange = (updatedSorting: SortingState) => {
    setSorting(updatedSorting);

    if (updatedSorting.length > 0) {
      navigate({
        search: {
          ...search,
          sortBy: updatedSorting[0].id,
          sortOrder: updatedSorting[0].desc ? "desc" : "asc",
        },
        replace: true,
      });
    } else {
      const { sortBy, sortOrder, ...rest } = search;
      navigate({
        search: rest,
        replace: true,
      });
    }
  };

  // Handle filter change
  const handleFilterChange = (updatedFilters: ColumnFiltersState) => {
    setColumnFilters(updatedFilters);

    const nameFilter = updatedFilters.find((filter) => filter.id === "name");
    const categoryFilter = updatedFilters.find(
      (filter) => filter.id === "category"
    );
    const statusFilter = updatedFilters.find(
      (filter) => filter.id === "status"
    );

    navigate({
      search: {
        ...search,
        name: nameFilter?.value as string | undefined,
        category: categoryFilter?.value as string | undefined,
        status: statusFilter?.value as string | undefined,
        page: 0, // Reset to first page on filter change
      },
      replace: true,
    });
  };

  // Handle edit player
  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsAddPlayerOpen(true);
  };

  // Handle delete player
  const handleDeletePlayer = (player: Player) => {
    toast({
      title: "Player deleted",
      description: `${player.name ?? "Player"} has been deleted.`,
    });
  };

  return (
    <div>
      <div>
        <div className="flex flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Players</h1>
            <p className="text-sm text-gray-500">
              Manage your players.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingPlayer(null);
              setIsAddPlayerOpen(true);
            }}
          >
            Add Player
          </Button>
        </div>
        <div>
          <PlayerTable
            data={data}
            handlePaginationChange={handlePaginationChange}
            handleSortingChange={handleSortingChange}
            handleFilterChange={handleFilterChange}
            onEditPlayer={handleEditPlayer}
            onDeletePlayer={handleDeletePlayer}
          />
        </div>
      </div>
      <PlayerForm
        open={isAddPlayerOpen}
        onOpenChange={setIsAddPlayerOpen}
        initialData={editingPlayer || undefined}
        onSuccess={(player: Player) => {
          const displayName =
            player.user?.firstName && player.user?.lastName
              ? `${player.user.firstName} ${player.user.lastName}`
              : "Player";
          toast({
            title: editingPlayer ? "Player updated" : "Player added",
            description: `${displayName} has been ${
              editingPlayer ? "updated" : "added"
            }.`,
          });
        }}
      />
    </div>
  );
}
