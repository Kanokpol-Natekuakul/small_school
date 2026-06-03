import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentBarChart } from './DocumentBarChart';
import type { Document } from '../../types';

// Mock Recharts to avoid jsdom SVG issues
vi.mock('recharts', () => {
  const MockResponsiveContainer = ({ children }: any) => <div data-testid="responsive-container">{children}</div>;
  const MockBarChart = ({ children }: any) => <div data-testid="bar-chart">{children}</div>;
  const MockBar = () => <div data-testid="bar" />;
  const MockXAxis = () => <div data-testid="x-axis" />;
  const MockYAxis = () => <div data-testid="y-axis" />;
  const MockTooltip = () => <div data-testid="tooltip" />;
  const MockLegend = () => <div data-testid="legend" />;
  const MockCartesianGrid = () => <div data-testid="grid" />;
  return {
    ResponsiveContainer: MockResponsiveContainer,
    BarChart: MockBarChart,
    Bar: MockBar,
    XAxis: MockXAxis,
    YAxis: MockYAxis,
    Tooltip: MockTooltip,
    Legend: MockLegend,
    CartesianGrid: MockCartesianGrid,
  };
});

describe('DocumentBarChart Component', () => {
  it('renders placeholder message when data is empty', () => {
    render(<DocumentBarChart documents={[]} />);
    expect(screen.getByText('ไม่มีข้อมูลการเดินหนังสือในรอบ 6 เดือนนี้')).toBeInTheDocument();
  });

  it('renders chart container when documents exist', () => {
    const sampleDocs: Document[] = [
      {
        id: 'doc-1',
        doc_no: '001',
        title: 'Doc 1',
        category: 'incoming',
        priority: 'normal',
        status: 'pending_approval',
        sender: 'Sender',
        receiver: 'Receiver',
        doc_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    render(<DocumentBarChart documents={sampleDocs} />);
    expect(screen.getByTestId('document-bar-chart')).toBeInTheDocument();
  });
});
