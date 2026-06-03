import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  it('renders page information correctly', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('pagination-info').textContent).toBe(
      'แสดง 1-20 จาก 100 รายการ'
    );
  });

  it('renders page information correctly for middle page', () => {
    render(
      <Pagination
        currentPage={3}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('pagination-info').textContent).toBe(
      'แสดง 41-60 จาก 100 รายการ'
    );
  });

  it('renders correct page buttons and handles ellipsis', () => {
    render(
      <Pagination
        currentPage={5}
        totalItems={200} // 10 pages total
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );

    // Desktop and mobile buttons will be rendered (two sections)
    const page1Buttons = screen.getAllByRole('button', { name: 'หน้า 1' });
    expect(page1Buttons.length).toBe(2);

    const page5Buttons = screen.getAllByRole('button', { name: 'หน้า 5' });
    expect(page5Buttons.length).toBe(2);

    const page10Buttons = screen.getAllByRole('button', { name: 'หน้า 10' });
    expect(page10Buttons.length).toBe(2);
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );

    const prevButton = screen.getByRole('button', { name: 'ก่อนหน้า' });
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );

    const nextButton = screen.getByRole('button', { name: 'ถัดไป' });
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange with correct page number when page button clicked', () => {
    const onPageChangeMock = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={onPageChangeMock}
      />
    );

    const page3Button = screen.getByRole('button', { name: 'หน้า 3' });
    fireEvent.click(page3Button);
    expect(onPageChangeMock).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when next and previous buttons are clicked', () => {
    const onPageChangeMock = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={onPageChangeMock}
      />
    );

    const nextButton = screen.getByRole('button', { name: 'ถัดไป' });
    fireEvent.click(nextButton);
    expect(onPageChangeMock).toHaveBeenCalledWith(3);

    const prevButton = screen.getByRole('button', { name: 'ก่อนหน้า' });
    fireEvent.click(prevButton);
    expect(onPageChangeMock).toHaveBeenCalledWith(1);
  });

  it('renders items per page selector when callback is provided', () => {
    const onItemsPerPageChangeMock = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={vi.fn()}
        onItemsPerPageChange={onItemsPerPageChangeMock}
      />
    );

    const select = screen.getByTestId('items-per-page-select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('20');

    fireEvent.change(select, { target: { value: '50' } });
    expect(onItemsPerPageChangeMock).toHaveBeenCalledWith(50);
  });
});
