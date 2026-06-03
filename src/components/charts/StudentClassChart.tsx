import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Student } from '../../types';

interface StudentClassChartProps {
  students: Student[];
}

export const StudentClassChart: React.FC<StudentClassChartProps> = ({ students }) => {
  const data = React.useMemo(() => {
    const classLevels = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
    const counts = classLevels.reduce((acc, level) => {
      acc[level] = 0;
      return acc;
    }, {} as Record<string, number>);

    students.forEach((std) => {
      // Normalize class level
      const match = std.class_level.trim();
      if (match in counts) {
        counts[match] += 1;
      }
    });

    return classLevels.map((level) => ({
      name: level,
      นักเรียน: counts[level],
    }));
  }, [students]);

  const total = React.useMemo(() => {
    return data.reduce((sum, item) => sum + item.นักเรียน, 0);
  }, [data]);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <p className="text-slate-400 text-xs font-semibold">ไม่มีข้อมูลจำนวนนักเรียน</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full" data-testid="student-class-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`${value} คน`, 'จำนวนนักเรียน']}
          />
          <Bar name="จำนวนนักเรียน" dataKey="นักเรียน" fill="url(#colorStudents)" radius={[4, 4, 0, 0]} maxBarSize={25} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
