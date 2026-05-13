'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#eaeded] rounded animate-pulse ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-[#d5dbdb] rounded p-4">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="p-6 bg-[#f2f3f3] min-h-[calc(100vh-84px)]">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 mb-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between bg-white p-3 border border-[#d5dbdb] rounded">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Table — must use valid HTML: table > thead/tbody > tr > th/td */}
      <div className="bg-white border border-[#d5dbdb] rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-[#eaeded]">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
