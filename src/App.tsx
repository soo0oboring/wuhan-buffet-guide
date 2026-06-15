import { useState, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { restaurants, areas, categories, priceRanges } from './data';
import FilterBar from './components/FilterBar';
import RestaurantCard from './components/RestaurantCard';
import EmptyState from './components/EmptyState';
import DetailPage from './components/DetailPage';
import ComparePage from './components/ComparePage';

function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('全部区域');
  const [category, setCategory] = useState('全部类型');
  const [priceRange, setPriceRange] = useState('全部价格');
  const [sortBy, setSortBy] = useState<'default' | 'score' | 'price'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let list = restaurants.filter((r) => {
      if (search && !r.name.includes(search)) return false;
      if (area !== '全部区域' && r.area !== area) return false;
      if (category !== '全部类型' && r.category !== category) return false;
      if (priceRange !== '全部价格') {
        const dinner = parseInt(r.dinnerPrice.replace(/[^0-9]/g, ''));
        if (priceRange === '¥100以下' && dinner >= 100) return false;
        if (priceRange === '¥100-200' && (dinner < 100 || dinner > 200)) return false;
        if (priceRange === '¥200-300' && (dinner < 200 || dinner > 300)) return false;
        if (priceRange === '¥300以上' && dinner <= 300) return false;
      }
      return true;
    });

    // Extract price as number once
    const priceOf = (r: typeof restaurants[0]) =>
      parseInt(r.lunchPrice.replace(/[^0-9]/g, '')) || 50;

    if (sortBy === 'score') {
      // desc = 高→低  asc = 低→高
      list.sort((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score);
    } else if (sortBy === 'price') {
      // desc = 贵→便宜  asc = 便宜→贵
      list.sort((a, b) => sortOrder === 'desc' ? priceOf(b) - priceOf(a) : priceOf(a) - priceOf(b));
    } else {
      // 综合: 评分(60%) + 价格优势(40%)  → desc = 综合最优在前
      const maxScore = Math.max(...restaurants.map((r) => r.score));
      const maxPrice = Math.max(...restaurants.map((r) => priceOf(r)));
      const composite = (r: typeof restaurants[0]) => {
        const sn = r.score / maxScore;
        const pn = 1 - priceOf(r) / maxPrice;
        return sn * 0.6 + pn * 0.4;
      };
      list.sort((a, b) => sortOrder === 'desc'
        ? composite(b) - composite(a)
        : composite(a) - composite(b));
    }
    return list;
  }, [search, area, category, priceRange, sortBy, sortOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            🍽️ 武汉自助餐 ·{' '}
            <span className="text-indigo-500">值不值得吃</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            收录 {restaurants.length} 家武汉自助餐厅，帮你找到最值的下一顿
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          area={area}
          onAreaChange={setArea}
          areas={areas}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          priceRanges={priceRanges}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onOrderToggle={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-4">
        <p className="text-sm text-slate-400">
          {filtered.length === restaurants.length
            ? `共 ${restaurants.length} 家餐厅`
            : `找到 ${filtered.length} 家符合条件的餐厅`}
        </p>
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                onClick={() => navigate(`/detail/${r.detailId}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      <footer className="text-center py-8 text-xs text-slate-400 border-t border-slate-200">
        武汉自助餐指南 · 数据仅供参考，实际价格以餐厅为准
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/detail/:detailId" element={<DetailPage />} />
      <Route path="/compare" element={<ComparePage />} />
    </Routes>
  );
}
