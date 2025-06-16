'use strict';

import appStrings from './app_strings.json';


export const CONSOLIDATED_BUDGET = 32e6;
export const NUM_BUCKETS = 5;

class Store {
    constructor() {
        this.state = {
            budget: CONSOLIDATED_BUDGET,
            bucketAlloc: Array(NUM_BUCKETS).fill(0),
            version: '0',
        };
        this.initialized = false;
    }

    initialize(multiuserMode) {
        this.multiuserMode = !!multiuserMode;
        // Add a history table exclusive to multiuser mode.
        if (this.multiuserMode) {
            this.state.userHistory = [];
        }
        this.hydrateGameState();
        this.initialized = true;
    }

    get localStorageKey() {
        if (this.multiuserMode) {
            return 'game-bucket-multiuser-state';
        }
        return 'game-bucket-state';
    }

    hydrateGameState() {
        let source;
        try {
            source = JSON.parse(
                window.localStorage.getItem(this.localStorageKey)
            );
        } catch (e) {
            // ignore
        }
        if (source && source.budget) {
            if (this.state.budget !== source.budget) {
                // Budget total changed, but not the schema version.
                window.alert(appStrings.budgetUpdated);
                const ratio = this.state.budget / source.budget;
                this.state.bucketAlloc = source.bucketAlloc.map(
                    (n) => Math.floor(n * ratio)
                );
            } else {
                this.state.bucketAlloc = source.bucketAlloc;
            }
            if (this.multiuserMode) {
                this.state.userHistory = source.userHistory;
            }
        }
    }

    pushUserHistory() {
        if (this.multiuserMode) {
            this.state.userHistory.push(this.state.bucketAlloc);
            this.resetBuckets();
        } else {
            console.error(
                'Attempted to update user submissions in single-user mode.'
            );
        }
    }

    clearUserHistory() {
        this.state.userHistory = [];
    }

    resetBuckets() {
        this.state.bucketAlloc = Array(NUM_BUCKETS).fill(0);
    }

    storeGameState() {
        window.localStorage.setItem(
            this.localStorageKey,
            JSON.stringify(this.state)
        );
    }

    selectRemainingCash() {
        return this.state.budget
            - this.state.bucketAlloc.reduce((a, b) => a + b, 0);
    }
}

export const store = new Store();

export default store;

