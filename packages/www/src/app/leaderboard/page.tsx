"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"; 
import { Button } from "@/components/ui/button"

interface LeaderboardEntry {
  id: string
  position: number
  username: string
  referrals: number
  volumeGenerated: number
  earned: number
}

const data: LeaderboardEntry[] = [
  {
    id: "1",
    position: 1,
    username: "johndoe",
    referrals: 150,
    volumeGenerated: 50000,
    earned: 5000,
  },
  {
    id: "2",
    position: 2,
    username: "janedoe",
    referrals: 120,
    volumeGenerated: 45000,
    earned: 4500,
  },
  {
    id: "3",
    position: 3,
    username: "bobsmith",
    referrals: 100,
    volumeGenerated: 40000,
    earned: 4000,
  },
  {
    id: "4",
    position: 4,
    username: "alicejohnson",
    referrals: 90,
    volumeGenerated: 35000,
    earned: 3500,
  },
  {
    id: "5",
    position: 5,
    username: "charliewilson",
    referrals: 80,
    volumeGenerated: 30000,
    earned: 3000,
  },
  {
    id: "6",
    position: 6,
    username: "emmabrown",
    referrals: 75,
    volumeGenerated: 28000,
    earned: 2800,
  },
  {
    id: "7",
    position: 7,
    username: "davidlee",
    referrals: 70,
    volumeGenerated: 26000,
    earned: 2600,
  },
  {
    id: "8",
    position: 8,
    username: "sophiagarcia",
    referrals: 65,
    volumeGenerated: 24000,
    earned: 2400,
  },
  {
    id: "9",
    position: 9,
    username: "olivermartinez",
    referrals: 60,
    volumeGenerated: 22000,
    earned: 2200,
  },
  {
    id: "10",
    position: 10,
    username: "isabellalopez",
    referrals: 55,
    volumeGenerated: 20000,
    earned: 2000,
  },
  {
    id: "11",
    position: 11,
    username: "isabellalopez",
    referrals: 55,
    volumeGenerated: 20000,
    earned: 2000,
  },
  {
    id: "12",
    position: 12,
    username: "isabellalopez",
    referrals: 55,
    volumeGenerated: 20000,
    earned: 2000,
  },
  {
    id: "13",
    position: 13,
    username: "isabellalopez",
    referrals: 55,
    volumeGenerated: 20000,
    earned: 2000,
  },
]

const columns: ColumnDef<LeaderboardEntry>[] = [
  {
    accessorKey: "position",
    header: ({ column }) => (
      <div className="text-center">Position</div>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("position")}</div>,
  },
  {
    accessorKey: "username",
    header: ({ column }) => (
      <div className="text-left">Username</div>
    ),
    cell: ({ row }) => <div className="text-left">{row.getValue("username")}</div>,
  },
  {
    accessorKey: "referrals",
    header: ({ column }) => (
      <div className="text-center">Referrals</div>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("referrals")}</div>,
  },
  {
    accessorKey: "volumeGenerated",
    header: ({ column }) => (
      <div className="text-right">Volume Generated</div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("volumeGenerated"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      return <div className="text-right">{formatted}</div>
    },
  },
  {
    accessorKey: "earned",
    header: ({ column }) => (
      <div className="text-right">Earned</div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("earned"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      return <div className="text-right">{formatted}</div>
    },
  },
]

export default function LeaderboardDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [affiliateLink, setAffiliateLink] = React.useState<string>("");

  const generateAffiliateLink = () => {
    const mockUserId = "user123"; // Replace with actual user data in real implementation
    const link = `https://yourdomain.com/referral/${mockUserId}`;
    setAffiliateLink(link);
  };

  const copyToClipboard = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      alert("Affiliate link copied to clipboard!");
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  return (
    <div className="min-h-screen">
        <div className="container mx-auto py-10 mt-24">
            {/* Affiliate Link Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Generate Your Affiliate Link</h2>
          <div className="flex items-center space-x-4">
            <Button onClick={generateAffiliateLink}>Generate Link</Button>
            <Input
              readOnly
              value={affiliateLink}
              placeholder="Your affiliate link will appear here"
              className="flex-1"
            />
            <Button onClick={copyToClipboard} disabled={!affiliateLink}>
              Copy
            </Button>
          </div>
        </div>

        {/* Leaderboard Section */}
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
      </div>
    </div>
  )
}

