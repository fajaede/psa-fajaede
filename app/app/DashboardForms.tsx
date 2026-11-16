"use client";

import { useActionState } from "react";
import { addProject, rescanProject, type ActionState } from "./actions";

const idle: ActionState = { status: "idle" };

export function AddProjectForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(addProject, idle);
  return (
    <form action={formAction} style={styles.row}>
      <input
        name="url"
        type="text"
        inputMode="url"
        placeholder="https://jouwsite.nl"
        required
        maxLength={500}
        disabled={disabled || pending}
        style={styles.input}
        aria-label="Website-URL"
      />
      <button type="submit" disabled={disabled || pending} style={styles.button}>
        {pending ? "Toevoegen..." : "Site toevoegen"}
      </button>
      {state.status === "error" && <p role="alert" style={styles.error}>{state.message}</p>}
    </form>
  );
}

export function RescanButton({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(rescanProject, idle);
  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" disabled={pending} style={styles.button}>
        {pending ? "Scannen... (tot ~20 seconden)" : "Nu opnieuw scannen"}
      </button>
      {state.status === "ok" && <p role="status" style={styles.ok}>{state.message}</p>}
      {state.status === "error" && (
        <div role="alert" style={styles.error}>
          {state.message}
          {state.errors && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {state.errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" },
  input: { flex: "1 1 240px", boxSizing: "border-box", minHeight: 44, padding: "10px 12px", border: "1px solid #555", borderRadius: 6, background: "#111", color: "#fff", fontSize: 16 },
  button: { minHeight: 44, padding: "10px 20px", border: 0, borderRadius: 6, background: "#00ff99", color: "#000", fontWeight: 700, cursor: "pointer" },
  error: { flexBasis: "100%", margin: 0, color: "#ff9b9b", fontSize: 14 },
  ok: { margin: 0, color: "#77e6aa", fontSize: 14 },
};
