import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Calendar, BarChart3 } from 'lucide-react';
import type { ImpactCalculationResult } from '../types';

interface EmissionChartProps {
  impact: ImpactCalculationResult;
  cityName: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function EmissionChart({ impact, cityName }: EmissionChartProps) {
  const [metricType, setMetricType] = useState<'pm25' | 'co2'>('pm25');

  // Generate 7-day cumulative or daily projection data based on current impact results
  const dailyPm25Avoided = impact.weeklyPm25AvoidedGrams / 7;
  const dailyCo2Avoided = impact.weeklyCo2AvoidedKg / 7;
  const dailyBaselineExposureUg = impact.baselineDailyInhaledUg;
  const dailyMitigatedExposureUg = impact.mitigatedDailyInhaledUg;

  let cumulativeAvoided = 0;
  let cumulativeBaselineExposure = 0;
  let cumulativeMitigatedExposure = 0;

  const chartData = DAYS.map((day, idx) => {
    const factor = (idx + 1) / 7;
    if (metricType === 'pm25') {
      cumulativeAvoided += dailyPm25Avoided;
      cumulativeBaselineExposure += dailyBaselineExposureUg / 1000; // mg
      cumulativeMitigatedExposure += dailyMitigatedExposureUg / 1000; // mg
      return {
        day,
        Baseline: Number(cumulativeBaselineExposure.toFixed(1)),
        Mitigated: Number(cumulativeMitigatedExposure.toFixed(1)),
        Avoided: Number(cumulativeAvoided.toFixed(2)),
      };
    } else {
      const co2Val = Number((dailyCo2Avoided * (idx + 1)).toFixed(1));
      const baselineCo2Val = Number((dailyCo2Avoided * 1.8 * (idx + 1)).toFixed(1));
      return {
        day,
        Baseline: baselineCo2Val,
        Mitigated: co2Val,
        Avoided: Number((baselineCo2Val - co2Val).toFixed(1)),
      };
    }
  });

  return (
    <div className="bg-white border border-[#D8E2DF] rounded-xl p-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#4A5C58] mb-1">
            <BarChart3 className="w-4 h-4 text-[#175946]" />
            <span>7-Day Projected Impact Trajectory · {cityName}</span>
          </div>
          <h3 className="text-base font-semibold text-[#13221F]">
            {metricType === 'pm25' ? 'Cumulative Inhaled PM2.5 Dose (mg)' : 'Cumulative CO2e Emissions (kg)'}
          </h3>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#EDF2F0] rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setMetricType('pm25')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              metricType === 'pm25'
                ? 'bg-white text-[#13221F] shadow-sm'
                : 'text-[#4A5C58] hover:text-[#13221F]'
            }`}
          >
            Inhaled PM2.5 Dose
          </button>
          <button
            type="button"
            onClick={() => setMetricType('co2')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              metricType === 'co2'
                ? 'bg-white text-[#13221F] shadow-sm'
                : 'text-[#4A5C58] hover:text-[#13221F]'
            }`}
          >
            Carbon Emissions
          </button>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B45309" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#B45309" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorMitigated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#175946" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#175946" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F0" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#4A5C58"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#D8E2DF' }}
            />
            <YAxis
              stroke="#4A5C58"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#D8E2DF' }}
              unit={metricType === 'pm25' ? ' mg' : ' kg'}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#D8E2DF',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#13221F',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
              formatter={(val: unknown) => [
                `${Number(val ?? 0).toLocaleString()} ${metricType === 'pm25' ? 'mg' : 'kg'}`,
                '',
              ]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
            />
            <Area
              type="monotone"
              dataKey="Baseline"
              name="Unmitigated Baseline"
              stroke="#B45309"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBaseline)"
            />
            <Area
              type="monotone"
              dataKey="Mitigated"
              name="With Your Active Interventions"
              stroke="#175946"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorMitigated)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-[#D8E2DF] flex items-center justify-between text-xs text-[#4A5C58]">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#175946]" />
          <span>7-day rolling trajectory based on your active calculator toggles</span>
        </div>
        <span className="font-mono tabular-nums font-semibold text-[#175946]">
          {metricType === 'pm25'
            ? `${impact.weeklyPm25AvoidedGrams}g PM2.5 prevented this week`
            : `${impact.weeklyCo2AvoidedKg}kg CO2e prevented this week`}
        </span>
      </div>
    </div>
  );
}
