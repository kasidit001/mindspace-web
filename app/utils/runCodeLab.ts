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

export interface CodePreviewResult {
  ok: boolean
  logs: string[]
  error: string | null
  timedOut: boolean
}

const RUN_TIMEOUT_MS = 3000

/**
 * Runs a learner's TypeScript entirely in the browser: transpiled with the
 * `typescript` package (dynamically imported — it's a few MB, no reason to
 * ship it on pages without a lab), then executed inside a sandboxed Web
 * Worker built from a Blob URL. A Worker has no `window`/`document`/
 * cookies/localStorage — it can't touch the app's state or the learner's
 * session — and, unlike a same-page `eval`, an infinite loop is
 * recoverable: we just terminate the worker after RUN_TIMEOUT_MS instead
 * of hanging the tab. Shared by both runCodePreview (just execute, show
 * console output) and runCodeLab (execute + grade against test code).
 */
async function executeInWorker(workerSource: string): Promise<{ message: unknown; timedOut: boolean; workerError: string | null }> {
  const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'application/javascript' }))

  return new Promise((resolve) => {
    const worker = new Worker(blobUrl)
    let settled = false

    function finish(result: { message: unknown; timedOut: boolean; workerError: string | null }) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      worker.terminate()
      URL.revokeObjectURL(blobUrl)
      resolve(result)
    }

    const timer = setTimeout(() => {
      finish({ message: null, timedOut: true, workerError: null })
    }, RUN_TIMEOUT_MS)

    worker.onmessage = (event: MessageEvent) => {
      finish({ message: event.data, timedOut: false, workerError: null })
    }

    worker.onerror = (event: ErrorEvent) => {
      finish({ message: null, timedOut: false, workerError: event.message || 'Unknown error' })
    }
  })
}

async function transpile(source: string): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const ts = await import('typescript')
  try {
    const output = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None }
    })
    return { ok: true, code: output.outputText }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * "Run Code" — just executes the learner's code and captures whatever it
 * logs, with no grading. Lets someone check their code actually runs (and
 * see what it prints) before "Submit Answer" runs it against the tests.
 */
export async function runCodePreview(learnerCode: string): Promise<CodePreviewResult> {
  const transpiled = await transpile(learnerCode)
  if (!transpiled.ok) return { ok: false, logs: [], error: transpiled.error, timedOut: false }

  const workerSource = `
    const __logs = [];
    function __stringify(v) {
      try { return typeof v === "string" ? v : JSON.stringify(v); } catch { return String(v); }
    }
    console.log = (...args) => { __logs.push(args.map(__stringify).join(" ")); };
    try {
      ${transpiled.code}
      postMessage({ ok: true, logs: __logs, error: null });
    } catch (err) {
      postMessage({ ok: false, logs: __logs, error: err && err.message ? String(err.message) : String(err) });
    }
  `

  const { message, timedOut, workerError } = await executeInWorker(workerSource)
  if (timedOut) return { ok: false, logs: [], error: null, timedOut: true }
  if (workerError) return { ok: false, logs: [], error: workerError, timedOut: false }
  return { ...(message as Omit<CodePreviewResult, 'timedOut'>), timedOut: false }
}

/**
 * "Submit Answer" — runs the learner's code followed by the lesson's test
 * code, which calls the injected `check(actual, expected, label)` for each
 * assertion; results come back over `postMessage`, never by trusting
 * anything the learner's code returns directly.
 */
export async function runCodeLab(learnerCode: string, testCode: string): Promise<CodeLabResult> {
  const transpiled = await transpile(`${learnerCode}\n\n${testCode}`)
  if (!transpiled.ok) return { ok: false, checks: [], error: transpiled.error, timedOut: false }

  const workerSource = `
    const __results = [];
    function check(actual, expected, label) {
      const pass = JSON.stringify(actual) === JSON.stringify(expected);
      __results.push({ label, pass, actual, expected });
    }
    try {
      ${transpiled.code}
      postMessage({ ok: true, checks: __results, error: null });
    } catch (err) {
      postMessage({ ok: false, checks: __results, error: err && err.message ? String(err.message) : String(err) });
    }
  `

  const { message, timedOut, workerError } = await executeInWorker(workerSource)
  if (timedOut) return { ok: false, checks: [], error: null, timedOut: true }
  if (workerError) return { ok: false, checks: [], error: workerError, timedOut: false }
  return { ...(message as Omit<CodeLabResult, 'timedOut'>), timedOut: false }
}
