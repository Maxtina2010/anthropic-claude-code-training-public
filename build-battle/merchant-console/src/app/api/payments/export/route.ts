import { filterPayments, parseFilters, sortPayments } from "@/data/queries"
import { EXPORT_COLUMNS, ExportColumn, exportFilename, toCsv } from "@/lib/csv"
import { NextRequest } from "next/server"

/**
 * Exports the payments table as CSV.
 *
 * Accepts two new params from the export dialog (NWP-101):
 *   columns — comma-separated list validated against EXPORT_COLUMNS allowlist.
 *             Defaults to the full column set when absent.
 *   scope   — "all" exports every payment regardless of active filters;
 *             anything else (default: "filter") exports only the filtered set.
 *
 * Column names arrive from the client and are validated here before they reach
 * toCsv(). Never interpolate them directly.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  // Validate columns against the allowlist.
  const rawColumns = params.get("columns")
  let columns: readonly ExportColumn[]
  if (rawColumns) {
    const requested = rawColumns.split(",").map((c) => c.trim())
    const valid = requested.filter((c): c is ExportColumn =>
      (EXPORT_COLUMNS as readonly string[]).includes(c),
    )
    if (valid.length === 0) {
      return new Response("No valid columns selected.", { status: 400 })
    }
    columns = valid
  } else {
    columns = EXPORT_COLUMNS
  }

  // Scope: "all" ignores active filters but keeps the sort preference.
  const scope = params.get("scope") === "all" ? "all" : "filter"
  const filters = parseFilters(params)
  const effectiveFilters =
    scope === "all"
      ? { sort: filters.sort, direction: filters.direction }
      : filters

  const rows = sortPayments(
    filterPayments(effectiveFilters),
    effectiveFilters.sort,
    effectiveFilters.direction,
  )

  // Build a filename label from the validated status filter (filter scope only).
  // Use filters.status — already validated by parseFilters() — never the raw param.
  const label =
    scope === "filter" && filters.status && filters.status !== "all"
      ? filters.status
      : undefined

  return new Response(toCsv(rows, columns), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(label)}"`,
    },
  })
}
