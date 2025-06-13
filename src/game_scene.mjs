'use strict';

import {
    Assets,
    Container,
    Graphics,
    Sprite,
} from 'pixi.js';

import {
    Bucket,
    CashStack,
    Remainder,
    ScreenshotButton,
} from './interactives.mjs';
import {
    NUM_BUCKETS,
    state,
    storeGameState,
} from './state.mjs';


const wchjcLogoTexturePromise = Assets.load(
    new URL(
        'assets/wchjc_logo_orig.jpg',
        import.meta.url
    ).href
);

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(
            () => {
                func.apply(this, args);
            },
            timeout
        );
    };
}

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
            bucketScale = this.getBucketScale();

        this.buckets = [];
        for (let i = 0; i < NUM_BUCKETS; i += 1) {
            this.buckets.push(new Bucket(
                i,
                this.getBucketLocation(i),
                bucketScale
            ));
        }

        this.cashStacks = [
            new CashStack('$10M', 1e7, this.getCashLocation(0), cashScale),
            new CashStack('$5M', 5e6, this.getCashLocation(1), cashScale),
            new CashStack('$1M', 1e6, this.getCashLocation(2), cashScale),
            new CashStack('$100K', 1e5, this.getCashLocation(3), cashScale)
        ];

        this.remainder = new Remainder(
            this.getRemainderLocation(),
            this.getRemainderScale(),
        );

        this.screenshotButton = new ScreenshotButton(
            this.getScreenshotButtonLocation(),
            this.getScreenshotButtonScale(),
        );

        // Fetch WCHJC logo (likely cached) and apply cropping.
        wchjcLogoTexturePromise.then(
            (texture) => {
                const mask = new Graphics().rect(25, 100, 280, 200).fill(0),
                    sprite = new Sprite(texture);

                this.logo = new Container();
                this.logo.addChild(sprite);
                this.logo.addChild(mask);
                sprite.mask = mask;
                this.logo.pivot.set(25, 100);
                this.logo.position.set(0, 0);
                this.logo.scale.set(this.getLogoScale());

                this.layer.addChild(this.logo);
            }
        );

        this.remainder.attachTo(this.layer);
        for (const bucket of this.buckets) {
            bucket.attachTo(this.layer);
        }
        for (const cashStack of this.cashStacks) {
            cashStack.attachTo(this.layer);
        }
        this.screenshotButton.attachTo(this.layer);
    }

    getLogoScale() {
        return 0.6 * Math.min(window.innerHeight, 640) / 640;
    }

    getScreenshotButtonScale() {
        return 1.0;
    }

    getScreenshotButtonLocation() {
        return [
            window.innerWidth / 2.,
            window.innerHeight / 3.
        ];
    }

    getRemainderScale() {
        return 1.0;
    }

    getRemainderLocation() {
        return [
            window.innerWidth / 2.,
            window.innerHeight / 2.
        ];
    }

    getBucketScale(index) {
        return Math.min(
            Math.min(window.innerWidth, 940) / 940.,
            Math.min(window.innerHeight, 940) / 940.,
        );
    }

    getBucketLocation(index) {
        const centerY = window.innerHeight / 3,
            angle = -Math.PI * (1.125 + 3. * index / 16),
            yRadius = window.innerHeight / 2.;
        return [
            window.innerWidth * 0.1 + window.innerWidth * 0.8 * index / 4,
            centerY + yRadius * Math.sin(angle)
        ];
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

    receiveEvent(eventName, e) {
        if (eventName === 'dropCash') {
            this.onDropCash(e);
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
                state.bucketAlloc[i] += e.denomination;
                this.update();
                break;
            }
        }
    }

    reflow() {
        let i;
        for (i = 0; i < this.buckets.length; i += 1) {
            this.buckets[i].moveTo(
                this.getBucketLocation(i),
                this.getBucketScale(i),
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
        this.screenshotButton.moveTo(
            this.getScreenshotButtonLocation(),
            this.getScreenshotButtonScale(),
        );
        if (this.logo) {
            this.logo.scale.set(this.getLogoScale());
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
        this.screenshotButton.update();
        debounce(storeGameState)();
    }
}

export default GameScene;

