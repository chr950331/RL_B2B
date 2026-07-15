"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { api, setAuthToken } from "@/lib/api";
import type { Buyer } from "@/lib/types";

type AuthResponse = {
  token: string;
  user: Buyer;
};

const copy = {
  title: "\u0042\u0032\u0042 \u5e93\u5b58\u5206\u914d\u767b\u5f55",
  loginHint: "\u4f7f\u7528\u7528\u6237\u540d\u548c\u5bc6\u7801\u767b\u5f55\u3002",
  registerHint: "\u521b\u5efa\u7528\u6237\u540d\u548c\u5bc6\u7801\u3002",
  login: "\u767b\u5f55",
  register: "\u6ce8\u518c",
  username: "\u7528\u6237\u540d",
  password: "\u5bc6\u7801",
  passwordPlaceholder: "\u81f3\u5c11 6 \u4f4d\u5b57\u7b26",
  registerNote: "\u7b2c\u4e00\u4e2a\u6ce8\u518c\u8d26\u53f7\u4f1a\u81ea\u52a8\u6210\u4e3a\u7ba1\u7406\u5458\uff0c\u4e4b\u540e\u6ce8\u518c\u7684\u8d26\u53f7\u9ed8\u8ba4\u4e3a\u4e70\u5bb6\u3002",
  loading: "\u5904\u7406\u4e2d...",
  createAccount: "\u521b\u5efa\u8d26\u53f7",
  error: "\u8ba4\u8bc1\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5"
};

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "#f7f8f6",
    color: "#171717",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  card: {
    width: "100%",
    maxWidth: 448,
    border: "1px solid #d8ddd7",
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 16px 40px rgba(23, 23, 23, 0.08)",
    padding: 24
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 22
  },
  iconBox: {
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    background: "#171717",
    color: "#fff",
    flexShrink: 0
  },
  title: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.2,
    fontWeight: 750
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "#646c64"
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
    padding: 4,
    border: "1px solid #d8ddd7",
    borderRadius: 8,
    background: "#f7f8f6",
    marginBottom: 16
  },
  tab: {
    minHeight: 40,
    border: 0,
    borderRadius: 6,
    background: "transparent",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer"
  },
  activeTab: {
    background: "#fff",
    boxShadow: "0 1px 4px rgba(23, 23, 23, 0.12)"
  },
  fieldGroup: {
    display: "grid",
    gap: 12
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 14,
    fontWeight: 650
  },
  input: {
    width: "100%",
    minHeight: 42,
    border: "1px solid #d8ddd7",
    borderRadius: 8,
    padding: "0 12px",
    fontSize: 15,
    outline: "none",
    background: "#fff"
  },
  note: {
    margin: 0,
    borderRadius: 8,
    background: "#f7f8f6",
    padding: 12,
    color: "#565f56",
    fontSize: 14,
    lineHeight: 1.5
  },
  error: {
    margin: 0,
    borderRadius: 8,
    background: "#fef2f2",
    padding: 12,
    color: "#991b1b",
    fontSize: 14,
    lineHeight: 1.5
  },
  submit: {
    width: "100%",
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: 0,
    borderRadius: 8,
    background: "#171717",
    color: "#fff",
    fontSize: 15,
    fontWeight: 750,
    cursor: "pointer"
  }
};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api<AuthResponse>(mode === "login" ? "/auth/login" : "/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      setAuthToken(result.token);
      window.location.href = result.user.role === "admin" ? "/admin" : "/buyer";
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <form onSubmit={submit} style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconBox}>
            {mode === "login" ? <LogIn size={22} /> : <UserPlus size={22} />}
          </div>
          <div>
            <h1 style={styles.title}>{copy.title}</h1>
            <p style={styles.subtitle}>{mode === "login" ? copy.loginHint : copy.registerHint}</p>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{ ...styles.tab, ...(mode === "login" ? styles.activeTab : {}) }}
          >
            {copy.login}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            style={{ ...styles.tab, ...(mode === "register" ? styles.activeTab : {}) }}
          >
            {copy.register}
          </button>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            {copy.username}
            <input
              style={styles.input}
              autoComplete="username"
              required
              minLength={3}
              maxLength={40}
              pattern="[A-Za-z0-9_.-]+"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="buyer01"
            />
          </label>
          <label style={styles.label}>
            {copy.password}
            <input
              style={styles.input}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.passwordPlaceholder}
            />
          </label>
          {mode === "register" && <p style={styles.note}>{copy.registerNote}</p>}
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.submit} disabled={loading}>
            {mode === "login" ? <LogIn size={17} /> : <UserPlus size={17} />}
            {loading ? copy.loading : mode === "login" ? copy.login : copy.createAccount}
          </button>
        </div>
      </form>
    </main>
  );
}
