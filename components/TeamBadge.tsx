
import React from 'react';
import { Team } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  team: Team;
}

export const TeamBadge: React.FC<Props> = ({ team }) => {
  const { t } = useLanguage();
  
  const getColors = (t: Team) => {
    switch (t) {
      case Team.HIKVISION: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case Team.DAHUA: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case Team.TEAM_C: return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      case Team.TEAM_E: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case Team.TEAM_G: return 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getLabel = (tVal: Team) => {
      if (tVal === Team.HIKVISION) return t('teams.hikvision');
      if (tVal === Team.DAHUA) return t('teams.dahua');
      if (tVal === Team.TEAM_C) return t('teams.teamC');
      if (tVal === Team.TEAM_E) return t('teams.teamE');
      if (tVal === Team.TEAM_G) return t('teams.teamG');
      return tVal;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getColors(team)}`}>
      {getLabel(team)}
    </span>
  );
};
