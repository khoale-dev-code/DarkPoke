'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { libraryParams, type LibraryPage, type LibraryQuery } from '../domain'
import { fetchLibraryBatch, mergeLibraryCards, nextLibraryBatch } from '../infinite'

export function useInfiniteLibrary(query: LibraryQuery, initial: LibraryPage) {
  const sentinel = useRef<HTMLDivElement>(null)
  const [automatic, setAutomatic] = useState(true)
  const [observerSupported, setObserverSupported] = useState(true)
  const filterKey = libraryParams({ ...query, page: 1 }).toString()
  const result = useInfiniteQuery({
    queryKey: ['tcgdex-library-v5', filterKey],
    queryFn: ({ pageParam, signal }) => fetchLibraryBatch(query, pageParam, signal),
    initialPageParam: 1,
    initialData: { pages: [initial], pageParams: [1] },
    getNextPageParam: nextLibraryBatch,
    staleTime: 10 * 60_000,
    // SSR owns a short-lived QueryClient; avoid retaining it with a browser GC timer.
    gcTime: typeof window === 'undefined' ? Infinity : 15 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1
  })
  const { hasNextPage, isFetching, isError, isPaused, fetchNextPage } = result

  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setObserverSupported(false); return }
    const element = sentinel.current
    if (!element || !automatic || !hasNextPage || isFetching || isError || isPaused) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void fetchNextPage({ cancelRefetch: false })
    }, { rootMargin: '600px 0px', threshold: 0 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [automatic, hasNextPage, isFetching, isError, isPaused, fetchNextPage])

  const cards = useMemo(() => mergeLibraryCards(result.data.pages), [result.data.pages])
  const loadMore = () => { if (hasNextPage && !isFetching) void fetchNextPage({ cancelRefetch: false }) }
  return { ...result, cards, sentinel, automatic, setAutomatic, observerSupported, loadMore }
}
