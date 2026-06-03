import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Document } from '../../types';

interface PriorityChartProps {
  documents: Document[];
}

export const PriorityChart: React.FC<PriorityChartProps> = ({ documents }) => {
  const data = React.useMemo(() => {
    const counts = {
      normal: 0,
      urgent: 0,
      very_urgent: 0,
    };

    documents.forEach((doc) => {
      if (doc.priority in counts) {
        counts[doc.priority as keyof typeof counts] += 1;
      }
    });

    return [
      { name: 'ด่วนที่สุด', count: counts.very_urgent, color: '#ef4444' },
      { name: 'ด่วน', count: counts.urgent, color: '#f97316' },
      { name: 'ปกติ', count: counts.normal, color: '#3b82f6' },
    ];
  }, [documents]);

  const total = React.useMemo(() => {
    return data.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <p className="text-slate-400 text-xs font-semibold">ไม่มีข้อมูลความเร่งด่วน</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full" data-testid="priority-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`${value} ฉบับ`, 'จำนวน']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
