import { Users, UserPlus, TrendingUp, Euro } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock data
const monthlyRevenue = [
  { month: 'Jul', revenue: 28500 },
  { month: 'Aug', revenue: 32400 },
  { month: 'Sep', revenue: 29800 },
  { month: 'Oct', revenue: 35600 },
  { month: 'Nov', revenue: 38200 },
  { month: 'Dec', revenue: 41800 },
];

const demographics = [
  { name: 'Male', value: 58, color: '#D4AF37' },
  { name: 'Female', value: 38, color: '#FFD700' },
  { name: 'Other', value: 4, color: '#B8860B' },
];

const ageGroups = [
  { name: '18-24', value: 35, color: '#D4AF37' },
  { name: '25-30', value: 42, color: '#FFD700' },
  { name: '31-35', value: 18, color: '#B8860B' },
  { name: '36+', value: 5, color: '#DAA520' },
];

const userGrowth = [
  { month: 'Jul', users: 1240 },
  { month: 'Aug', users: 1580 },
  { month: 'Sep', users: 1820 },
  { month: 'Oct', users: 2340 },
  { month: 'Nov', users: 2890 },
  { month: 'Dec', users: 3456 },
];

export function Insights() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Insights & Analytics</h1>
        <p className="text-gray-400">Long-term business intelligence</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div
          className="p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Total Users</p>
          </div>
          <p className="text-4xl font-black text-white mb-2">3,456</p>
          <p className="text-sm text-green-400">+19.5% this month</p>
        </div>

        {/* Active RPs */}
        <div
          className="p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <UserPlus className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Active RPs</p>
          </div>
          <p className="text-4xl font-black text-white mb-2">24</p>
          <p className="text-sm text-green-400">+3 new this month</p>
        </div>

        {/* Avg Ticket Price */}
        <div
          className="p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <Euro className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Avg. Ticket</p>
          </div>
          <p className="text-4xl font-black text-white mb-2">€26</p>
          <p className="text-sm text-green-400">+€2 vs last month</p>
        </div>

        {/* Total Revenue */}
        <div
          className="p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Total Revenue</p>
          </div>
          <p className="text-4xl font-black text-white mb-2">€206K</p>
          <p className="text-sm text-green-400">Last 6 months</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div
          className="p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-xl font-black text-white mb-6">Monthly Revenue Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="#888888" />
              <YAxis stroke="#888888" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10, 10, 10, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff'
                }}
                formatter={(value) => [`€${value}`, 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[12, 12, 0, 0]}>
                {monthlyRevenue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#D4AF37" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div
          className="p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-xl font-black text-white mb-6">User Growth (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="#888888" />
              <YAxis stroke="#888888" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10, 10, 10, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff'
                }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#D4AF37"
                strokeWidth={3}
                dot={{ fill: '#D4AF37', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 - Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Demographics */}
        <div
          className="p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-xl font-black text-white mb-6">Gender Demographics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={demographics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {demographics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(10, 10, 10, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {demographics.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: item.color }}
                ></div>
                <span className="text-sm text-gray-400">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Age Demographics */}
        <div
          className="p-6 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-xl font-black text-white mb-6">Age Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ageGroups}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ageGroups.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(10, 10, 10, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {ageGroups.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: item.color }}
                ></div>
                <span className="text-sm text-gray-400">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
