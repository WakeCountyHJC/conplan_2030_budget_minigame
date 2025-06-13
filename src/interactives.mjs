'use strict';

import {
    Container,
    GraphicsContext,
    Graphics,
    Rectangle,
    Text,
} from 'pixi.js';
import sceneContainer from './scene_container.mjs';
import {
    state,
    selectRemainingCash,
} from './state.mjs';

import appStrings from './app_strings.json';

import bucketSVG from 'bundle-text:./assets/bucket.svg';
import cashSVG from 'bundle-text:./assets/cash.svg';
import cashStackSVG from 'bundle-text:./assets/cash_stack.svg';
import screenshotSVG from 'bundle-text:./assets/screenshot.svg';


const app = sceneContainer.app,
    cashGraphicContext = new GraphicsContext().svg(cashSVG),
    cashStackGraphicContext = new GraphicsContext().svg(cashStackSVG),
    bucketGraphicContext = new GraphicsContext().svg(bucketSVG),
    screenshotGraphicContext = new GraphicsContext().svg(screenshotSVG);

class Interactive {
    constructor ([x, y], scale) {
        this.graphic = new Container();
        this.graphic.x = x;
        this.graphic.y = y;
        this.graphic.scale.set(scale);
    }

    attachTo(parent) {
        parent.addChild(this.graphic);
    }

    moveTo([x, y], scale) {
        this.graphic.x = x;
        this.graphic.y = y;
        this.graphic.scale.set(scale);
    }

    update() {
        // No-op by default.
    }
}

export class Bucket extends Interactive {
    constructor(idx, [x, y], scale) {
        super([x, y], scale);
        this.idx = idx;
        this.graphic.cursor = 'pointer';
        this.graphic.eventMode = 'static';
        // Build and label the bucket.
        this.bucketGraphic = new Graphics(bucketGraphicContext);
        const bucketBounds = this.bucketGraphic.getLocalBounds();
        this.bucketGraphic.pivot.set(
            bucketBounds.width / 2,
            bucketBounds.height / 2
        );
        this.bucketGraphic.scale.set(1.5);
        this.bucketGraphic.cursor = 'pointer';
        this.amountText = new Text({
            text: this.formatAmount(),
            style: {
                fill: '#000000',
                stroke: {
                    color: '#ffffff',
                    width: 2,
                },
                align: 'center',
                fontSize: '24px',
            },
            anchor: 0.5,
            position: {
                x: 0,
                y: 20
            }
        })
        this.labelText = new Text({
            text: appStrings.bucketLabelsShort[this.idx],
            style: {
                fill: '#000000',
                fontWeight: 'bold',
                align: 'center',
                fontSize: '24px',
            },
            anchor: 0.5,
            position: {
                x: 0,
                y: 120
            },
        });
        this.graphic.addChild(
            this.bucketGraphic,
            this.labelText,
            this.amountText
        );
        // Prepare popup menu.
        this.popup = new Container();
        this.popup.addChild(
            new Graphics().roundRect(
                0, 0, 500, 400
            ).fill({
                color: 0xddddff
            })
        );
        const popupBounds = this.popup.getLocalBounds();
        this.popup.pivot.set(
            popupBounds.width / 2,
            popupBounds.height / 2
        );
        this.popupLabelText = new Text({
            text: appStrings.bucketLabels[this.idx],
            style: {
                fill: '#000000',
                align: 'center',
                fontSize: '32px',
                fontWeight: 'bold'
            },
            anchor: 0.5,
            position: {
                x: popupBounds.width / 2,
                y: 50
            }
        })
        this.popupAmountText = new Text({
            text: this.formatAmount(),
            style: {
                fill: '#000000',
                align: 'center',
                fontSize: '32px'
            },
            anchor: 0.5,
            position: {
                x: popupBounds.width / 2,
                y: 150
            }
        });

        // Build money slider.
        this.slider = new Container();
        this.sliderBar
            = new Graphics()
                .rect(0, 0, 320, 4)
                .fill({color: 0x272d37});
        this.sliderBar.eventMode = 'static';
        this.sliderBar.cursor = 'pointer';
        this.sliderBar.hitArea = new Rectangle(0, -16, 320, 34);
        this.handle = new Graphics()
            .circle(0, 0, 20)
            .fill({color: 0xffffff});
        this.handle.x
            = this.slider.width
                * state.bucketAlloc[this.idx] / state.budget;
        this.handle.y = this.slider.height / 2;
        this.handle.eventMode = 'static';
        this.handle.cursor = 'pointer';
        this.handle.on('pointerdown', this.onSliderDragStart, this);
        this.handle.on('pointerup', this.onSliderDragEnd, this);
        this.handle.on('pointerupoutside', this.onSliderDragEnd, this);
        this.sliderBar.on('pointerdown', this.onSliderDragStart, this);
        this.sliderBar.on('pointerup', this.onSliderDragEnd, this);
        this.sliderBar.on('pointertap', this.onSliderDrag, this);
        this.sliderBar.on('pointerupoutside', this.onSliderDragEnd, this);
        this.slider.addChild(this.sliderBar);
        this.slider.addChild(this.handle);
        this.popup.addChild(this.slider);
        this.popup.addChild(this.popupLabelText);
        this.popup.addChild(this.popupAmountText);
        const sliderBounds = this.slider.getLocalBounds();
        this.slider.pivot.set(
            sliderBounds.width / 2,
            sliderBounds.height / 2
        );
        this.slider.position.set(popupBounds.width / 2, 300);

        // Add events.
        this.graphic.on('pointertap', this.showBucketMenu, this);
    }

