
import React from 'react';
import { ClaimStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  status: ClaimStatus;
  isOverdue?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ status, isOverdue }) => {
  const { t } = useLanguage();

  const getStyles = () => {
    if (isOverdue && ![ClaimStatus.CLOSED, ClaimStatus.REPAIRED, ClaimStatus.REJECTED, ClaimStatus.SHIPPED].includes(status)) {
        return 'bg-red-500 text-white shadow-md shadow-red-500/20';
    }

    switch (status) {
      case ClaimStatus.PENDING:
        return 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/20';
      case ClaimStatus.DIAGNOSING:
        return 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500/20';
      case ClaimStatus.WAITING_PARTS:
        return 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-500/20';
      case ClaimStatus.REPAIRED:
      case ClaimStatus.CLOSED: 
      case ClaimStatus.SHIPPED:
        return 'bg-green-500 text-white shadow-md shadow-green-500/20';
      case ClaimStatus.REJECTED:
        return 'bg-gray-800 text-white';
      default: 
        return 'bg-gray-100 text-[#86868b] dark:bg-white/10 dark:text-gray-300';
    }
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStyles()}`}>
      {t(`status.${status}`)}
    </span>
  );
};
