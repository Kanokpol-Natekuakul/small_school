import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentPieChart } from './DocumentPieChart';
import type { Document } from '../../types';

// Mock Recharts to avoid jsdom SVG issues
vi.mock('recharts', () => {
  const MockResponsiveContainer = ({ children }: any) => <div data-testid="responsive-container">{children}</div>;
  const MockPieChart = ({ children }: any) => <div data-testid="pie-chart">{children}</div>;
  const MockPie = ({ children }: any) => <div data-testid="pie">{children}</div>;
  const MockCell = () => <div data-testid="cell" />;
  const MockTooltip = () => <div data-testid="tooltip" />;
  return {
    ResponsiveContainer: MockResponsiveContainer,
    PieChart: MockPieChart,
    Pie: MockPie,
    Cell: MockCell,
    Tooltip: MockTooltip,
  };
});

describe('DocumentPieChart Component', () => {
  it('renders placeholder message when data is empty', () => {
    render(<DocumentPieChart documents={[]} />);
    expect(screen.getByText('ไม่มีข้อมูลสถานะหนังสือ')).toBeInTheDocument();
  });

  it('renders chart and displays total count correctly', () => {
    const sampleDocs: Document[] = [
      {
        id: 'doc-1',
        doc_no: '001',
        title: 'Doc 1',
        category: 'incoming',
        priority: 'normal',
        status: 'draft',
        sender: 'Sender',
        receiver: 'Receiver',
        doc_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'doc-2',
        doc_no: '002',
        title: 'Doc 2',
        category: 'outgoing',
        priority: 'urgent',
        status: 'approved',
        sender: 'Sender',
        receiver: 'Receiver',
        doc_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    render(<DocumentPieChart documents={sampleDocs} />);
    expect(screen.getByTestId('document-pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-total-count').textContent).toBe('2');
  });
});
