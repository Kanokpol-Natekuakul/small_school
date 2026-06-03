import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Document } from '../../types';

interface DocumentPieChartProps {
  documents: Document[];
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

export const DocumentPieChart: React.FC<DocumentPieChartProps> = ({ documents }) => {
  const data = React.useMemo<StatusData[]>(() => {
    const counts = {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      archived: 0,
    };

    documents.forEach((doc) => {
      if (doc.status in counts) {
        counts[doc.status as keyof typeof counts] += 1;
      }
    });

    return [
      { name: 'ฉบับร่าง', value: counts.draft, color: '#94a3b8' },
      { name: 'รออนุมัติ', value: counts.pending_approval, color: '#f59e0b' },
      { name: 'อนุมัติแล้ว', value: counts.approved, color: '#10b981' },
      { name: 'ส่งมอบแล้ว/เก็บถาวร', value: counts.archived, color: '#6366f1' },
    ].filter((item) => item.value > 0);
  }, [documents]);

  const total = React.useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <p className="text-slate-400 text-xs font-semibold">ไม่มีข้อมูลสถานะหนังสือ</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full relative" data-testid="document-pie-chart">
      {/* Center Label for Donut Hole */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
        <span className="text-[28px] font-extrabold text-slate-800 leading-none" data-testid="pie-total-count">
          {total}
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
          ฉบับทั้งหมด
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [`${value} ฉบับ`, 'จำนวน']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
