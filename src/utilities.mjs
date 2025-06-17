'use strict';

export function hideModal(idPfx) {
    const modal = document.getElementById(`${idPfx}-modal`);
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

export function showModal(idPfx) {
    const modal = document.getElementById(`${idPfx}-modal`);
    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');
}

export function debounce(func, ctx, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(
            () => {
                func.apply(ctx, args);
            },
            timeout
        );
    };
}

export function getTimeFilenameString() {
    return (new Date())
        .toISOString()
        .replaceAll(' ', '_')
        .replaceAll(':', '_');
}

/**
 * Given an elliptical arc and endpoint angles, distribute n points on it so
 * that the *direct* euclidean distance (not arc length) from any one point to
 * the consecutive point along the path is within epsilon units of all other
 * such distances. This function assumes R2-space.
 *
 * @param {number} n               - The number of points, must be at least 2.
 * @param {number} hAxis           - The horizontal axis length.
 * @param {number} vAxis           - The vertical axis length.
 * @param {number} originX         - The horizontal coordinate of the origin.
 * @param {number} originY         - The vertical coordinate of the origin.
 * @param {number} startAngle      - The angle wrt the positive horizontal axis
 *                                   of the first point.
 * @param {number} endAngle        - The angle wrt the positive horizontal axis
 *                                   of the final point.
 * @param {number} [epsilon=0.5]   - Equality threshold.
 *
 * @return {Array<Array<number>>} - An array of n coordinate arrays specifying
 *                                  the calculated coordinates of each point,
 *                                  specified as `[horizontal, vertical]`.
 */
export function distPointsOnEllipticalArc(
    n,
    hAxis,
    vAxis,
    originX,
    originY,
    startAngle,
    endAngle,
    epsilon = 0.5
) {
    if (n < 2) {
        throw 'Cannot arrange less than two points.';
    }

    const points = Array(n),
        cumLengths = Array(n);
    let angles = Array(n),
        swapAngles = Array(n),
        minDist, maxDist, i;

    // Fixed values.
    cumLengths[0] = 0;
    points[0] = [
        originX + hAxis * Math.cos(startAngle),
        originY + vAxis * Math.sin(startAngle),
    ];
    points[n - 1] = [
        originX + hAxis * Math.cos(endAngle),
        originY + vAxis * Math.sin(endAngle),
    ];
    swapAngles[0] = startAngle;
    swapAngles[n - 1] = endAngle;

    for (i = 0; i < n; i += 1) {
        angles[i] = startAngle + i / n * (endAngle - startAngle);
    }

    do {
        if (cumLengths[n - 1] !== undefined) {  // Skip on first pass.
            for (i = 1; i < n - 1; i += 1) {
                const expected = i / (n - 1);
                let lErr = expected - cumLengths[i] / cumLengths[n - 1],
                    rErr = cumLengths[i + 1] / cumLengths[n - 1] - expected,
                    ratio = Math.min(lErr / (lErr + rErr), 0.499);
                if (ratio >= 0) {
                    // Interpolate with right-hand value.
                    swapAngles[i] = angles[i]
                        + ratio * (angles[i + 1] - angles[i]);
                } else {
                    rErr = -lErr;
                    lErr = expected - cumLengths[i - 1] / cumLengths[n - 1];
                    ratio = Math.min(rErr / (lErr + rErr), 0.499);
                    // Interpolate with left-hand value.
                    swapAngles[i] = angles[i]
                        + ratio * (angles[i - 1] - angles[i]);
                }
            }
            [swapAngles, angles] = [angles, swapAngles];
        }
        for (i = 1; i < n - 1; i += 1) {
            points[i] = [
                originX + hAxis * Math.cos(angles[i]),
                originY + vAxis * Math.sin(angles[i]),
            ];
        }
        minDist = Infinity;
        maxDist = -Infinity;
        for (i = 1; i < n; i += 1) {
            const distance = Math.hypot(
                points[i][0] - points[i - 1][0],
                points[i][1] - points[i - 1][1],
            );
            minDist = Math.min(minDist, distance);
            maxDist = Math.max(maxDist, distance);
            cumLengths[i] = cumLengths[i - 1] + distance;
        }
    } while (epsilon <= maxDist - minDist);

    return points;
}
