import { useParams, useNavigate } from 'react-router-dom';
import { detailDataMap } from '../detailData';
import { useCompare } from '../context/CompareContext';
import type { RestaurantDetail } from '../types';

function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  const color =
    value >= 9 ? 'bg-emerald-500' : value >= 8 ? 'bg-blue-500' : value >= 7 ? 'bg-amber-500' : 'bg-slate-400';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-slate-700 w-10 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function MonthlyChart({ data }: { data: RestaurantDetail['monthlyScores'] }) {
  const maxCount = Math.max(...data.map((d) => d.reviewCount));
  const maxScore = 10;

  return (
    <div>
      <div className="flex items-end gap-2 h-32 mb-2">
        {data.map((d) => {
          const barH = (d.averageScore / maxScore) * 100;
          const dotSize = Math.max(4, (d.reviewCount / maxCount) * 20);
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-slate-700">{d.averageScore.toFixed(1)}</span>
              <div className="w-full flex-1 bg-slate-100 rounded-t-md relative overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-indigo-400 rounded-t-md transition-all duration-500"
                  style={{ height: `${barH}%` }}
                />
              </div>
              <div
                className="rounded-full bg-indigo-100 border-2 border-indigo-300 shrink-0"
                style={{ width: dotSize + 4, height: dotSize + 4 }}
                title={`${d.reviewCount}条评价`}
              />
              <span className="text-xs text-slate-400">{d.month.slice(5)}月</span>
              <span className="text-xs text-slate-300">{d.reviewCount}评</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: RestaurantDetail['reviews'][number] }) {
  return (
    <div
      className={`p-4 rounded-xl border ${
        review.isPositive
          ? 'bg-emerald-50/50 border-emerald-200'
          : 'bg-red-50/50 border-red-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-800">{review.userName}</span>
          {review.verified && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
              到店消费
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{review.date}</span>
          <span
            className={`text-sm font-bold ${
              review.isPositive ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>
    </div>
  );
}

export default function DetailPage() {
  const { detailId } = useParams<{ detailId: string }>();
  const navigate = useNavigate();
  const { compareList, addToCompare, removeFromCompare, isInCompare } = useCompare();

  const detail = detailId ? detailDataMap[detailId] : undefined;
  const inCompare = detail ? isInCompare(detail.detailId) : false;

  const handleToggleCompare = () => {
    if (!detail) return;
    if (inCompare) {
      removeFromCompare(detail.detailId);
    } else {
      addToCompare(detail);
    }
  };

  if (!detail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-500 mb-4">😕 找不到该餐厅的详细信息</p>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-500 hover:underline"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const dims: { key: keyof RestaurantDetail['ratings']; label: string }[] = [
    { key: 'foodQuality', label: '菜品质量' },
    { key: 'variety', label: '品类丰富' },
    { key: 'valueForMoney', label: '价格价值' },
    { key: 'environment', label: '环境服务' },
    { key: 'experience', label: '就餐体验' },
  ];

  const posReviews = detail.reviews.filter((r) => r.isPositive);


  const negReviews = detail.reviews.filter((r) => !r.isPositive);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 truncate">{detail.name}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{detail.area}</span>
              <span>·</span>
              <span>{detail.category}</span>
              <span>·</span>
              <span>
                午市 {detail.lunchPrice} / 晚市 {detail.dinnerPrice}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-3xl font-extrabold text-indigo-500">{detail.score.toFixed(1)}</span>
            <span className="text-sm text-slate-400 block">综合评分</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleCompare}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              inCompare
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md'
            }`}
          >
            {inCompare ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已加入对比
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                加入对比
              </>
            )}
          </button>
          {inCompare && (
            <span className="text-xs text-slate-400">
              已选 {compareList.length}/3 家
            </span>
          )}
        </div>

        {/* 五维评分 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">📊 五维评分</h2>
          <div className="space-y-3">
            {dims.map((d) => (
              <RatingBar key={d.key} label={d.label} value={detail.ratings[d.key]} />
            ))}
          </div>
        </section>

        {/* 月度评分趋势 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">📈 近6个月评分趋势</h2>
          <MonthlyChart data={detail.monthlyScores} />
        </section>

        {/* 怎么吃最划算 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">💡 怎么吃最划算</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4">
              <h3 className="font-semibold text-emerald-700 mb-2 text-sm">✅ 必吃回本菜</h3>
              <ul className="space-y-1">
                {detail.tips.mustEat.map((item) => (
                  <li key={item} className="text-sm text-emerald-800 flex items-center gap-1">
                    <span className="text-emerald-400">+</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <h3 className="font-semibold text-red-600 mb-2 text-sm">⚠️ 避雷提醒</h3>
              <ul className="space-y-1">
                {detail.tips.avoid.map((item) => (
                  <li key={item} className="text-sm text-red-700 flex items-center gap-1">
                    <span className="text-red-400">-</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-700 mb-2 text-sm">🕐 最佳时间</h3>
              <p className="text-sm text-blue-800">{detail.tips.bestTime}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <h3 className="font-semibold text-amber-700 mb-2 text-sm">🎫 优惠渠道</h3>
              <p className="text-sm text-amber-800">{detail.tips.discount}</p>
            </div>
          </div>
          <div className="mt-4 bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">📌 其他提醒：</span>
              {detail.tips.other}
            </p>
          </div>
        </section>

        {/* 用户评价 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            💬 用户评价
            <span className="text-sm font-normal text-slate-400 ml-2">
              共 {detail.reviews.length} 条
            </span>
          </h2>

          {/* 好评 */}
          {posReviews.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-emerald-600 mb-2">
                👍 好评 ({posReviews.length})
              </h3>
              <div className="space-y-2">
                {posReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </div>
          )}

          {/* 差评 */}
          {negReviews.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-500 mb-2">
                👎 差评 ({negReviews.length})
              </h3>
              <div className="space-y-2">
                {negReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Bottom bar — compare FAB */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-20 animate-slide-up">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                已选{' '}
                <span className="font-bold text-indigo-500">{compareList.length}</span>
                {' '}家餐厅
              </span>
              <div className="flex -space-x-2">
                {compareList.map((r, i) => (
                  <div
                    key={r.detailId}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: ['#6366f1', '#f59e0b', '#10b981'][i % 3] }}
                    title={r.name}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('/compare')}
              className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-semibold text-sm hover:bg-indigo-600 transition-colors shadow-md"
            >
              开始对比 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
