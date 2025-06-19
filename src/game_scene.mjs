'use strict';

import {
    Container,
    Graphics,
    Text,
} from 'pixi.js';

import {
    Bucket,
    CashStack,
    CancelSessionButton,
    GameSubmissionButton,
    Remainder,
    ScreenshotButton,
    WCHJCLogo,
} from './interactives.mjs';
import {
    debounce,
    distPointsOnEllipticalArc,
    showModal,
} from './utilities.mjs';
import {NUM_BUCKETS, store} from './store.mjs';

import appStrings from './app_strings.json';


class Scene {
    constructor() {
        this.layer = new Container();
    }

    reflow() {
        throw 'reflow() method must be overridden.';
    }

    receiveEvent(eventName, e) {
        // No-op by default.
    }
}

export class GameScene extends Scene {
    constructor() {
        super();
        const cashScale = this.getCashScale(),
            bucketScale = this.getBucketsScale(),
            bucketLocations = this.getBucketsLocations();

        this.buckets = [];
        for (let i = 0; i < bucketLocations.length; i += 1) {
            this.buckets.push(new Bucket(
                i,
                bucketLocations[i],
                bucketScale,
            ));
        }

        this.cashStacks = [
            new CashStack('$10M', 1e7, this.getCashLocation(0), cashScale),
            new CashStack('$5M', 5e6, this.getCashLocation(1), cashScale),
            new CashStack('$1M', 1e6, this.getCashLocation(2), cashScale),
            new CashStack('$100K', 1e5, this.getCashLocation(3), cashScale),
        ];

        this.remainder = new Remainder(
            this.getRemainderLocation(),
            this.getRemainderScale(),
        );

        if (store.multiuserMode) {
            this.endgameButton = new GameSubmissionButton(
                this.getEndgameButtonLocation(),
                this.getEndgameButtonScale(),
            );
        } else {
            this.endgameButton = new ScreenshotButton(
                this.getEndgameButtonLocation(),
                this.getEndgameButtonScale(),
            );
        }

        this.logo = new WCHJCLogo(
            this.getLogoPosition(),
            this.getLogoScale(),
        );

        this.remainder.attachTo(this.layer);
        for (const bucket of this.buckets) {
            bucket.attachTo(this.layer);
        }
        for (const cashStack of this.cashStacks) {
            cashStack.attachTo(this.layer);
        }
        this.endgameButton.attachTo(this.layer);

        if (store.multiuserMode) {
            this.multiuserSessionCancelButton = new CancelSessionButton(
                this.getCancelSessionButtonLocation(),
                this.getCancelSessionButtonScale(),
            );
            this.multiuserSessionCancelButton.attachTo(this.layer);
        }

        this.logo.attachTo(this.layer);
    }

    getLogoPosition() {
        return [0, 0];
    }

    getLogoScale() {
        return 0.6 * Math.min(window.innerHeight, 640) / 640;
    }

    getEndgameButtonScale() {
        return 1.0;
    }

    getEndgameButtonLocation() {
        return [
            window.innerWidth / 2.,
            window.innerHeight / 3.,
        ];
    }

    getRemainderScale() {
        return Math.min(
            Math.min(window.innerHeight, 700) / 700.,
            Math.min(window.innerWidth, 800) / 800.,
        );
    }

    getRemainderLocation() {
        return [
            window.innerWidth / 2.,
            window.innerHeight / 2.,
        ];
    }

    getBucketsScale() {
        return Math.min(
            Math.min(window.innerWidth, 940) / 940.,
            Math.min(window.innerHeight, 940) / 940.,
        );
    }

    getBucketsLocations() {
        return distPointsOnEllipticalArc(
            NUM_BUCKETS,
            window.innerWidth * 0.425,
            window.innerHeight / 2.,
            window.innerWidth / 2.,
            window.innerHeight / 3.,
            -Math.PI * 1.125,
            -Math.PI * 1.875,
        );
    }

    getCashScale(index) {
        return Math.min(
            Math.min(window.innerWidth, 720) / 720.,
            Math.min(window.innerHeight, 940) / 940.,
        );
    }

    getCashLocation(index) {
        return [
            window.innerWidth * 0.1 + window.innerWidth * 0.8 * index / 3,
            window.innerHeight * .3
        ];
    }

    getCancelSessionButtonLocation() {
        return [210, 20];
    }

    getCancelSessionButtonScale() {
        return Math.min(400, window.innerWidth) / 400;
    }

