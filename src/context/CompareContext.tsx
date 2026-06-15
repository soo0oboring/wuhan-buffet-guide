import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
import type { RestaurantDetail } from '../types';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface CompareState {
  compareList: RestaurantDetail[];
  toastMessage: string | null;
}

type CompareAction =
  | { type: 'ADD'; restaurant: RestaurantDetail }
  | { type: 'REMOVE'; detailId: string }
  | { type: 'CLEAR' }
  | { type: 'HIDE_TOAST' };

const MAX_COMPARE = 3;

function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case 'ADD': {
      if (state.compareList.length >= MAX_COMPARE) {
        return { ...state, toastMessage: `最多对比${MAX_COMPARE}家，请先移除一家` };
      }
      if (state.compareList.some((r) => r.detailId === action.restaurant.detailId)) {
        return { ...state, toastMessage: '该餐厅已在对比列表中' };
      }
      return {
        ...state,
        compareList: [...state.compareList, action.restaurant],
        toastMessage: `已加入对比（${state.compareList.length + 1}/${MAX_COMPARE}）`,
      };
    }
    case 'REMOVE': {
      const filtered = state.compareList.filter((r) => r.detailId !== action.detailId);
      return { ...state, compareList: filtered, toastMessage: filtered.length === 0 ? null : state.toastMessage };
    }
    case 'CLEAR':
      return { ...state, compareList: [], toastMessage: null };
    case 'HIDE_TOAST':
      return { ...state, toastMessage: null };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface CompareContextValue {
  compareList: RestaurantDetail[];
  addToCompare: (r: RestaurantDetail) => void;
  removeFromCompare: (detailId: string) => void;
  clearCompare: () => void;
  isInCompare: (detailId: string) => boolean;
  toastMessage: string | null;
  hideToast: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(compareReducer, {
    compareList: [],
    toastMessage: null,
  });

  const addToCompare = useCallback(
    (restaurant: RestaurantDetail) => dispatch({ type: 'ADD', restaurant }),
    [],
  );
  const removeFromCompare = useCallback(
    (detailId: string) => dispatch({ type: 'REMOVE', detailId }),
    [],
  );
  const clearCompare = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const isInCompare = useCallback(
    (detailId: string) => state.compareList.some((r) => r.detailId === detailId),
    [state.compareList],
  );
  const hideToast = useCallback(() => dispatch({ type: 'HIDE_TOAST' }), []);

  return (
    <CompareContext.Provider
      value={{
        compareList: state.compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        toastMessage: state.toastMessage,
        hideToast,
      }}
    >
      {children}
      {/* Global toast */}
      {state.toastMessage && (
        <Toast message={state.toastMessage} onDone={hideToast} />
      )}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className="bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
