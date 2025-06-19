'use strict';

import store from './store.mjs';

import appStrings from './app_strings.json';


const LABELS = [
    'City or Region',
    'ZIP Code',
    ...appStrings.bucketLabels.map((el) => el.replaceAll('\n', ' '))
];

export function exportUserHistoryToCSVDataURI() {
    const {userHistory} = store.state,
        rows = [
            'data:text/csv;charset=utf-8,'
                + LABELS.map((element) => `"${element}"`).join(','),
        ];

    for (const row of userHistory) {
        rows.push(row.map((el) => el.toString()).join(','));
    }

    return rows.join('\n');
}

export function exportUserHistoryToJSONDataURI() {
    const {userHistory} = store.state,
        zippedUserHistory = userHistory.map((row) =>
            Object.fromEntries(
                LABELS.map((label, i) =>
                    [label, row[i]]
                )
            )
        );

    return 'data:application/json;charset=utf-8,'
        + JSON.stringify(zippedUserHistory, null, '  ');
}

