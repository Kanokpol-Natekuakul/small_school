import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  const sampleItems = Array.from({ length: 55 }, (_, i) => i + 1); // 1 to 55

  it('calculates total pages correctly', () => {
    const { result } = renderHook(() => usePagination(sampleItems, 10));
    expect(result.current.totalPages).toBe(6);
  });

  it('returns correct paginated items for page 1', () => {
    const { result } = renderHook(() => usePagination(sampleItems, 10));
    expect(result.current.paginatedItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.current.currentPage).toBe(1);
  });

  it('updates paginated items when page changes', () => {
    const { result } = renderHook(() => usePagination(sampleItems, 10));
    
    act(() => {
      result.current.setCurrentPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.paginatedItems).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
  });

  it('returns fewer items for the last page', () => {
    const { result } = renderHook(() => usePagination(sampleItems, 10));
    
    act(() => {
      result.current.setCurrentPage(6);
    });

    expect(result.current.currentPage).toBe(6);
    expect(result.current.paginatedItems).toEqual([51, 52, 53, 54, 55]);
  });

  it('resets page to 1 when items array changes', () => {
    let items = sampleItems;
    const { result, rerender } = renderHook(() => usePagination(items, 10));

    act(() => {
      result.current.setCurrentPage(3);
    });
    expect(result.current.currentPage).toBe(3);

    // Change items array
    items = Array.from({ length: 20 }, (_, i) => i + 100);
    rerender();

    expect(result.current.currentPage).toBe(1);
    expect(result.current.paginatedItems).toEqual([100, 101, 102, 103, 104, 105, 106, 107, 108, 109]);
  });

  it('resets page to 1 when itemsPerPage changes', () => {
    const { result } = renderHook(() => usePagination(sampleItems, 10));

    act(() => {
      result.current.setCurrentPage(3);
    });
    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.setItemsPerPage(20);
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.itemsPerPage).toBe(20);
  });

  it('clamps currentPage when it exceeds totalPages', () => {
    const { result } = renderHook(() => usePagination(sampleItems, 10));

    act(() => {
      result.current.setCurrentPage(10); // Exceeds total pages (6)
    });

    // The clamp effect runs asynchronously after render
    expect(result.current.currentPage).toBe(6);
  });
});