    showBucketMenu(e) {
        app.stage.addChild(this.popup);
        const {width, height} = this.popup.getLocalBounds();
        this.popup.position.copyFrom({
            x: Math.max(
                width / 2,
                Math.min(e.global.x, window.innerWidth - width / 2)
            ),
            y: Math.max(
                height / 2,
                Math.min(e.global.y, window.innerHeight - height / 2)
            ),
        });
        this.maxValue = selectRemainingCash() + state.bucketAlloc[this.idx];
        this.handle.x
            = this.sliderBar.width
                * state.bucketAlloc[this.idx] / this.maxValue;
        // We make this a closure rather than a method so that it is uniquely
        // detachable.
        const hideBucketMenu = (e) => {
            const bounds = this.popup.getBounds();
            if (e.global.x > bounds.x
                    && e.global.x < bounds.x + bounds.width
                    && e.global.y > bounds.y
                    && e.global.y < bounds.y + bounds.height) {
                return;
            }
            app.stage.removeChild(this.popup);
            app.stage.off('pointertap', hideBucketMenu);
        };
        app.stage.on('pointertap', hideBucketMenu, this);
    }

    onSliderDragStart() {
        app.stage.on('pointermove', this.onSliderDrag, this);
    }

    onSliderDrag(e) {
        const sliderWidth = this.sliderBar.width;
        this.handle.x = Math.max(
            0,
            Math.min(
                this.sliderBar.toLocal(e.global).x,
                sliderWidth
            )
        );
        state.bucketAlloc[this.idx]
            = Math.round(
                this.handle.x / sliderWidth * this.maxValue / 100000
            ) * 100000;
        sceneContainer.updateScene();
    }

    onSliderDragEnd(e) {
        app.stage.off('pointermove', this.onSliderDrag);
    }

    formatAmount() {
        return `$${state.bucketAlloc[this.idx].toLocaleString()}`;
    }

    update() {
        this.amountText.text = this.formatAmount();
        this.popupAmountText.text = this.formatAmount();
    }
}

