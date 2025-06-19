'use strict';

import {
    exportUserHistoryToCSVDataURI,
    exportUserHistoryToJSONDataURI,
} from './exporter.mjs';
import GameScene from './game_scene.mjs';
import {
    getTimeFilenameString,
    hideModal,
    showModal,
} from './utilities.mjs';
import sceneContainer from './scene_container.mjs';
import store from './store.mjs';

import appStrings from './app_strings.json';


function init() {
    const aboutModal = document.getElementById('about-modal'),
        sessionModal = document.getElementById('session-modal');

    aboutModal.removeAttribute('style');
    sessionModal.removeAttribute('style');
    document.getElementById('multiuser-modal').removeAttribute('style');

    for (const closeBtn of
            document.getElementsByClassName(`about-modal-close`)) {
        closeBtn.addEventListener('click', () => {
            if (!store.initialized) {
                store.initialize();
                sceneContainer.setScene(GameScene);
            }
            hideModal('about');
        });
    }
    for (const closeBtn of
            document.getElementsByClassName(`session-modal-close`)) {
        closeBtn.addEventListener('click', () => {
            hideModal('session');
        });
    }

    aboutModal.addEventListener(
        'click',
        (e) => {
            if (e.target === e.currentTarget) {
                if (!store.initialized) {
                    store.initialize();
                    sceneContainer.setScene(GameScene);
                }
                hideModal('about');
                e.preventDefault();
            }
        }
    );
    sessionModal.addEventListener(
        'click',
        (e) => {
            if (e.target === e.currentTarget) {
                hideModal('session');
            }
        }
    );
    document.getElementById('multiuser-start').addEventListener(
        'click',
        (e) => {
            if (!store.initialized) {
                store.initialize(true);
                store.clearUserProgress();
                sceneContainer.setScene(GameScene);
                sceneContainer.updateScene();
            }
            e.currentTarget.disabled = true;
            e.currentTarget.classList.add('modal__start-btn--disabled');
            hideModal('about');
            showModal('multiuser');
        }
    );
    document.getElementById('multiuser-session-init').addEventListener(
        'submit',
        (e) => {
            const form = e.currentTarget;
            if (form.reportValidity()) {
                for (const el of form.elements) {
                    if (el.name === 'city') {
                        store.state.currUser.cityOrRegion = el.value;
                    } else if (el.name === 'zip') {
                        store.state.currUser.zipCode = el.value;
                    }
                }
                hideModal('multiuser');
                form.reset();
            }
            e.stopPropagation();
            e.preventDefault();
        }
    );
    document.getElementById('session-options-modal-btn').addEventListener(
        'click',
        () => {
            // This follows the multiuser modal in the DOM tree, so we
            // can be lazy and safely open and close it on top of the multiuser
            // modal, despite the shared z-index.
            showModal('session');
        }
    );
    document.getElementById('session-csv-export').addEventListener(
        'click',
        () => {
            const uri = encodeURI(exportUserHistoryToCSVDataURI()),
                link = document.createElement('a'),
                timeString = getTimeFilenameString();
            link.href = uri;
            link.download = `user_data_${timeString}.csv`;
            link.click();
        }
    );
    document.getElementById('session-json-export').addEventListener(
        'click',
        () => {
            const uri = encodeURI(exportUserHistoryToJSONDataURI()),
                link = document.createElement('a'),
                timeString = getTimeFilenameString();
            link.href = uri;
            link.download = `user_data_${timeString}.json`;
            link.click();
        }
    );
    document.getElementById('session-clear').addEventListener(
        'click',
        () => {
            if (window.confirm(appStrings.sessionClearConfirm)) {
                store.clearUserHistory();
                sceneContainer.updateScene();
                hideModal('session');
            }
        }
    );

    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
        document.body.style.zoom = 1;
    });

    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
        document.body.style.zoom = 1;
    });

    document.addEventListener('gestureend', function(e) {
        e.preventDefault();
        document.body.style.zoom = 1;
    });

    window.addEventListener('resize', () => {
        sceneContainer.reflow();
    });

    showModal('about');
}

if (document.readyState === 'loading') {
    window.document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

