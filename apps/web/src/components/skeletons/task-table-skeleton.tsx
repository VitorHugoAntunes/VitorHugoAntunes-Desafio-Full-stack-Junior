import { Skeleton } from "@/components/skeletons/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TaskTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold px-4 py-4">Tarefa</TableHead>
              <TableHead className="font-semibold px-4 py-4">Prioridade</TableHead>
              <TableHead className="font-semibold px-4 py-4">Status</TableHead>
              <TableHead className="font-semibold px-4 py-4">Prazo</TableHead>
              <TableHead className="font-semibold px-4 py-4">Atribuído A</TableHead>
              <TableHead className="font-semibold text-right px-4 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index} className="border-b">
                <TableCell className="px-4 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex justify-end">
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row items-center justify-between border-t bg-white px-4 py-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
