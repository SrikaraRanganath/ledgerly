import { useMemo, useReducer } from 'react'
import { calcTotals } from '@ledgerly/shared'
import type { Product } from '../types'

export type CartLine = { product: Product; qty: number }
export type CartState = { lines: CartLine[]; selectedId: number | null }

type Action =
  | { type: 'add'; product: Product }
  | { type: 'change'; id: number; delta: number }
  | { type: 'remove'; id: number }
  | { type: 'select'; id: number | null }
  | { type: 'move'; dir: 1 | -1 }
  | { type: 'reset'; state: CartState }

const empty: CartState = { lines: [], selectedId: null }

function fix(lines: CartLine[], selectedId: number | null): CartState {
  const ok = lines.some((l) => l.product.id === selectedId)
  return { lines, selectedId: ok ? selectedId : (lines.at(-1)?.product.id ?? null) }
}

function reducer(state: CartState, a: Action): CartState {
  switch (a.type) {
    case 'add': {
      const existing = state.lines.find((l) => l.product.id === a.product.id)
      if (!existing) {
        if (a.product.stock < 1) return state
        return { lines: [...state.lines, { product: a.product, qty: 1 }], selectedId: a.product.id }
      }
      return {
        lines: state.lines.map((l) =>
          l.product.id === a.product.id ? { ...l, qty: Math.min(l.product.stock, l.qty + 1) } : l),
        selectedId: a.product.id,
      }
    }
    case 'change': {
      const lines = state.lines
        .map((l) => (l.product.id === a.id ? { ...l, qty: Math.min(l.product.stock, l.qty + a.delta) } : l))
        .filter((l) => l.qty > 0)
      return fix(lines, state.selectedId)
    }
    case 'remove':
      return fix(state.lines.filter((l) => l.product.id !== a.id), state.selectedId)
    case 'select':
      return { ...state, selectedId: a.id }
    case 'move': {
      if (!state.lines.length) return state
      const i = state.lines.findIndex((l) => l.product.id === state.selectedId)
      const next = Math.min(state.lines.length - 1, Math.max(0, (i < 0 ? 0 : i) + a.dir))
      return { ...state, selectedId: state.lines[next].product.id }
    }
    case 'reset':
      return a.state
  }
}

export function useCart() {
  const [state, dispatch] = useReducer(reducer, empty)
  const totals = useMemo(
    () => calcTotals(state.lines.map((l) => ({ priceHalalas: l.product.priceHalalas, vatRate: l.product.vatRate, qty: l.qty }))),
    [state.lines],
  )
  return {
    state, totals, lines: state.lines, selectedId: state.selectedId,
    add: (product: Product) => dispatch({ type: 'add', product }),
    change: (id: number, delta: number) => dispatch({ type: 'change', id, delta }),
    remove: (id: number) => dispatch({ type: 'remove', id }),
    select: (id: number | null) => dispatch({ type: 'select', id }),
    move: (dir: 1 | -1) => dispatch({ type: 'move', dir }),
    reset: (s: CartState) => dispatch({ type: 'reset', state: s }),
    clear: () => dispatch({ type: 'reset', state: empty }),
  }
}