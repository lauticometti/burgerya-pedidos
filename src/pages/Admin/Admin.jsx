import React from "react";
import Page from "../../components/layout/Page";
import PageTitle from "../../components/ui/PageTitle";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { TextInput } from "../../components/ui/FormFields";
import {
  loadCoupons,
  upsertCoupon,
  deleteCoupon,
  toggleCoupon,
} from "../../utils/coupons";
import styles from "./Admin.module.css";

const SESSION_KEY = "burgerya_dbadmin_login";
const ADMIN_PASS = import.meta.env.VITE_DBADMIN_PASSWORD || "changeme";

function useSessionAuth() {
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = window.sessionStorage.getItem(SESSION_KEY) === "1";
    if (ok) setIsAuthed(true);
  }, []);

  function login(pass) {
    const success = pass === ADMIN_PASS;
    if (success && typeof window !== "undefined") {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    }
    setIsAuthed(success);
    return success;
  }

  function logout() {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
    setIsAuthed(false);
  }

  return { isAuthed, login, logout };
}

export default function Admin() {
  const { isAuthed, login, logout } = useSessionAuth();
  const [password, setPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState("");
  const [coupons, setCoupons] = React.useState(loadCoupons());
  const [form, setForm] = React.useState({
    code: "",
    scope: "general",
    type: "percent",
    value: 10,
    minOrder: "",
    maxUses: 1,
  });

  React.useEffect(() => {
    setCoupons(loadCoupons());
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    if (login(password)) {
      setLoginError("");
      setPassword("");
    } else {
      setLoginError("Clave incorrecta");
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!form.code.trim()) return;
    const payload = {
      code: form.code.trim().toLowerCase(),
      scope: form.scope === "general" ? "general" : form.scope.split(",").map((s) => s.trim()).filter(Boolean),
      type: form.type,
      value: Number(form.value) || 0,
      minOrder: form.minOrder ? Number(form.minOrder) : undefined,
      maxUses: form.maxUses ? Number(form.maxUses) : 1,
      active: true,
      usedBy: [],
    };
    const next = upsertCoupon(payload);
    setCoupons(next);
  }

  function handleDelete(code) {
    const next = deleteCoupon(code);
    setCoupons(next);
  }

  function handleToggle(code, active) {
    const next = toggleCoupon(code, active);
    setCoupons(next);
  }

  if (!isAuthed) {
    return (
      <Page className={styles.page}>
        <PageTitle>dbadmin</PageTitle>
        <Card className={styles.card}>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <label className={styles.label}>Clave</label>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••"
            />
            {loginError ? <div className={styles.error}>{loginError}</div> : null}
            <Button variant="primary" type="submit">
              Entrar
            </Button>
          </form>
        </Card>
      </Page>
    );
  }

  return (
    <Page className={styles.page}>
      <div className={styles.header}>
        <PageTitle>dbadmin</PageTitle>
        <Button variant="ghost" size="sm" onClick={logout}>
          Salir
        </Button>
      </div>

      <Card className={styles.card}>
        <div className={styles.sectionTitle}>Crear / actualizar cupón</div>
        <form onSubmit={handleCreate} className={styles.formGrid}>
          <label className={styles.label}>Código</label>
          <TextInput
            value={form.code}
            onChange={(e) => handleChange("code", e.target.value)}
            placeholder="ej: bacon-5-usx"
          />

          <label className={styles.label}>Scope (ids separados por coma o general)</label>
          <TextInput
            value={form.scope}
            onChange={(e) => handleChange("scope", e.target.value)}
            placeholder="general o ids de burger: bacon,cheese"
          />

          <label className={styles.label}>Tipo</label>
          <select
            className={styles.select}
            value={form.type}
            onChange={(e) => handleChange("type", e.target.value)}>
            <option value="percent">% porcentaje</option>
            <option value="fixed">$ monto fijo</option>
          </select>

          <label className={styles.label}>Valor</label>
          <TextInput
            type="number"
            value={form.value}
            onChange={(e) => handleChange("value", e.target.value)}
            placeholder="10"
          />

          <label className={styles.label}>Mínimo de compra (opcional)</label>
          <TextInput
            type="number"
            value={form.minOrder}
            onChange={(e) => handleChange("minOrder", e.target.value)}
            placeholder="45000"
          />

          <label className={styles.label}>Usos por código</label>
          <TextInput
            type="number"
            value={form.maxUses}
            onChange={(e) => handleChange("maxUses", e.target.value)}
            placeholder="1"
          />

          <Button type="submit" variant="primary">
            Guardar
          </Button>
        </form>
      </Card>

      <Card className={styles.card}>
        <div className={styles.sectionTitle}>Códigos</div>
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <div>Código</div>
            <div>Scope</div>
            <div>Tipo</div>
            <div>Valor</div>
            <div>Min</div>
            <div>Usados</div>
            <div>Estado</div>
            <div></div>
          </div>
          {coupons.map((c) => (
            <div key={c.code} className={styles.row}>
              <div className={styles.code}>{c.code}</div>
              <div>{Array.isArray(c.scope) ? c.scope.join(",") : c.scope}</div>
              <div>{c.type}</div>
              <div>{c.value}</div>
              <div>{c.minOrder || "-"}</div>
              <div>
                {(c.usedBy || []).length}/{c.maxUses || 1}
              </div>
              <div className={styles.state}>
                {c.active ? "Activo" : "Pausado"}
              </div>
              <div className={styles.actions}>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => handleToggle(c.code, !c.active)}>
                  {c.active ? "Pausar" : "Activar"}
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleDelete(c.code)}>
                  Borrar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}
