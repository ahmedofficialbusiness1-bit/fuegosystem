import { PaymentStatus } from "../types";

export function calculateHali(kilicholipwa: number, bei_bidhaa: number): PaymentStatus {
  if (bei_bidhaa === 0) return PaymentStatus.FREE;
  if (!kilicholipwa || kilicholipwa === 0) return PaymentStatus.NONE;
  if (kilicholipwa < bei_bidhaa) return PaymentStatus.PARTIAL;
  if (kilicholipwa === bei_bidhaa) return PaymentStatus.FULL;
  if (kilicholipwa > bei_bidhaa) return PaymentStatus.OVERPAID;
  return PaymentStatus.NONE;
}

export function calculateDeni(kilicholipwa: number, bei_bidhaa: number): number {
  return Math.max(0, bei_bidhaa - (kilicholipwa || 0));
}

export function getStatusColor(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.FULL: return "#E8F5E9";
    case PaymentStatus.PARTIAL: return "#FFF9C4";
    case PaymentStatus.NONE: return "#FFEBEE";
    case PaymentStatus.OVERPAID: return "#E3F2FD";
    case PaymentStatus.FREE: return "#F5F5F5";
    default: return "#FFFFFF";
  }
}

export function getStatusTextColor(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.FULL: return "#1B5E20";
    case PaymentStatus.PARTIAL: return "#F57F17";
    case PaymentStatus.NONE: return "#B71C1C";
    case PaymentStatus.OVERPAID: return "#0D47A1";
    case PaymentStatus.FREE: return "#616161";
    default: return "#000000";
  }
}
