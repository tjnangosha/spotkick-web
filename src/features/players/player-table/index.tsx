import React, { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { columns, createColumns } from "./columns";
import { Player } from "@/services/players";

interface PlayerTableProps {
  data: {
    players: Player[];
    pagination: {
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  handlePaginationChange: (page: number, pageSize: number) => void;
  handleSortingChange: (sorting: SortingState) => void;
  handleFilterChange: (filters: ColumnFiltersState) => void;
  onEditPlayer?: (player: Player) => void;
  onDeletePlayer?: (player: Player) => void;
}

export function PlayerTable({
  data,
  handlePaginationChange,
  handleSortingChange,
  handleFilterChange,
  onEditPlayer,
  onDeletePlayer,
}: PlayerTableProps) {
  // Create columns with action handlers
  const tableColumns = createColumns({
    onEdit: onEditPlayer,
    onDelete: onDeletePlayer,
  });

  return (
    <DataTable
      columns={tableColumns}
      data={data.players}
      searchKey="name"
      onPaginationChange={handlePaginationChange}
      onSortingChange={handleSortingChange}
      onFilterChange={handleFilterChange}
      serverSide={true}
      pagination={{
        pageIndex: data.pagination.page,
        pageSize: data.pagination.pageSize,
        pageCount: data.pagination.totalPages,
      }}
    />
  );
}
