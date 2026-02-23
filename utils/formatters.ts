// Shared utility: format an accessory key into a human-readable label.
// Used by SubmitClaim, CustomerSubmit, and printService.

import { translations } from '../i18n/translations';

/**
 * Converts an accessory key (e.g. 'acc_box', 'acc_hdd::SN123') into
 * a human-readable Thai/English label depending on current locale.
 */
export const formatAccessory = (acc: string, lang: 'th' | 'en' = 'th'): string => {
    if (acc.startsWith('acc_hdd::')) return `HDD (${acc.split('::')[1]})`;
    if (acc.startsWith('acc_')) {
        const key = acc as keyof typeof translations.th.accessories_list;
        const dict = lang === 'th' ? translations.th.accessories_list : translations.en.accessories_list;
        return (dict as any)[key as string] || acc;
    }
    return acc;
};
