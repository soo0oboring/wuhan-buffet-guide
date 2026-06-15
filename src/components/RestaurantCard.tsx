import type { Restaurant } from '../types';

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 9.0
      ? 'bg-amber-500 text-white'
      : score >= 8.0
        ? 'bg-emerald-500 text-white'
        : score >= 7.0
          ? 'bg-blue-500 text-white'
          : 'bg-slate-400 text-white';

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-sm font-bold ${color}`}
    >
      {score.toFixed(1)}
    </span>
  );
}

export default function RestaurantCard({
  restaurant,
  onClick,
}: {
  restaurant: Restaurant;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm
                 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5
                 transition-all duration-200 cursor-pointer flex flex-col gap-3"
    >
      {/* Top: name + score */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-800 leading-snug line-clamp-2 flex-1">
          {restaurant.name}
        </h3>
        <div className="shrink-0">
          <ScoreBadge score={restaurant.score} />
        </div>
      </div>

      {/* Area + Category */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full">
          📍 {restaurant.area}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full">
          🍽️ {restaurant.category}
        </span>
      </div>

      {/* Price */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-xs">午市</span>
          <span className="font-semibold text-slate-700">{restaurant.lunchPrice}</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-xs">晚市</span>
          <span className="font-semibold text-slate-700">{restaurant.dinnerPrice}</span>
        </div>
      </div>

      {/* Reviews */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-1.5">
          <span className="text-xs shrink-0 mt-0.5">👍</span>
          <span className="text-xs text-slate-500 leading-relaxed">
            {restaurant.goodReview}
          </span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-xs shrink-0 mt-0.5">👎</span>
          <span className="text-xs text-slate-400 leading-relaxed">
            {restaurant.badReview}
          </span>
        </div>
      </div>
    </div>
  );
}
