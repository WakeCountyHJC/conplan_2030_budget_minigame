'use strict';

import GameScene from './game_scene.mjs';
import {hydrateGameState} from './state.mjs';
import sceneContainer from './scene_container.mjs';


function hideAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.removeAttribute('style');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

function showAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');
}

function init() {
    hideAboutModal();
    for (const closeBtn of
            document.getElementsByClassName('about-modal-close')) {
        closeBtn.addEventListener('click', hideAboutModal);
    }
    document.getElementById('about-modal').addEventListener(
        'click',
        (e) => {
            if (e.target === e.currentTarget) {
                hideAboutModal();
                e.preventDefault();
            }
        }
    );

    hydrateGameState();
    window.addEventListener('resize', () => {
        sceneContainer.reflow();
    });
    sceneContainer.setScene(GameScene);
    showAboutModal();
}

if (document.readyState === 'loading') {
    (() => {
        window.document.addEventListener('DOMContentLoaded', init);
    })();
} else {
    init();
}
