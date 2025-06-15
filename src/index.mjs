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
                sceneContainer.setScene(GameScene);
                sceneContainer.updateScene();
                e.currentTarget.textContent = appStrings.multiuserModeWarning;
                e.currentTarget.disabled = true;
                e.currentTarget.classList.add('modal__start-btn--disabled');
            }
            hideModal('about');
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

