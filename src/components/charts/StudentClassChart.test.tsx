import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudentClassChart } from './StudentClassChart';
import type { Student } from '../../types';

// Mock Recharts to avoid jsdom SVG issues
vi.mock('recharts', () => {
  const MockResponsiveContainer = ({ children }: any) => <div data-testid="responsive-container">{children}</div>;
  const MockBarChart = ({ children }: any) => <div data-testid="bar-chart">{children}</div>;
  const MockBar = () => <div data-testid="bar" />;
  const MockXAxis = () => <div data-testid="x-axis" />;
  const MockYAxis = () => <div data-testid="y-axis" />;
  const MockTooltip = () => <div data-testid="tooltip" />;
  const MockCartesianGrid = () => <div data-testid="grid" />;
  return {
    ResponsiveContainer: MockResponsiveContainer,
    BarChart: MockBarChart,
    Bar: MockBar,
    XAxis: MockXAxis,
    YAxis: MockYAxis,
    Tooltip: MockTooltip,
    CartesianGrid: MockCartesianGrid,
  };
});

describe('StudentClassChart Component', () => {
  it('renders placeholder message when data is empty', () => {
    render(<StudentClassChart students={[]} />);
    expect(screen.getByText('ไม่มีข้อมูลจำนวนนักเรียน')).toBeInTheDocument();
  });

  it('renders chart container when student data exists', () => {
    const sampleStudents: Student[] = [
      {
        id: 'std-1',
        student_id: '1001',
        first_name: 'Name 1',
        last_name: 'Last 1',
        class_level: 'ม.1',
        classroom: '1',
        status: 'active',
      }
    ];

    render(<StudentClassChart students={sampleStudents} />);
    expect(screen.getByTestId('student-class-chart')).toBeInTheDocument();
  });
});
