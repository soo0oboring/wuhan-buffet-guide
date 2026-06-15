import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import type { RestaurantDetail } from '../types';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as LineTooltip,
  Legend as LineLegend,
} from 'recharts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = ['#6366f1', '#f59e0b', '#10b981']; // indigo, amber, emerald

const RADAR_DIMS: { key: keyof RestaurantDetail['ratings']; label: string }[] = [
  { key: 'foodQuality', label: '菜品质量' },
  { key: 'variety', label: '品类丰富度' },
  { key: 'valueForMoney', label: '价格价值感' },
  { key: 'environment', label: '环境与服务' },
  { key: 'experience', label: '就餐体验' },
];

const MONTH_LABELS: Record<string, string> = {
  '2026-01': '01月', '2026-02': '02月', '2026-03': '03月',
  '2026-04': '04月', '2026-05': '05月', '2026-06': '06月',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTimeLimit(other: string): string {
  if (other.includes('不限时')) return '不限时';
  const m = other.match(/(\d+\.?\d*)小时/);
  if (m) return m[0];
  return '建议电话确认';
}

function getParking(area: string, price: number, name: string): string {
  if (name.includes('酒店')) return '免费停车';
  if (price >= 250) return '免费停车';
  if (['光谷', '汉阳', '江夏', '黄陂', '新洲', '东西湖'].includes(area)) return '免费停车';
  if (area === '汉口' && price >= 150) return '商场停车，消费抵扣';
  return '收费停车';
}

function getScenarios(r: RestaurantDetail): string {
  const price = parseInt(r.dinnerPrice.replace(/[^0-9]/g, '')) || 100;
  if (r.name.includes('酒店')) return '商务宴请、约会';
  if (price >= 250) return '商务宴请、纪念日';
  if (r.category === '海鲜自助') return '家庭聚会、海鲜控';
  if (r.category === '烤肉自助') return '朋友聚餐、学生聚会';
  if (r.category === '火锅自助') return '朋友聚餐、冬日暖身';
  if (r.category === '烤涮一体') return '朋友聚餐、大胃王';
  return '朋友聚餐、日常用餐';
}

function generateRadarSummary(list: RestaurantDetail[]): string {
  if (list.length < 2) return '';
  // Find each restaurant's top dimensions
  const strengths: Record<string, string[]> = {};
  list.forEach((r) => { strengths[r.name] = []; });

  for (const dim of RADAR_DIMS) {
    const sorted = [...list].sort(
      (a, b) => b.ratings[dim.key] - a.ratings[dim.key],
    );
    const best = sorted[0];
    if (best) strengths[best.name].push(dim.label);
  }

  const parts = list.map((r) => {
    const s = strengths[r.name];
    if (!s || s.length === 0) return `${r.name}各维度表现均衡`;
    return `${r.name}在<span class="font-semibold">${s.join('、')}</span>上领先`;
  });

  return parts.join('；') + '。';
}

function generateTrendSummary(list: RestaurantDetail[]): string {
  const parts = list.map((r) => {
    const scores = r.monthlyScores.map((m) => m.averageScore);
    if (scores.length <= 2) return `${r.name}样本较少，仅供参考`;
    const first = scores[0];
    const last = scores[scores.length - 1];
    const stability = Math.max(...scores) - Math.min(...scores);
    const trend = last - first;

    if (stability <= 0.5) return `${r.name}评分持续稳定在${first.toFixed(1)}分左右`;
    if (trend > 0.5 && stability > 1) return `${r.name}近月评分稳步上升`;
    if (trend < -0.5 && stability > 1) return `${r.name}近两月有明显下滑趋势`;
    return `${r.name}评分波动较大但整体向好`;
  });
  return parts.join('；') + '。';
}

// ---------------------------------------------------------------------------
// Custom Tooltips
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RadarTooltipContent({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-1">
        {payload[0]?.payload?.dimension ?? ''}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500">{entry.name}</span>
          <span className="font-bold text-slate-800 ml-auto">
            {entry.value.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LineTooltipContent({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-500 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500">{entry.name}</span>
          <span className="font-bold text-slate-800 ml-auto">
            {entry.value != null ? entry.value.toFixed(1) : '暂无数据'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RadarCompare({ list }: { list: RestaurantDetail[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const data = useMemo(() => {
    return RADAR_DIMS.map((dim) => {
      const point: Record<string, string | number> = {
        dimension: dim.label,
      };
      list.forEach((r) => {
        point[r.detailId] = r.ratings[dim.key];
        point[`${r.detailId}_name`] = r.name;
      });
      return point;
    });
  }, [list]);

  const toggleHidden = useCallback((detailId: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(detailId)) next.delete(detailId);
      else next.add(detailId);
      return next;
    });
  }, []);

  const visibleList = list.filter((r) => !hidden.has(r.detailId));
  const summary = useMemo(() => generateRadarSummary(visibleList.length >= 2 ? visibleList : list), [visibleList, list]);

  if (list.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-1">📊 五维评分对比</h2>
      <p className="text-xs text-slate-400 mb-4">点击图例可切换显示/隐藏</p>

      <div className="w-full" style={{ maxWidth: 600, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 13, fill: '#475569' }}
            />
            <PolarRadiusAxis
              domain={[0, 10]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickCount={6}
            />
            <Tooltip content={<RadarTooltipContent />} />
            {list.map((r, i) => (
              <Radar
                key={r.detailId}
                name={r.name}
                dataKey={r.detailId}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={hidden.has(r.detailId) ? 0 : 0.15}
                strokeWidth={hidden.has(r.detailId) ? 0.5 : 2}
                strokeDasharray={hidden.has(r.detailId) ? '4 4' : undefined}
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
              onClick={(e) => {
                const key = list.find((r) => r.name === e.value)?.detailId;
                if (key) toggleHidden(key);
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="mt-4 bg-indigo-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: summary }}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------

function TrendCompare({ list }: { list: RestaurantDetail[] }) {
  // All restaurants have the same months, but we unify to a superset
  const allMonthsSet = new Set<string>();
  list.forEach((r) => r.monthlyScores.forEach((m) => allMonthsSet.add(m.month)));
  const allMonths = Array.from(allMonthsSet).sort();

  const data = useMemo(() => {
    return allMonths.map((month) => {
      const point: Record<string, string | number | null> = {
        month: MONTH_LABELS[month] || month.slice(5),
        _rawMonth: month,
      };
      list.forEach((r) => {
        const entry = r.monthlyScores.find((m) => m.month === month);
        point[r.detailId] = entry ? entry.averageScore : null;
        point[`${r.detailId}_count`] = entry ? entry.reviewCount : 0;
        point[`${r.detailId}_name`] = r.name;
      });
      return point;
    });
  }, [list, allMonths]);

  const summary = useMemo(() => generateTrendSummary(list), [list]);

  if (list.length === 0 || allMonths.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4">📈 用户口碑趋势</h2>

      <div className="w-full" style={{ maxWidth: 700, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickCount={6}
            />
            <LineTooltip content={<LineTooltipContent />} />
            <LineLegend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
            {list.map((r, i) => (
              <Line
                key={r.detailId}
                type="monotone"
                dataKey={r.detailId}
                name={r.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  stroke: COLORS[i % COLORS.length],
                  strokeWidth: 2,
                  fill: '#fff',
                }}
                activeDot={{ r: 6 }}
                connectNulls={false}
                legendType="line"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
        {allMonths.length <= 2 && (
          <p className="text-amber-600 font-medium mb-2">
            ⚠️ 样本较少，仅供参考
          </p>
        )}
        {summary}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function CompareTable({ list }: { list: RestaurantDetail[] }) {
  type Row = { label: string; values: string[]; highlight: boolean };
  const rows: Row[] = useMemo(() => {
    const result: Row[] = [];

    // 午市人均
    const lunchPrices = list.map((r) => r.lunchPrice);
    result.push({ label: '午市最低人均', values: lunchPrices, highlight: new Set(lunchPrices).size > 1 });

    // 晚市人均
    const dinnerPrices = list.map((r) => r.dinnerPrice);
    result.push({ label: '晚市/周末人均', values: dinnerPrices, highlight: new Set(dinnerPrices).size > 1 });

    // 最优优惠
    const discounts = list.map((r) => r.tips.discount);
    result.push({ label: '最优优惠', values: discounts, highlight: new Set(discounts).size > 1 });

    // 好评
    const goodReviews = list.map((r) => r.goodReview);
    result.push({ label: '👍 好评', values: goodReviews, highlight: new Set(goodReviews).size > 1 });

    // 差评
    const badReviews = list.map((r) => r.badReview);
    result.push({ label: '👎 差评', values: badReviews, highlight: new Set(badReviews).size > 1 });

    // 限时
    const timeLimits = list.map((r) => extractTimeLimit(r.tips.other));
    result.push({ label: '限时', values: timeLimits, highlight: new Set(timeLimits).size > 1 });

    // 停车
    const parkings = list.map((r) => {
      const price = parseInt(r.dinnerPrice.replace(/[^0-9]/g, '')) || 100;
      return getParking(r.area, price, r.name);
    });
    result.push({ label: '停车', values: parkings, highlight: new Set(parkings).size > 1 });

    // 适合场景
    const scenarios = list.map((r) => getScenarios(r));
    result.push({ label: '适合场景', values: scenarios, highlight: new Set(scenarios).size > 1 });

    return result;
  }, [list]);

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4">📋 横向对比</h2>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-slate-500 font-medium w-32">
                对比项
              </th>
              {list.map((r, i) => (
                <th
                  key={r.detailId}
                  className="py-3 px-4 text-center font-bold"
                  style={{ color: COLORS[i % COLORS.length] }}
                >
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className={`border-b border-slate-100 ${
                  row.highlight ? 'bg-amber-50/60' : ''
                }`}
              >
                <td className="py-3 px-4 text-slate-500 font-medium">
                  {row.highlight && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 align-middle" />
                  )}
                  {row.label}
                </td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={`py-3 px-4 text-center text-slate-700 ${
                      row.highlight ? 'font-semibold' : ''
                    }`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card stack */}
      <div className="sm:hidden space-y-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`rounded-xl p-3 ${
              row.highlight ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'
            }`}
          >
            <p className="text-xs text-slate-400 font-medium mb-2">
              {row.label}
            </p>
            <div className="space-y-1.5">
              {row.values.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-xs font-medium" style={{ color: COLORS[i % COLORS.length] }}>
                    {list[i]?.name}：
                  </span>
                  <span className="text-sm text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function TipsAccordion({ list }: { list: RestaurantDetail[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // default: expand first
    return new Set(list.length > 0 ? [list[0].detailId] : []);
  });

  const toggle = useCallback((detailId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(detailId)) next.delete(detailId);
      else next.add(detailId);
      return next;
    });
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">💡 回本攻略对比</h2>
      {list.map((r, i) => {
        const isOpen = expanded.has(r.detailId);
        return (
          <div
            key={r.detailId}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <button
              onClick={() => toggle(r.detailId)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="font-semibold text-slate-800">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                【{r.name}】怎么吃最划算
              </span>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <h4 className="font-semibold text-emerald-700 mb-1.5 text-sm">
                      🔥 必吃回本菜
                    </h4>
                    <ul className="space-y-0.5">
                      {r.tips.mustEat.map((item) => (
                        <li
                          key={item}
                          className="text-sm text-emerald-800 flex items-center gap-1"
                        >
                          <span className="text-emerald-400">+</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <h4 className="font-semibold text-red-600 mb-1.5 text-sm">
                      ❌ 千万别拿
                    </h4>
                    <ul className="space-y-0.5">
                      {r.tips.avoid.map((item) => (
                        <li
                          key={item}
                          className="text-sm text-red-700 flex items-center gap-1"
                        >
                          <span className="text-red-400">-</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <h4 className="font-semibold text-blue-700 mb-1.5 text-sm">
                      ⏰ 最佳到店时间
                    </h4>
                    <p className="text-sm text-blue-800">{r.tips.bestTime}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <h4 className="font-semibold text-amber-700 mb-1.5 text-sm">
                      💰 优惠薅羊毛
                    </h4>
                    <p className="text-sm text-amber-800">{r.tips.discount}</p>
                  </div>
                </div>
                <div className="mt-3 bg-slate-50 rounded-xl p-3">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">📌 其他提醒：</span>
                    {r.tips.other}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main Compare Page
// ---------------------------------------------------------------------------

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  // ---- Edge case: empty ----
  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <svg
            className="w-20 h-20 mx-auto mb-4 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-xl font-bold text-slate-700 mb-2">对比列表为空</h2>
          <p className="text-slate-500 mb-6">请先从详情页加入餐厅</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
          >
            去首页看看
          </button>
        </div>
      </div>
    );
  }

  // ---- Edge case: only 1 ----
  if (compareList.length === 1) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <svg
            className="w-20 h-20 mx-auto mb-4 text-amber-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h2 className="text-xl font-bold text-slate-700 mb-2">
            至少需要 2 家餐厅才能对比
          </h2>
          <p className="text-slate-500 mb-2">
            当前只加入了{' '}
            <span className="font-semibold text-indigo-500">
              {compareList[0]?.name}
            </span>
          </p>
          <p className="text-sm text-slate-400 mb-6">
            请从详情页再加入至少一家餐厅
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
            >
              去首页
            </button>
            <button
              onClick={() => {
                if (compareList[0])
                  navigate(`/detail/${compareList[0].detailId}`);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-medium hover:bg-slate-100 transition-colors"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Normal comparison ----
  const handleRemove = (detailId: string) => {
    removeFromCompare(detailId);
    // If after removal only 1 left, go back
    if (compareList.length === 2) {
      // removal is async via reducer; we'll check on next render
    }
  };

  // After remove, if only 1 left, redirect
  // (We do this inline since React batches the state update)
  if (compareList.length < 2) {
    // This shouldn't normally happen since we handle 0 & 1 above,
    // but just in case the component re-renders between state changes
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                餐厅对比 · 谁更值得吃
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {compareList.length} 家餐厅全方位对比
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              clearCompare();
              navigate('/');
            }}
            className="text-sm px-3 py-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            清空对比列表
          </button>
        </div>
      </header>

      {/* Restaurant name cards */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {compareList.map((r, i) => (
            <div
              key={r.detailId}
              className="relative flex-shrink-0 bg-white rounded-xl border border-slate-200 p-3 pr-10 min-w-[180px] cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/detail/${r.detailId}`)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(r.detailId);
                }}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                title="移除此餐厅"
              >
                ✕
              </button>
              <p className="font-bold text-slate-800 text-sm truncate pr-2">
                {r.name}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {r.area} · {r.category}
              </p>
              <p className="text-xs mt-1">
                <span
                  className="font-bold text-lg"
                  style={{ color: COLORS[i % COLORS.length] }}
                >
                  {r.score.toFixed(1)}
                </span>
                <span className="text-slate-400 ml-1">分</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 pb-16 space-y-6">
        {/* 1. Radar chart */}
        <RadarCompare list={compareList} />

        {/* 2. Trend line chart */}
        <TrendCompare list={compareList} />

        {/* 3. Comparison table */}
        <CompareTable list={compareList} />

        {/* 4. Tips accordion */}
        <TipsAccordion list={compareList} />
      </main>
    </div>
  );
}
