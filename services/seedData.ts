import { RMA, RMAStatus, Team, ProductType } from '../types';

const now = new Date();
const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

export const SEED_CLAIMS: RMA[] = [];
