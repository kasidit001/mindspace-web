export interface CodeLabCheck {
  label: string
  pass: boolean
  actual: unknown
  expected: unknown
}

export interface CodeLabResult {
  /** False only for a fatal problem (bad syntax, a thrown/uncaught error, a
   *  timeout) — distinct from `checks` containing failing assertions, which
   *  is a normal, successful run that just didn't pass yet. */
  ok: boolean
  checks: CodeLabCheck[]
  error: string | null
  timedOut: boolean
}

const RUN_TIMEOUT_MS = 3000

/**
 * Runs a learner's TypeScript against a lesson's test code, entirely in the
 * browser: transpiled with the `typescript` package (dynamically imported —
 * it's a few MB, no reason to ship it on pages without a lab), then executed
 * inside a sandboxed Web Worker built from a Blob URL. A Worker has no
 * `window`/`document`/cookies/localStorage — it can't touch the app's state
 * or the learner's session — and, unlike a same-page `eval`, an infinite
 * loop is recoverable: we just terminate the worker after RUN_TIMEOUT_MS
 * instead of hanging the tab.
 *
 * Test code calls the injected `check(actual, expected, label)` for each
 * assertion; results come back over `postMessage`, never by trusting
 * anything the learner's code returns directly.
 */
export async function runCodeLab(learnerCode: string, testCode: string): Promise<CodeLabResult> {
  const ts = await import('typescript')

  const source = `${learnerCode}\n\n${testCode}`
  let transpiled: string
  try {
    const output = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None }
    })
    transpiled = output.outputText
  } catch (err) {
    return { ok: false, checks: [], error: err instanceof Error ? err.message : String(err), timedOut: false }
  }

  const workerSource = `
    const __results = [];
    function check(actual, expected, label) {
      const pass = JSON.stringify(actual) === JSON.stringify(expected);
      __results.push({ label, pass, actual, expected });
    }
    try {
      ${transpiled}
      postMessage({ ok: true, checks: __results, error: null });
    } catch (err) {
      postMessage({ ok: false, checks: __results, error: err && err.message ? String(err.message) : String(err) });
    }
  `

  const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'application/javascript' }))

  return new Promise<CodeLabResult>((resolve) => {
    const worker = new Worker(blobUrl)
    let settled = false

    function finish(result: CodeLabResult) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      worker.terminate()
      URL.revokeObjectURL(blobUrl)
      resolve(result)
    }

    const timer = setTimeout(() => {
      finish({ ok: false, checks: [], error: null, timedOut: true })
    }, RUN_TIMEOUT_MS)

    worker.onmessage = (event: MessageEvent<{ ok: boolean; checks: CodeLabCheck[]; error: string | null }>) => {
      finish({ ...event.data, timedOut: false })
    }

    worker.onerror = (event: ErrorEvent) => {
      finish({ ok: false, checks: [], error: event.message || 'Unknown error', timedOut: false })
    }
  })
}
