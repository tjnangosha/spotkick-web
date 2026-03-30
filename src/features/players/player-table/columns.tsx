import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Player } from "@/services/players";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { ucFirst } from "@/lib/utils";

interface PlayerActionsProps {
  onEdit?: (player: Player) => void;
  onDelete?: (player: Player) => void;
}

export const createColumns = ({
  onEdit,
  onDelete,
}: PlayerActionsProps = {}): ColumnDef<Player>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "country",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Country" />
    ),
    accessorFn: (row) => row.user?.country || "N/A",
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    accessorFn: (row) => row.user?.firstName && row.user?.lastName ? `${row.user.firstName} ${row.user.lastName}` : "N/A",
  },
  {
    accessorKey: "position",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Position" />
    ),
    cell: ({ row }) => <div>{ucFirst(row.getValue("position"))}</div>,
  },
  {
    accessorKey: "dateJoinedClub",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Joined" />
    ),
    cell: ({ row }) => {
      const dateJoinedClub = parseFloat(row.getValue("dateJoinedClub"));
      return <div className="font-medium">{dateJoinedClub}</div>;
    },
  },
  {
    accessorKey: "isActivePlayer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Is Active" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("isActivePlayer") ? "Yes" : "No"}</div>
    ),
  },
  {
    accessorKey: "jerseyNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Jersey Number" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("jerseyNumber")}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const player = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel style={{ fontWeight: "bold" }}>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(player.user.id)}
            >
              Copy player ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem>View details</DropdownMenuItem> */}
            <DropdownMenuItem onSelect={() => onEdit?.(player)}>
              Edit player
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(player)}
              className="text-destructive"
            >
              Delete player
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Export default columns for backward compatibility
export const columns = createColumns();
