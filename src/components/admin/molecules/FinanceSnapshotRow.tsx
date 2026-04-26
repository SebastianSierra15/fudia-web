import { FinanceSnapshot } from "@/src/lib/appwrite/finance";

type FinanceSnapshotRowProps = {
  snapshot: FinanceSnapshot;
  formatMoney: (amount: number) => string;
};

export function FinanceSnapshotRow({
  snapshot,
  formatMoney,
}: FinanceSnapshotRowProps) {
  return (
    <tr className="border-t border-(--color-border)">
      <td className="px-3 py-3 text-sm font-medium">{snapshot.period}</td>
      <td className="px-3 py-3 text-sm">{formatMoney(snapshot.totalCostUsd)}</td>
      <td className="px-3 py-3 text-sm">{formatMoney(snapshot.basePlanUsd)}</td>
      <td className="px-3 py-3 text-sm">
        {formatMoney(snapshot.variableCostUsd)}
      </td>
      <td className="px-3 py-3 text-sm">{formatMoney(snapshot.creditsUsd)}</td>
    </tr>
  );
}
