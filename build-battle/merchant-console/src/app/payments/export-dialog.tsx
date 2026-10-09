"use client"

import { Button } from "@/components/Button"
import { EXPORT_COLUMNS, ExportColumn } from "@/lib/csv"
import * as Dialog from "@radix-ui/react-dialog"
import { Download, X } from "lucide-react"
import { useEffect, useState } from "react"

/** Human-readable label shown next to each checkbox. */
const COLUMN_LABELS: Record<ExportColumn, string> = {
  id: "Payment ID",
  created_at: "Date",
  merchant: "Merchant",
  description: "Description",
  status: "Status",
  method: "Method",
  card_brand: "Card brand",
  last4: "Card last four",
  amount: "Amount",
  currency: "Currency",
}

/**
 * Card last four is off by default — the key safety improvement in NWP-101.
 * Ops must opt in deliberately before a file containing last4 leaves the tool.
 */
const DEFAULT_COLUMNS = new Set<ExportColumn>(
  EXPORT_COLUMNS.filter((c) => c !== "last4"),
)

interface ExportDialogProps {
  /** The current page's query string, forwarded to the export route when scope is "filter". */
  query: string
}

export function ExportDialog({ query }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<ExportColumn>>(
    new Set(DEFAULT_COLUMNS),
  )
  const [scope, setScope] = useState<"filter" | "all">("filter")
  const [counts, setCounts] = useState<{ filter: number | null; all: number | null }>({
    filter: null,
    all: null,
  })

  // Fetch both row counts when the dialog opens.
  useEffect(() => {
    if (!open) return
    setCounts({ filter: null, all: null })

    const filterQ = query ? `${query}&pageSize=1` : "pageSize=1"
    Promise.all([
      fetch(`/api/payments?${filterQ}`).then((r) => r.json()),
      fetch("/api/payments?pageSize=1").then((r) => r.json()),
    ])
      .then(([filterData, allData]) =>
        setCounts({ filter: filterData.total, all: allData.total }),
      )
      .catch(() => {
        // Counts stay null — not fatal; the dialog still works.
      })
  }, [open, query])

  function toggle(col: ExportColumn) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(col)) next.delete(col)
      else next.add(col)
      return next
    })
  }

  function download() {
    // Preserve EXPORT_COLUMNS order regardless of selection order.
    const cols = EXPORT_COLUMNS.filter((c) => selected.has(c))
    const params = new URLSearchParams(query)
    params.set("columns", cols.join(","))
    params.set("scope", scope)
    window.location.href = `/api/payments/export?${params.toString()}`
    setOpen(false)
  }

  const canDownload = selected.size > 0
  const rowCount = counts[scope]

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="secondary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Download
            className="-ml-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          Export
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl focus:outline-none dark:border-gray-800 dark:bg-gray-950"
          aria-describedby="export-dialog-desc"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
                Export payments
              </Dialog.Title>
              <p
                id="export-dialog-desc"
                className="mt-1 text-sm text-gray-500 dark:text-gray-400"
              >
                Choose which columns to include and how many rows to export.
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:text-gray-300"
                aria-label="Close export dialog"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scope */}
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Scope
            </legend>
            <div className="mt-2 flex flex-col gap-2.5">
              {(["filter", "all"] as const).map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="radio"
                    name="export-scope"
                    value={s}
                    checked={scope === s}
                    onChange={() => setScope(s)}
                    className="accent-blue-600"
                  />
                  <span className="flex-1">
                    {s === "filter" ? "Current filter" : "All payments"}
                  </span>
                  {counts[s] !== null && (
                    <span className="tabular-nums text-gray-400">
                      {counts[s]!.toLocaleString()} rows
                    </span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Columns */}
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Columns
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {EXPORT_COLUMNS.map((col) => (
                <label
                  key={col}
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(col)}
                    onChange={() => toggle(col)}
                    className="accent-blue-600"
                  />
                  {COLUMN_LABELS[col]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              {rowCount !== null
                ? `${rowCount.toLocaleString()} row${rowCount !== 1 ? "s" : ""} · ${selected.size} column${selected.size !== 1 ? "s" : ""}`
                : `${selected.size} column${selected.size !== 1 ? "s" : ""} selected`}
            </p>
            <div className="flex gap-2">
              <Dialog.Close asChild>
                <Button variant="secondary" className="py-1.5">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                className="gap-2 py-1.5"
                disabled={!canDownload}
                onClick={download}
              >
                <Download className="-ml-0.5 size-4 shrink-0" aria-hidden="true" />
                Download
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
