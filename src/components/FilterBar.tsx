interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  area: string;
  onAreaChange: (v: string) => void;
  areas: string[];
  category: string;
  onCategoryChange: (v: string) => void;
  categories: string[];
  priceRange: string;
  onPriceRangeChange: (v: string) => void;
  priceRanges: string[];
  sortBy: 'default' | 'score' | 'price';
  onSortChange: (v: 'default' | 'score' | 'price') => void;
  sortOrder: 'asc' | 'desc';
  onOrderToggle: () => void;
}

export default function FilterBar({
  search,
  onSearchChange,
  area,
  onAreaChange,
  areas,
  category,
  onCategoryChange,
  categories,
  priceRange,
  onPriceRangeChange,
  priceRanges,
  sortBy,
  onSortChange,
  sortOrder,
  onOrderToggle,
}: FilterBarProps) {
  const selectClass =
    'px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all';

  const btnBase =
    'px-3 py-2 rounded-xl border text-sm font-medium outline-none transition-all cursor-pointer';

  function sortBtnStyle(key: 'default' | 'score' | 'price') {
    if (sortBy === key) {
      return `${btnBase} bg-indigo-500 text-white border-indigo-500`;
    }
    return `${btnBase} bg-white text-slate-600 border-slate-200 hover:border-slate-300`;
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[360px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="搜索餐厅名称..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${selectClass} pl-9 w-full`}
        />
      </div>

      {/* Area */}
      <select value={area} onChange={(e) => onAreaChange(e.target.value)} className={selectClass}>
        {areas.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      {/* Category */}
      <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={selectClass}>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Price range */}
      <select value={priceRange} onChange={(e) => onPriceRangeChange(e.target.value)} className={selectClass}>
        {priceRanges.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Sort buttons */}
      <button onClick={() => onSortChange('default')} className={sortBtnStyle('default')}>
        🔥 综合排序
      </button>
      <button onClick={() => onSortChange('score')} className={sortBtnStyle('score')}>
        ⭐ 评分排序
      </button>
      <button onClick={() => onSortChange('price')} className={sortBtnStyle('price')}>
        💰 价格排序
      </button>

      {/* Order toggle */}
      <button
        onClick={onOrderToggle}
        className={`${btnBase} bg-white text-slate-500 border-slate-200 hover:border-slate-300`}
        title={sortOrder === 'desc' ? '从高到低' : '从低到高'}
      >
        {sortOrder === 'desc' ? '↓ 从高到低' : '↑ 从低到高'}
      </button>
    </div>
  );
}
