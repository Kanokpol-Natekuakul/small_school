import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityChart } from './PriorityChart';
import type { Document } from '../../types';

// Mock Recharts to avoid jsdom SVG issues
vi.mock('recharts', () => {
  const MockResponsiveContainer = ({ children }: any) => <div data-testid="responsive-container">{children}</div>;
  const MockBarChart = ({ children }: any) => <div data-testid="bar-chart">{children}</div>;
  const MockBar = () => <div data-testid="bar" />;
  const MockCell = () => <div data-testid="cell" />;
  const MockXAxis = () => <div data-testid="x-axis" />;
  const MockYAxis = () => <div data-testid="y-axis" />;
  const MockTooltip = () => <div data-testid="tooltip" />;
  return {
    ResponsiveContainer: MockResponsiveContainer,
    BarChart: MockBarChart,
    Bar: MockBar,
    Cell: MockCell,
    XAxis: MockXAxis,
    YAxis: MockYAxis,
    Tooltip: MockTooltip,
  };
});

describe('PriorityChart Component', () => {
  it('renders placeholder message when data is empty', () => {
    render(<PriorityChart documents={[]} />);
    expect(screen.getByText('ไม่มีข้อมูลความเร่งด่วน')).toBeInTheDocument();
  });

  it('renders chart container when document data exists', () => {
    const sampleDocs: Document[] = [
      {
        id: 'doc-1',
        doc_no: '001',
        title: 'Doc 1',
        category: 'incoming',
        priority: 'urgent',
        status: 'approved',
        sender: 'Sender',
        receiver: 'Receiver',
        doc_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    render(<PriorityChart documents={sampleDocs} />);
    expect(screen.getByTestId('priority-chart')).toBeInTheDocument();
  });
});
