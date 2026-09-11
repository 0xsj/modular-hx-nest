/* The last resort: the root layout itself failed.
 *
 * This REPLACES the root layout, so it has to render `<html>` and `<body>`
 * itself — and it is the one file in the project that may not use the design
 * system, because the thing that failed might be the layout that loads the
 * stylesheets. A boundary that depends on what it is catching is not a
 * boundary.
 *
 * So: inline styles, no imports, no tokens, no components. It should look
 * plainer than everything else, and that is the point rather than an oversight.
 *
 * It only runs in production; in development the error overlay takes over. */
export default function GlobalError(props: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          "min-height": "100dvh",
          display: "grid",
          "place-items": "center",
          padding: "24px",
          background: "#0b0b0c",
          color: "#e6e6e7",
          "font-family":
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            "max-width": "44ch",
            display: "grid",
            gap: "16px",
          }}
          role="alert"
        >
          <h1
            style={{
              "font-size": "18px",
              "font-weight": 600,
              margin: 0,
            }}
          >
            This page could not start
          </h1>
          <p
            style={{
              "font-size": "14px",
              "line-height": "1.6",
              margin: 0,
              color: "#a1a1a4",
            }}
          >
            Something failed before the application could render. Reloading may
            work; if it does not, quote the reference below.
          </p>
          {/* The digest is the ONLY thing that survives redaction in a
              production build, which is exactly the situation this file is for. */}
          {props.error.digest ? (
            <p
              style={{
                "font-family": "ui-monospace, SFMono-Regular, monospace",
                "font-size": "12px",
                margin: 0,
                color: "#6f6f73",
              }}
            >
              {props.error.digest}
            </p>
          ) : null}
          <div>
            <button
              type="button"
              onClick={() => props.reset()}
              style={{
                font: "inherit",
                "font-size": "13px",
                padding: "8px 14px",
                "border-radius": "6px",
                border: "1px solid #2a2a2d",
                background: "#161618",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
