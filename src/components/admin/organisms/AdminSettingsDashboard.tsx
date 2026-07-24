"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import type { AdminSettings } from "@/src/lib/admin-settings/types";
import { DEFAULT_ADMIN_SETTINGS } from "@/src/lib/admin-settings/types";
import {
  getAdminSettings,
  saveAdminSettings,
} from "@/src/lib/appwrite/admin-settings";
import { useAdminFeedback } from "../molecules/AdminFeedbackProvider";
import { useAdminHeaderActions } from "../templates/AdminShell";

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        checked ? "bg-(--color-accent)" : "bg-[#253753]"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingsCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-(--color-border) px-5 py-3">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="hidden text-xs text-(--color-muted) sm:block">
          {eyebrow}
        </p>
      </header>
      <div>{children}</div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[60px] grid-cols-1 items-center gap-3 border-b border-(--color-border) px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(150px,200px)]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-4 text-(--color-muted)">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex min-w-0 justify-start sm:justify-end">{control}</div>
    </div>
  );
}

function TextInput({
  value,
  label,
  onChange,
  type = "text",
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
  type?: "email" | "number" | "text";
}) {
  return (
    <input
      aria-label={label}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full min-w-0 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-(--color-muted-2) focus:border-(--color-accent)"
    />
  );
}

