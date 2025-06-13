'use strict';

import appStrings from './app_strings.json';


export const CONSOLIDATED_BUDGET = 32e6;
export const NUM_BUCKETS = 5;
export const CITY_ALLOC = Array(NUM_BUCKETS).fill(0);
export const state = {
    budget: CONSOLIDATED_BUDGET,
    bucketAlloc: Array(NUM_BUCKETS).fill(0),
    version: '0',
};
const LOCAL_STORAGE_KEY = 'game-bucket-state';

export function hydrateGameState() {
    try {
        const source = JSON.parse(
            window.localStorage.getItem('game-bucket-state')
        );
        if (source && source.budget) {
            if (state.budget !== source.budget) {
                // Budget total changed, but not the "schema" version.
                window.alert(appStrings.budgetUpdated);
                const ratio = state.budget / source.budget;
                state.bucketAlloc = source.bucketAlloc.map(
                    (n) => Math.floor(n * ratio)
                );
            } else {
                state.bucketAlloc = source.bucketAlloc;
            }
        }
    } catch (e) {
        // ignore
    }
}

export function storeGameState() {
    window.localStorage.setItem(
        'game-bucket-state',
        JSON.stringify(state)
    );
}

export function selectRemainingCash() {
    return state.budget - state.bucketAlloc.reduce((a, b) => a + b, 0);
}

