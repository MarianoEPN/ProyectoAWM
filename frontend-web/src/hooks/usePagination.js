import { useMemo, useState, useEffect } from 'react'

export function usePagination(items, pageSize = 4) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return {
    page,
    setPage,
    totalPages,
    pageItems,
    total: items.length,
    next: () => setPage((p) => Math.min(totalPages, p + 1)),
    prev: () => setPage((p) => Math.max(1, p - 1))
  }
}
