import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Document } from '../../types';

interface DocumentBarChartProps {
  documents: Document[];
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export const DocumentBarChart: React.FC<DocumentBarChartProps> = ({ documents }) => {
  const data = React.useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        monthLabel: THAI_MONTHS[d.getMonth()],
        incoming: 0,
        outgoing: 0,
        circular: 0,
      };
    }).reverse();

    documents.forEach((doc) => {
      const docDate = new Date(doc.doc_date);
      const docMonth = docDate.getMonth();
      const docYear = docDate.getFullYear();

      const monthIndex = last6Months.findIndex(
        (m) => m.month === docMonth && m.year === docYear
      );

      if (monthIndex !== -1) {
        if (doc.category === 'incoming') {
          last6Months[monthIndex].incoming += 1;
        } else if (doc.category === 'outgoing') {
          last6Months[monthIndex].outgoing += 1;
        } else if (doc.category === 'circular') {
          last6Months[monthIndex].circular += 1;
        }
      }
    });

    return last6Months;
  }, [documents]);

  const isEmpty = React.useMemo(() => {
    return data.every(m => m.incoming === 0 && m.outgoing === 0 && m.circular === 0);
  }, [data]);

  if (isEmpty) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <p className="text-slate-400 text-xs font-semibold">ไม่มีข้อมูลการเดินหนังสือในรอบ 6 เดือนนี้</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full" data-testid="document-bar-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="monthLabel" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
          />
          <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
          <Bar name="หนังสือรับ" dataKey="incoming" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar name="หนังสือส่ง" dataKey="outgoing" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar name="หนังสือเวียน" dataKey="circular" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
