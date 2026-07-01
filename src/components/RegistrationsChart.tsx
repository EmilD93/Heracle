import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
const DATA = [
  {
    day: 'Mon',
    registrations: 120,
  },
  {
    day: 'Tue',
    registrations: 210,
  },
  {
    day: 'Wed',
    registrations: 180,
  },
  {
    day: 'Thu',
    registrations: 320,
  },
  {
    day: 'Fri',
    registrations: 450,
  },
  {
    day: 'Sat',
    registrations: 380,
  },
  {
    day: 'Sun',
    registrations: 520,
  },
]
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white rounded-[1rem] shadow-lg border border-slate-100 px-4 py-2.5">
      <p className="text-xs font-bold text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-extrabold text-slate-800">
        {payload[0].value.toLocaleString()} registrations
      </p>
    </div>
  )
}
export function RegistrationsChart() {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.15,
      }}
      className="bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-slate-100/80 p-6 flex flex-col"
      aria-label="Registrations over the past week"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Registrations This Week
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">
            Total sign-ups across all events
          </p>
        </div>
        <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100/50">
          +18% vs last week
        </span>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={DATA}
            margin={{
              top: 10,
              right: 8,
              left: -18,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#94a3b8',
                fontSize: 13,
                fontWeight: 700,
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#cbd5e1',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                stroke: '#cbd5e1',
                strokeDasharray: '4 4',
              }}
            />
            <Area
              type="monotone"
              dataKey="registrations"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#regGradient)"
              dot={{
                fill: '#3b82f6',
                r: 4,
                strokeWidth: 2,
                stroke: '#fff',
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                stroke: '#fff',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  )
}
