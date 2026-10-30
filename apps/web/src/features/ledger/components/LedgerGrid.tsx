import { useEffect, useMemo, useRef, useState } from 'react'
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatHalalas } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { LedgerRow } from '../types'

const ROW_H = 40
const HEADER_H = 40
const COLS = '120px 140px minmax(170px,1.2fr) minmax(200px,2fr) 130px 130px'
const isNum = (id: string) => id === 'debit' || id === 'credit'

type Props = {
  rows: LedgerRow[]; total?: number
  loading: boolean; hasMore: boolean; loadingMore: boolean; onLoadMore: () => void
  order: 'asc' | 'desc'; onToggleOrder: () => void
  resetKey: string
}

export default function LedgerGrid({ rows, total, loading, hasMore, loadingMore, onLoadMore, order, onToggleOrder, resetKey }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const parentRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const columns = useMemo<ColumnDef<LedgerRow>[]>(() => [
    { id: 'date', header: t('ledger.date'), cell: ({ row }) => formatDate(row.original.entryDate, lang) },
    { id: 'ref', header: t('ledger.ref'), cell: ({ row }) => <bdi className="font-mono text-xs">{row.original.reference}</bdi> },
    {
      id: 'account', header: t('ledger.account'),
      cell: ({ row: { original: r } }) => <><bdi>{r.accountCode}</bdi> · {lang === 'ar' ? r.accountNameAr : r.accountNameEn}</>,
    },
    { id: 'desc', header: t('ledger.description'), cell: ({ row }) => <bdi>{row.original.description}</bdi> },
    { id: 'debit', header: t('ledger.debit'), cell: ({ row }) => (row.original.debit ? formatHalalas(row.original.debit, lang) : '') },
    { id: 'credit', header: t('ledger.credit'), cell: ({ row }) => (row.original.credit ? formatHalalas(row.original.credit, lang) : '') },
  ], [t, lang])

  const table = useReactTable({
    data: rows, columns, getCoreRowModel: getCoreRowModel(), getRowId: (r) => String(r.id),
  })
  const tableRows = table.getRowModel().rows

  const count = loading ? 12 : tableRows.length + (hasMore ? 1 : 0)
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
    scrollMargin: HEADER_H,       // the sticky header sits above the list inside the scroller
    scrollPaddingStart: HEADER_H, // keep keyboard-scrolled rows from hiding under it
  })
  const items = virtualizer.getVirtualItems()

  // Infinite loading: when the last rendered row is near the end of what we have, fetch more
  const lastIndex = items.at(-1)?.index ?? -1
  useEffect(() => {
    if (!loading && hasMore && !loadingMore && lastIndex >= tableRows.length - 20) onLoadMore()
  }, [lastIndex, tableRows.length, hasMore, loading, loadingMore, onLoadMore])

  // New filters: back to the top
  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 })
    setActive(0)
  }, [resetKey])

  function onKeyDown(e: React.KeyboardEvent) {
    if (!tableRows.length) return
    const page = Math.max(1, Math.floor((parentRef.current?.clientHeight ?? 400) / ROW_H) - 2)
    const max = tableRows.length - 1
    const target: Record<string, number> = {
      ArrowDown: active + 1, ArrowUp: active - 1,
      PageDown: active + page, PageUp: active - page, Home: 0, End: max,
    }
    if (!(e.key in target)) return
    e.preventDefault()
    const next = Math.min(max, Math.max(0, target[e.key]))
    setActive(next)
    virtualizer.scrollToIndex(next, { align: 'auto' })
  }

  const header = table.getHeaderGroups()[0].headers

  return (
    <div className="space-y-1">
      <div
        ref={parentRef}
        role="grid"
        tabIndex={0}
        aria-label={t('ledger.title')}
        aria-rowcount={(total ?? tableRows.length) + 1}
        aria-colcount={6}
        aria-activedescendant={tableRows.length ? `ledger-row-${active}` : undefined}
        onKeyDown={onKeyDown}
        className="h-[calc(100vh-20rem)] min-h-80 overflow-auto rounded-lg border focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div style={{ minWidth: 900 }}>
          <div
            role="row" aria-rowindex={1}
            className="sticky top-0 z-10 grid border-b bg-muted text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: COLS, height: HEADER_H }}
          >
            {header.map((h) => (
              <div key={h.id} role="columnheader"
                   aria-sort={h.id === 'date' ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
                   className={cn('flex items-center px-3', isNum(h.id) && 'justify-end')}>
                {h.id === 'date' ? (
                  <button type="button" onClick={onToggleOrder} className="inline-flex items-center gap-1 hover:text-foreground">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {order === 'asc' ? <ArrowUp className="size-3 rtl:-scale-x-100" /> : <ArrowDown className="size-3" />}
                  </button>
                ) : flexRender(h.column.columnDef.header, h.getContext())}
              </div>
            ))}
          </div>

          <div role="rowgroup" style={{ height: virtualizer.getTotalSize() - HEADER_H, position: 'relative' }}>
            {items.map((v) => {
              const row = tableRows[v.index]
              const style: React.CSSProperties = {
                position: 'absolute', top: 0, insetInlineStart: 0, width: '100%', height: v.size,
                transform: `translateY(${v.start - HEADER_H}px)`, gridTemplateColumns: COLS,
              }
              if (!row) {
                return (
                  <div key={`s${v.index}`} aria-hidden className="grid items-center border-b" style={style}>
                    <Skeleton className="col-span-full mx-3 h-4" />
                  </div>
                )
              }
              return (
                <div
                  key={row.id} id={`ledger-row-${v.index}`} role="row" aria-rowindex={v.index + 2}
                  aria-selected={v.index === active}
                  onClick={() => { setActive(v.index); parentRef.current?.focus() }}
                  className={cn('grid items-center border-b text-sm hover:bg-accent/50', v.index === active && 'bg-accent')}
                  style={style}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} role="gridcell"
                         className={cn('min-w-0 truncate px-3', isNum(cell.column.id) && 'text-end tabular-nums')}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {!loading && tableRows.length === 0 && (
        <p className="p-6 text-center text-sm text-muted-foreground">{t('ledger.empty')}</p>
      )}
      <p className="text-xs text-muted-foreground tabular-nums">
        {t('ledger.rendered', { dom: items.length, loaded: tableRows.length.toLocaleString('en-US'), total: (total ?? 0).toLocaleString('en-US') })}
      </p>
    </div>
  )
}