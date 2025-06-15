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

