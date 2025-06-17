'use strict';

import store from './store.mjs';

import appStrings from './app_strings.json';


export function exportUserHistoryToCSVDataURI() {
    const {userHistory} = store.state,
        rows = [
            'data:text/csv;charset=utf-8,'
                + appStrings.bucketLabels.map(
                    (element) =>
                        `"${element.replaceAll('\n', ' ')}"`
                ).join(','),
        ];

    for (const row of userHistory) {
        rows.push(row.map((el) => el.toString()).join(','));
    }

    return rows.join('\n');
}

export function exportUserHistoryToJSONDataURI() {
    const {userHistory} = store.state,
        labels = appStrings.bucketLabels.map(
            (label) => label.replaceAll('\n', ' ')
        ),
        zippedUserHistory = userHistory.map((row) =>
            Object.fromEntries(
                labels.map((label, i) =>
                    [label, row[i]]
                )
            )
        );

    return 'data:application/json;charset=utf-8,'
        + JSON.stringify(zippedUserHistory, null, '  ');
}