    receiveEvent(eventName, e) {
        switch (eventName) {
        case 'dropCash':
            this.onDropCash(e);
            break;
        case 'pushUserHistory':
            this.onPushUserHistory();
            break;
        case 'cancelUserSession':
            this.onCancelUserSession();
            break;
        case 'beforeScreenshot':
            this.onBeforeScreenshot();
            break;
        case 'afterScreenshot':
            this.onAfterScreensot();
            break;
        default:
            console.warn(`Unrecognized event ${eventName}.`);
        }
    }

    onDropCash(e) {
        for (let i = 0; i < this.buckets.length; i += 1) {
            // Linearly scan point-in-AABB detection against each bucket
            // graphic.
            const bucket = this.buckets[i],
                bounds = bucket.graphic.getBounds();
            if (e.global.x > bounds.x
                    && e.global.x < bounds.x + bounds.width
                    && e.global.y > bounds.y
                    && e.global.y < bounds.y + bounds.height) {
                store.state.bucketAlloc[i] += e.denomination;
                this.update();
                break;
            }
        }
    }

    onPushUserHistory() {
        store.pushUserHistory();
        store.clearUserProgress();
        this.update();
        window.alert(appStrings.submissionOK);
        showModal('multiuser');
    }

    onCancelUserSession() {
        store.clearUserProgress();
        this.update();
        showModal('multiuser');
    }

    /**
     * Adds and rearranges layer content temporarily for a better screenshot.
     */
    onBeforeScreenshot() {
        this.logo.uncrop();
        const logoBounds = this.logo.graphic.getLocalBounds();
        this.logo.graphic.pivot.set(
            logoBounds.width / 2,
            logoBounds.height - 150,
        );
        // Position the logo like we did the cash remainder display.
        this.logo.moveTo(
            this.getRemainderLocation(),
            this.getRemainderScale(),
        )
        this.tempCaption = new Text({
            text: appStrings.screenshotTitle,
            style: {
                fill: '#000000',
                fontSize: '36px',
                align: 'center',
                fontWeight: 'bold',
            },
            position: {
                x: window.innerWidth / 2,
                y: window.innerHeight + 20,
            },
            anchor: 0.5,
        });
        this.layer.addChildAt(this.tempCaption, 0);
        const bounds = this.layer.getLocalBounds();
        this.tempRectangle = new Graphics().rect(
            bounds.minX - 20,
            bounds.minY - 20,
            bounds.width + 40,
            bounds.height + 40,
        ).fill(0x9999ff);
        this.remainder.graphic.visible = false;
        this.layer.addChildAt(this.tempRectangle, 0);
    }

    /**
     * Cleans up the work of onBeforeScreenshot() after a screenshot has been
     * taken.
     */
    onAfterScreensot() {
        this.logo.crop();
        this.logo.graphic.pivot.set(25, 100);
        this.remainder.graphic.visible = true;
        this.layer.removeChild(this.tempRectangle);
        this.layer.removeChild(this.tempCaption);
        delete this.tempRectangle;
        delete this.tempCaption;
        this.reflow();
    }

    reflow() {
        let i;
        const bucketScale = this.getBucketsScale(),
            bucketLocations = this.getBucketsLocations();
        for (i = 0; i < this.buckets.length; i += 1) {
            this.buckets[i].moveTo(
                bucketLocations[i],
                bucketScale,
            );
        }
        for (i = 0; i < this.cashStacks.length; i += 1) {
            this.cashStacks[i].moveTo(
                this.getCashLocation(i),
                this.getCashScale(i),
            );
        }
        this.remainder.moveTo(
            this.getRemainderLocation(),
            this.getRemainderScale(),
        );
        this.endgameButton.moveTo(
            this.getEndgameButtonLocation(),
            this.getEndgameButtonScale(),
        );
        this.logo.moveTo(
            this.getLogoPosition(),
            this.getLogoScale(),
        );
        if (this.multiuserSessionCancelButton) {
            this.multiuserSessionCancelButton.moveTo(
                this.getCancelSessionButtonLocation(),
                this.getCancelSessionButtonScale(),
            );
        }
    }

    update() {
        for (const bucket of this.buckets) {
            bucket.update();
        }
        for (const cashStack of this.cashStacks) {
            cashStack.update();
        }
        this.remainder.update();
        this.endgameButton.update();
        debounce(store.storeGameState, store)();
    }
}

export default GameScene;