export class CashStack extends Interactive {
    constructor(label, denomination, [x, y], scale) {
        super([x, y], scale);
        this.graphic.cursor = 'pointer';
        this.graphic.eventMode = 'static';
        this.denomination = denomination;

        // Prepare graphics of single bills and stacks.
        this.cashGraphic = new Graphics(cashGraphicContext);
        const cashBounds = this.cashGraphic.getLocalBounds();
        this.cashGraphic.pivot.set(
            cashBounds.width / 2,
            cashBounds.height / 2
        );
        this.stackGraphic = new Graphics(cashStackGraphicContext);
        const stackBounds = this.stackGraphic.getLocalBounds();
        this.stackGraphic.pivot.set(
            stackBounds.width / 2,
            stackBounds.height / 2
        );
        this.text = new Text({
            text: label,
            style: {
                fill: '#000000',
                fontSize: '28px',
            },
            anchor: 0.5,
            rotation: Math.PI / 4,
        });
        this.setStackState();

        // Build drag icon.
        this.textDrag = new Text({
            text: label,
            style: {
                fill: '#000000',
                fontSize: '28px',
            },
            position: {
                x: 50,
                y: 50
            },
            anchor: 0.5,
        });
        this.dragCash = new Container();
        this.dragCash.eventMode = 'static';
        this.dragCash.alpha = 0.5;
        const dragBill = new Graphics(cashGraphicContext);
        const dragBillBounds = dragBill.getLocalBounds();
        this.dragCash.pivot.set(
            dragBillBounds.width / 2,
            dragBillBounds.height / 2
        );
        this.dragCash.addChild(dragBill);
        this.dragCash.addChild(this.textDrag);

        // Apply drag events.
        this.graphic.on('pointerdown', (e) => {
            this.graphic.parent.addChild(this.dragCash);
            this.dragCash.position.copyFrom(e.global);
            app.stage.on('pointermove', this.dragMove, this);
        });
        this.dragCash.on('pointerup', (e) => {
            app.stage.off('pointermove', this.dragMove);
            this.graphic.parent.removeChild(this.dragCash);
            sceneContainer.sendEvent('dropCash', {
                denomination: this.denomination,
                global: e.global,
            });
        });
    }

    dragMove(e) {
        this.dragCash.position.copyFrom(e.global);
    }

    setStackState() {
        const remainder = selectRemainingCash(),
            billsLeft = Math.floor(remainder / this.denomination);
        this.graphic.removeChildren();
        if (billsLeft > 1) {
            this.graphic.addChild(
                this.stackGraphic,
                this.text
            );
            this.text.position.set(20, 20);
        } else if (billsLeft === 1) {
            this.graphic.addChild(
                this.cashGraphic,
                this.text
            );
            this.text.position.set(5, 5);
        }
    }

    update() {
        this.setStackState();
    }
}

export class Remainder extends Interactive {
    constructor([x, y], scale) {
        super([x, y], scale);
        this.text = new Text({
            text: this.formatText(),
            style: {
                fill: '#000000',
                align: 'center',
                fontSize: '50px',
                fontWeight: 'bold',
            },
            anchor: 0.5,
        });
        this.graphic.addChild(this.text);
    }

    formatText() {
        const remainder = selectRemainingCash();
        if (remainder === 0) {
            return 'All Funds Allocated';
        }
        return `$${remainder.toLocaleString()}`;
    }

    update() {
        this.text.text = this.formatText();
    }
}

export class ScreenshotButton extends Interactive {
    constructor([x, y], scale) {
        super([x, y], scale);
        // Screenshot camera icon.
        const icon = new Graphics(screenshotGraphicContext),
            iconBounds = icon.getLocalBounds();
        icon.pivot.set(
            iconBounds.width / 2,
            iconBounds.height / 2,
        );

        // Assemble the full button.
        this.button = new Container();
        this.button.addChild(icon);
        this.button.addChild(new Text({
            text: 'Screenshot',
            style: {
                fill: '#000000',
                fontSize: '25px',
                align: 'right',
            },
            position: {
                x: 0,
                y: 60,
            },
            anchor: 0.5,
        }));
        this.button.eventMode = 'static';
        this.button.cursor = 'pointer';
        this.button.on('pointertap', async () => {
            this.graphic.visible = false;
            await sceneContainer.takeScreenshot();
            this.graphic.visible = true;
        });
        const bounds = this.button.getLocalBounds();
        this.button.hitArea = new Rectangle(
            bounds.minX,
            bounds.minY,
            bounds.width,
            bounds.height,
        );
        this.graphic.addChild(this.button);
        this.update();
    }

    update() {
        this.graphic.visible = (selectRemainingCash() === 0);
    }
}

