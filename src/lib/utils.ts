import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ExpirationStatus = 'expired' | 'expiringSoon' | 'safe';

export function getExpirationStatus(expirationDate: Date | string): ExpirationStatus {
  const date = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate;
  const today = new Date();
  const daysUntilExpiration = differenceInDays(date, today);

  if (daysUntilExpiration < 0) {
    return 'expired';
  }
  if (daysUntilExpiration <= 3) {
    return 'expiringSoon';
  }
  return 'safe';
}

export function formatDate(date: Date | string) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
}
