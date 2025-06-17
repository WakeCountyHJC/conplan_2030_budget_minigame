'use strict';

import {Application} from 'pixi.js';

class SceneContainer {
    constructor() {
        this.scenes = {};
        this.app = new Application(),
        this.app.init({
            resizeTo: window,
            background: '#9999FF',
            antialias: true
        }).then(() => {
            document.body.appendChild(this.app.canvas);
            this.app.stage.eventMode = 'static';
            this.app.stage.hitArea = this.app.screen;
        });
    }

    setScene(sceneClass) {
        if (this.scene) {
            this.app.stage.removeChild(this.scene);
        }
        if (this.scenes[sceneClass]) {
            this.scene = this.scenes[sceneClass];
        } else {
            this.scene = new sceneClass();
        }
        this.app.stage.addChild(this.scene.layer);
    }

    updateScene() {
        if (this.scene) {
            this.scene.update();
        }
    }

    reflow() {
        if (this.scene) {
            this.scene.reflow();
        }
    }

    sendEvent(eventName, e) {
        if (this.scene) {
            this.scene.receiveEvent(eventName, e);
        }
    }

    async takeScreenshot(baseFilename = 'screenshot') {
        if (this.scene) {
            this.app.stop();
            const dataURI = await this.app.renderer.extract.base64(
                    this.scene.layer
                ),
                link = document.createElement('a');
            link.href = dataURI;
            link.download = `${baseFilename}.png`;
            link.click();
            this.app.start();
        }
    }
}

export const sceneContainer = new SceneContainer();

export default sceneContainer;

