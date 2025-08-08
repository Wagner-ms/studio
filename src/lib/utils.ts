
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, format, parseISO, startOfDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ExpirationStatus = 'expired' | 'expiringIn3Days' | 'expiringIn7Days' | 'expiringSoon' | 'safe';

export function getExpirationStatus(expirationDate: Date | string): ExpirationStatus {
  const date = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate;
  const today = startOfDay(new Date());
  const daysUntilExpiration = differenceInDays(startOfDay(date), today);

  if (daysUntilExpiration < 0) {
    return 'expired';
  }
  if (daysUntilExpiration <= 3) {
    return 'expiringIn3Days';
  }
  if (daysUntilExpiration <= 7) {
    return 'expiringIn7Days';
  }
  if (daysUntilExpiration <= 15) {
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
        case 'expiringIn3Days':
            return 'Vence em até 3 dias';
        case 'expiringIn7Days':
            return 'Vence em até 7 dias';
        case 'expiringSoon':
            return 'Vence em até 15 dias';
        case 'safe':
            return 'OK';
        default:
            return '';
    }
}

export function getDaysUntilExpirationText(expirationDate: Date | string): string {
  const date = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate;
  const today = startOfDay(new Date());
  const daysDiff = differenceInDays(startOfDay(date), today);

  if (daysDiff < 0) {
    const daysAgo = Math.abs(daysDiff);
    return `Vencido há ${daysAgo} ${daysAgo === 1 ? 'dia' : 'dias'}`;
  }
  if (daysDiff === 0) {
    return 'Vence hoje';
  }
  if (daysDiff === 1) {
    return 'Vence amanhã';
  }
  return `Vence em ${daysDiff} dias`;
}