function SelectInput({
  value,
  label,
  options,
  onChange,
}: {
  value: string;
  label: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full min-w-0 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-(--color-accent)"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function isSameSettings(left: AdminSettings, right: AdminSettings) {
  return Object.keys(DEFAULT_ADMIN_SETTINGS).every((key) => {
    const typedKey = key as keyof AdminSettings;
    return left[typedKey] === right[typedKey];
  });
}

export function AdminSettingsDashboard() {
  const [settings, setSettings] = useState<AdminSettings>(
    DEFAULT_ADMIN_SETTINGS,
  );
  const [savedSettings, setSavedSettings] = useState<AdminSettings>(
    DEFAULT_ADMIN_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useAdminFeedback();
  const hasChanges = !isSameSettings(settings, savedSettings);

  useEffect(() => {
    let active = true;
    void getAdminSettings().then((result) => {
      if (!active) return;
      if (result.success) {
        setSettings(result.data.settings);
        setSavedSettings(result.data.settings);
      } else {
        showToast(result.message, "error");
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [showToast]);

  const updateSetting = <Key extends keyof AdminSettings>(
    key: Key,
    value: AdminSettings[Key],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveChanges = useCallback(() => {
    setSaving(true);
    void saveAdminSettings(settings).then((result) => {
      if (result.success) {
        setSettings(result.data.settings);
        setSavedSettings(result.data.settings);
        showToast("Cambios guardados.", "success");
      } else {
        showToast(result.message, "error");
      }
      setSaving(false);
    });
  }, [settings, showToast]);

  const headerActions = useMemo(
    () => (
      <button
        type="button"
        title="Guardar cambios"
        onClick={saveChanges}
        disabled={!hasChanges || loading || saving}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-(--color-accent) px-4 text-sm font-bold text-(--color-accent-contrast) transition-colors hover:bg-(--color-accent-strong) disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Save size={16} />
        <span className="hidden sm:inline">
          {saving ? "Guardando..." : "Guardar cambios"}
        </span>
      </button>
    ),
    [hasChanges, loading, saveChanges, saving],
  );
  useAdminHeaderActions(headerActions);

  if (loading) {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-lg border border-(--color-border) bg-(--color-surface)"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <SettingsCard
        title="IA & OpenAI"
        eyebrow="Seguimiento de consumo y costos"
      >
        <SettingRow
          title="Alerta de costo inusual por usuario"
          description="Notificar cuando un usuario supere 10x el costo promedio"
          control={
            <Switch
              label="Alerta de costo inusual por usuario"
              checked={settings.unusualCostAlert}
              onChange={(value) => updateSetting("unusualCostAlert", value)}
            />
          }
        />
        <SettingRow
          title="Modelo por defecto"
          description="Modelo de OpenAI para analisis nutricional"
          control={
            <SelectInput
              label="Modelo por defecto"
              value={settings.defaultModel}
              options={["gpt-4o", "gpt-4o-mini", "gpt-4.1-mini"]}
              onChange={(value) => updateSetting("defaultModel", value)}
            />
          }
        />
        <SettingRow
          title="Logs de costos en tiempo real"
          description="Registrar costo exacto por llamada en los logs"
          control={
            <Switch
              label="Logs de costos en tiempo real"
              checked={settings.realtimeCostLogs}
              onChange={(value) => updateSetting("realtimeCostLogs", value)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Notificaciones"
        eyebrow="Alertas al equipo de administracion"
      >
        <SettingRow
          title="Email de alertas"
          description="Recibe notificaciones criticas del sistema"
          control={
            <TextInput
              label="Email de alertas"
              type="email"
              value={settings.alertEmail}
              onChange={(value) => updateSetting("alertEmail", value)}
            />
          }
        />
        <SettingRow
          title="Alertas de errores criticos"
          description="Notificar cuando haya errores 500 en funciones IA"
          control={
            <Switch
              label="Alertas de errores criticos"
              checked={settings.criticalErrorAlerts}
              onChange={(value) => updateSetting("criticalErrorAlerts", value)}
            />
          }
        />
        <SettingRow
          title="Resumen diario por email"
          description="Metricas de uso, costos y tickets al final del dia"
          control={
            <Switch
              label="Resumen diario por email"
              checked={settings.dailyEmailSummary}
              onChange={(value) => updateSetting("dailyEmailSummary", value)}
            />
          }
        />
        <SettingRow
          title="Alerta de nuevos tickets urgentes"
          description="Email inmediato al crear un ticket de urgencia alta"
          control={
            <Switch
              label="Alerta de nuevos tickets urgentes"
              checked={settings.urgentTicketAlerts}
              onChange={(value) => updateSetting("urgentTicketAlerts", value)}
            />
          }
        />
        <SettingRow
          title="Frecuencia de resumen"
          control={
            <SelectInput
              label="Frecuencia de resumen"
              value={settings.summaryFrequency}
              options={["Diario", "Semanal", "Mensual"]}
              onChange={(value) => updateSetting("summaryFrequency", value)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Soporte & Tickets"
        eyebrow="Configuración del sistema de soporte"
      >
        <SettingRow
          title="Email de soporte saliente"
          description="Direccion desde la que se envian las respuestas"
          control={
            <TextInput
              label="Email de soporte saliente"
              type="email"
              value={settings.supportEmail}
              onChange={(value) => updateSetting("supportEmail", value)}
            />
          }
        />
        <SettingRow
          title="Firma de correo"
          description="Texto al pie de cada respuesta enviada"
          control={
            <Switch
              label="Firma de correo"
              checked={settings.emailSignature}
              onChange={(value) => updateSetting("emailSignature", value)}
            />
          }
        />
        <SettingRow
          title="Respuesta automatica al abrir ticket"
          description="Confirmar recepcion al usuario automaticamente"
          control={
            <Switch
              label="Respuesta automatica al abrir ticket"
              checked={settings.autoTicketReply}
              onChange={(value) => updateSetting("autoTicketReply", value)}
            />
          }
        />
        <SettingRow
          title="SLA de respuesta (horas)"
          description="Meta de tiempo de primera respuesta"
          control={
            <TextInput
              label="SLA de respuesta"
              type="number"
              value={settings.responseSlaHours}
              onChange={(value) => updateSetting("responseSlaHours", value)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Planes y suscripciones"
        eyebrow="Precios y limites por plan"
      >
        <SettingRow
          title="Plan Free — Registros/mes"
          control={
            <TextInput
              label="Plan Free registros por mes"
              value={settings.freeMonthlyRecords}
              onChange={(value) => updateSetting("freeMonthlyRecords", value)}
            />
          }
        />
        <SettingRow
          title="Plan Premium — Registros/mes"
          control={
            <TextInput
              label="Plan Premium registros por mes"
              value={settings.premiumMonthlyRecords}
              onChange={(value) =>
                updateSetting("premiumMonthlyRecords", value)
              }
            />
          }
        />
        <SettingRow
          title="Plan Premium — Registros/mes"
          control={
            <TextInput
              label="Plan Premium registros anuales"
              value={settings.premiumYearlyRecords}
              onChange={(value) => updateSetting("premiumYearlyRecords", value)}
            />
          }
        />
        <SettingRow
          title="Modo mantenimiento"
          description="Bloquear acceso a la app para todos los usuarios"
          control={
            <Switch
              label="Modo mantenimiento"
              checked={settings.maintenanceMode}
              onChange={(value) => updateSetting("maintenanceMode", value)}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
