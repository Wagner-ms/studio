import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, format, parseISO, startOfDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ExpirationStatus = 'expired' | 'expiringIn2Days' | 'expiringSoon' | 'safe';

export function getExpirationStatus(expirationDate: Date | string): ExpirationStatus {
  const date = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate;
  const today = startOfDay(new Date());
  const daysUntilExpiration = differenceInDays(startOfDay(date), today);

  if (daysUntilExpiration < 0) {
    return 'expired';
  }
  if (daysUntilExpiration <= 2) {
    return 'expiringIn2Days';
  }
  if (daysUntilExpiration <= 5) {
    return 'expiringSoon';
  }
  return 'safe';
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  // Use startOfDay to handle timezone correctly from Firestore Timestamps
  return format(startOfDay(dateObj), 'dd/MM/yyyy');
}


export function getExpirationStatusText(status: ExpirationStatus): string {
    switch (status) {
        case 'expired':
            return 'Vencido';
        case 'expiringIn2Days':
            return 'Vence em até 2 dias';
        case 'expiringSoon':
            return 'Venc. Próximo';
        case 'safe':
            return 'OK';
        default:
            return '';
    }
}
