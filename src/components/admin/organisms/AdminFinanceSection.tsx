"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/shared/atoms/Button";
import { getCurrentUser } from "@/src/lib/appwrite/auth";
import {
  createFinanceSnapshot,
  getPremiumUsersCount,
  listFinanceSnapshots,
  PRO_PRICE_USD,
  type FinanceSnapshot,
} from "@/src/lib/appwrite/finance";
import { AdminKpiCard } from "../atoms/AdminKpiCard";
import { CurrencyToggleButton } from "../atoms/CurrencyToggleButton";
import { FinanceSnapshotRow } from "../molecules/FinanceSnapshotRow";

type CurrencyMode = "COP" | "USD";

type FinanceFormState = {
  period: string;
  basePlanUsd: string;
  variableCostUsd: string;
  creditsUsd: string;
  fxRateCopUsd: string;
  notes: string;
};

const GENERIC_LOAD_ERROR = "No se pudo cargar la informacion financiera.";
const GENERIC_SAVE_ERROR = "No se pudo guardar el snapshot financiero.";

function getCurrentPeriod() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function createInitialFormState(): FinanceFormState {
  return {
    period: getCurrentPeriod(),
    basePlanUsd: "25",
    variableCostUsd: "0",
    creditsUsd: "0",
    fxRateCopUsd: "4000",
    notes: "",
  };
}

