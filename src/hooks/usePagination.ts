import { useState, useMemo, useCallback } from 'react';

export function usePagination<T>(items: T[], defaultItemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(defaultItemsPerPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / itemsPerPage)),
    [items.length, itemsPerPage]
  );

  const [prevItems, setPrevItems] = useState(items);
  const [prevItemsPerPage, setPrevItemsPerPage] = useState(itemsPerPage);

  let activePage = currentPage;

  if (items !== prevItems) {
    setPrevItems(items);
    activePage = 1;
    setCurrentPage(1);
  }

  if (itemsPerPage !== prevItemsPerPage) {
    setPrevItemsPerPage(itemsPerPage);
    activePage = 1;
    setCurrentPage(1);
  }

  // Clamp currentPage to valid range if it exceeds totalPages
  if (activePage > totalPages) {
    setCurrentPage(totalPages);
  }

  const paginatedItems = useMemo(() => {
    const clampedPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (clampedPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }, [items, currentPage, itemsPerPage, totalPages]);

  const setItemsPerPage = useCallback((count: number) => {
    setItemsPerPageState(count);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    setCurrentPage,
    setItemsPerPage,
    resetPage,
  };
}