function parseNumericInput(value: string) {
  const parsedValue = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function sortSnapshotsDescending(snapshots: FinanceSnapshot[]) {
  return [...snapshots].sort((a, b) => b.period.localeCompare(a.period));
}

export function AdminFinanceSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<CurrencyMode>("COP");
  const [snapshots, setSnapshots] = useState<FinanceSnapshot[]>([]);
  const [premiumUsers, setPremiumUsers] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isConfigMissing, setIsConfigMissing] = useState(false);
  const [formState, setFormState] = useState<FinanceFormState>(
    createInitialFormState(),
  );

  useEffect(() => {
    let isActive = true;

    const loadFinanceData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      const [snapshotResult, premiumUsersCount] = await Promise.all([
        listFinanceSnapshots(),
        getPremiumUsersCount(),
      ]);

      if (!isActive) {
        return;
      }

      if (!snapshotResult.success) {
        if (snapshotResult.code === "MISSING_CONFIG") {
          setIsConfigMissing(true);
        } else {
          setErrorMessage(GENERIC_LOAD_ERROR);
        }
      } else {
        setIsConfigMissing(false);
        setSnapshots(sortSnapshotsDescending(snapshotResult.snapshots));
      }

      if (typeof premiumUsersCount === "number") {
        setPremiumUsers(premiumUsersCount);
      } else {
        setErrorMessage((previous) =>
          previous || "No se pudo obtener el total de usuarios Premium.",
        );
      }

      setIsLoading(false);
    };

    void loadFinanceData();

    return () => {
      isActive = false;
    };
  }, []);

  const latestSnapshot = snapshots[0] ?? null;
  const fxRateCopUsd = useMemo(() => {
    if (latestSnapshot?.fxRateCopUsd && latestSnapshot.fxRateCopUsd > 0) {
      return latestSnapshot.fxRateCopUsd;
    }

    const formFxRate = parseNumericInput(formState.fxRateCopUsd);
    return formFxRate && formFxRate > 0 ? formFxRate : 4000;
  }, [formState.fxRateCopUsd, latestSnapshot]);

  const monthlyRevenueUsd = premiumUsers * PRO_PRICE_USD;
  const totalCostUsd = latestSnapshot?.totalCostUsd ?? 0;
  const marginUsd = monthlyRevenueUsd - totalCostUsd;
  const costPerProUserUsd = premiumUsers > 0 ? totalCostUsd / premiumUsers : 0;

  const usdFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    [],
  );

  const copFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const formatMoney = (amountUsd: number) => {
    if (mode === "USD") {
      return usdFormatter.format(amountUsd);
    }

    return copFormatter.format(amountUsd * fxRateCopUsd);
  };

  const handleInputChange = (field: keyof FinanceFormState, value: string) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || isConfigMissing) {
      return;
    }

    const basePlanUsd = parseNumericInput(formState.basePlanUsd);
    const variableCostUsd = parseNumericInput(formState.variableCostUsd);
    const creditsUsd = parseNumericInput(formState.creditsUsd);
    const fxRate = parseNumericInput(formState.fxRateCopUsd);

    if (
      !formState.period ||
      basePlanUsd === null ||
      variableCostUsd === null ||
      creditsUsd === null ||
      fxRate === null ||
      fxRate <= 0
    ) {
      setErrorMessage("Completa correctamente los campos del snapshot.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const currentUser = await getCurrentUser();
    const saveResult = await createFinanceSnapshot({
      period: formState.period,
      basePlanUsd,
      variableCostUsd,
      creditsUsd,
      fxRateCopUsd: fxRate,
      notes: formState.notes,
      createdBy: currentUser?.$id ?? "",
    });

    if (!saveResult.success) {
      if (saveResult.code === "MISSING_CONFIG") {
        setIsConfigMissing(true);
      }
      setErrorMessage(GENERIC_SAVE_ERROR);
      setIsSubmitting(false);
      return;
    }

    setSnapshots((previous) =>
      sortSnapshotsDescending([saveResult.snapshot, ...previous]),
    );
    setSuccessMessage("Snapshot financiero guardado correctamente.");
    setIsSubmitting(false);
  };

  return (
    <section className="mt-8 rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-[0_20px_48px_rgba(0,0,0,0.15)] md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
            Finanzas
          </p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
            Costo vs ingreso por usuarios Pro
          </h2>
          <p className="mt-2 text-sm text-(--color-muted)">
            Vista inicial para cargar snapshots de costos Appwrite y estimar
            margen mensual.
          </p>
        </div>
        <CurrencyToggleButton
          mode={mode}
          onToggle={() => setMode((previous) => (previous === "COP" ? "USD" : "COP"))}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard
          title="Usuarios Pro activos"
          value={String(premiumUsers)}
          hint={`Team Premium: ${premiumUsers} usuarios`}
        />
        <AdminKpiCard
          title="Ingreso mensual estimado"
          value={formatMoney(monthlyRevenueUsd)}
          hint={`Precio Pro: ${usdFormatter.format(PRO_PRICE_USD)} por usuario`}
          tone="success"
        />
        <AdminKpiCard
          title="Costo mensual Appwrite"
          value={formatMoney(totalCostUsd)}
          hint="Tomado del ultimo snapshot cargado"
          tone="warning"
        />
        <AdminKpiCard
          title="Margen mensual estimado"
          value={formatMoney(marginUsd)}
          hint={`Costo por usuario Pro: ${formatMoney(costPerProUserUsd)}`}
          tone={marginUsd >= 0 ? "success" : "warning"}
        />
      </div>

      {isConfigMissing ? (
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Falta configurar el modulo financiero en variables de entorno:
          `NEXT_PUBLIC_APPWRITE_DATABASE_ID` y
          `NEXT_PUBLIC_APPWRITE_FINANCE_COLLECTION_ID`.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form
          className="rounded-2xl border border-(--color-border) bg-(--color-surface-2) p-5"
          onSubmit={handleSubmit}
        >
          <p className="text-sm font-semibold">Nuevo snapshot mensual</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-(--color-muted)">
              Periodo
              <input
                type="month"
                value={formState.period}
                onChange={(event) =>
                  handleInputChange("period", event.target.value)
                }
                className="h-10 rounded-lg border border-(--color-border) bg-background px-3 text-sm text-foreground"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-(--color-muted)">
              Plan base (USD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={formState.basePlanUsd}
                onChange={(event) =>
                  handleInputChange("basePlanUsd", event.target.value)
                }
                className="h-10 rounded-lg border border-(--color-border) bg-background px-3 text-sm text-foreground"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-(--color-muted)">
              Costo variable (USD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={formState.variableCostUsd}
                onChange={(event) =>
                  handleInputChange("variableCostUsd", event.target.value)
                }
                className="h-10 rounded-lg border border-(--color-border) bg-background px-3 text-sm text-foreground"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-(--color-muted)">
              Creditos aplicados (USD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={formState.creditsUsd}
                onChange={(event) =>
                  handleInputChange("creditsUsd", event.target.value)
                }
                className="h-10 rounded-lg border border-(--color-border) bg-background px-3 text-sm text-foreground"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-(--color-muted) sm:col-span-2">
              Tasa COP por 1 USD
              <input
                type="number"
                min="1"
                step="0.01"
                value={formState.fxRateCopUsd}
                onChange={(event) =>
                  handleInputChange("fxRateCopUsd", event.target.value)
                }
                className="h-10 rounded-lg border border-(--color-border) bg-background px-3 text-sm text-foreground"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-(--color-muted) sm:col-span-2">
              Nota (opcional)
              <textarea
                value={formState.notes}
                onChange={(event) => handleInputChange("notes", event.target.value)}
                className="min-h-[88px] rounded-lg border border-(--color-border) bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          </div>
          <div className="mt-4">
            <Button
              type="submit"
              label="Guardar snapshot"
              isLoading={isSubmitting}
              showLoadingLabel={false}
              className="w-full"
            />
          </div>
        </form>

        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface-2) p-5">
          <p className="text-sm font-semibold">Historial de snapshots</p>
          <p className="mt-1 text-xs text-(--color-muted)">
            Ultimos costos registrados para analisis mensual.
          </p>

          {isLoading ? (
            <div className="mt-4 h-32 animate-pulse rounded-xl border border-(--color-border) bg-background/60" />
          ) : snapshots.length === 0 ? (
            <p className="mt-4 text-sm text-(--color-muted)">
              Aun no hay snapshots financieros registrados.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-(--color-border)">
              <table className="w-full min-w-[560px] text-left">
                <thead className="bg-background/70">
                  <tr>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                      Periodo
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                      Total
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                      Base
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                      Variable
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                      Creditos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snapshot) => (
                    <FinanceSnapshotRow
                      key={snapshot.id}
                      snapshot={snapshot}
                      formatMoney={formatMoney}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
