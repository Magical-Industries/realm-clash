import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Point,
  Rectangle,
  Text,
} from "pixi.js";
import type { HandCard, PlayerId, Position } from "@magicalindustries/realm-clash-core";
import { playerPixi, rarityPixi, theme } from "../ui/theme.js";
import { HAND_STRIP_HEIGHT } from "./arena-layout.js";

const DRAG_THRESHOLD = 6;
const MAX_CARD_WIDTH = 108;
const MAX_CARD_HEIGHT = 72;
const MIN_CARD_WIDTH = 64;

interface DragContext {
  dragLayer: Container;
  app: Application;
  resolveDropTarget: (globalX: number, globalY: number) => Position | null;
  onDrop: (instanceId: string, position: Position | null) => void;
  onDragHover: (position: Position | null) => void;
}

interface ActiveDrag {
  card: HandCard;
  playerId: PlayerId;
  pointerId: number;
  origin: Point;
  ghost: Container;
  moved: boolean;
  cardWidth: number;
  cardHeight: number;
}

interface HandLayout {
  cardWidth: number;
  cardHeight: number;
  gap: number;
  startX: number;
}

export class HandView {
  readonly root = new Container();
  private layoutCardWidth = MAX_CARD_WIDTH;
  private layoutCardHeight = MAX_CARD_HEIGHT;
  private onSelect?: (instanceId: string) => void;
  private dragContext?: DragContext;
  private activeDrag: ActiveDrag | null = null;
  private suppressTapFor: string | null = null;
  private boundMove?: (event: FederatedPointerEvent) => void;
  private boundEnd?: (event: FederatedPointerEvent) => void;

  onCardSelected(handler: (instanceId: string) => void): void {
    this.onSelect = handler;
  }

  configureDrag(context: DragContext): void {
    this.dragContext = context;
  }

  render(
    hand: HandCard[],
    playerId: PlayerId,
    selectedCardId: string | null,
    interactive: boolean,
    width: number,
    options: { dimmed?: boolean; label?: string; hidden?: boolean } = {},
  ): void {
    this.root.removeChildren();
    this.root.alpha = options.dimmed ? 0.55 : 1;

    const cardsY = 18;

    if (options.hidden) {
      this.renderHiddenHand(hand.length, playerId, width, options.label, cardsY);
      return;
    }

    if (options.label && !options.hidden) {
      const label = new Text({
        text: options.label,
        style: {
          fill: playerPixi(playerId),
          fontSize: 10,
          fontWeight: "700",
          fontFamily: "Inter, system-ui, sans-serif",
        },
      });
      label.position.set(8, 2);
      this.root.addChild(label);
    }

    if (hand.length === 0) {
      const empty = new Text({
        text: "Hand empty",
        style: { fill: theme.pixi.textMuted, fontSize: 12 },
      });
      empty.position.set(8, cardsY);
      this.root.addChild(empty);
      return;
    }

    const visibleCount = this.activeDrag
      ? hand.filter((c) => c.instanceId !== this.activeDrag!.card.instanceId).length
      : hand.length;
    const layout = this.computeHandLayout(visibleCount, width);
    this.layoutCardWidth = layout.cardWidth;
    this.layoutCardHeight = layout.cardHeight;

    let slot = 0;
    hand.forEach((card) => {
      if (this.activeDrag?.card.instanceId === card.instanceId) return;

      const x = layout.startX + slot * (layout.cardWidth + layout.gap);
      slot += 1;
      const selected = card.instanceId === selectedCardId;
      const view = this.drawHandCard(
        card,
        playerId,
        x,
        cardsY,
        layout.cardWidth,
        layout.cardHeight,
        selected,
        interactive,
      );
      this.root.addChild(view);
    });
  }

  get height(): number {
    return HAND_STRIP_HEIGHT;
  }

  private renderHiddenHand(
    count: number,
    playerId: PlayerId,
    width: number,
    label: string | undefined,
    cardsY: number,
  ): void {
    if (label) {
      const labelText = new Text({
        text: label,
        style: {
          fill: playerPixi(playerId),
          fontSize: 10,
          fontWeight: "700",
          fontFamily: "Inter, system-ui, sans-serif",
        },
      });
      labelText.position.set(8, 2);
      this.root.addChild(labelText);
    }

    if (count === 0) {
      const empty = new Text({
        text: "No cards left",
        style: { fill: theme.pixi.textMuted, fontSize: 12 },
      });
      empty.position.set(8, cardsY);
      this.root.addChild(empty);
      return;
    }

    const cardWidth = 52;
    const cardHeight = 72;
    const gap = 6;
    const totalWidth = count * cardWidth + (count - 1) * gap;
    const startX = Math.max(8, (width - totalWidth) / 2);
    const ownerColor = playerPixi(playerId);

    for (let i = 0; i < count; i += 1) {
      const x = startX + i * (cardWidth + gap);
      const back = new Graphics()
        .roundRect(0, 0, cardWidth, cardHeight, 8)
        .fill({ color: ownerColor, alpha: 0.18 })
        .stroke({ color: theme.pixi.border, width: 1.5, alpha: 0.9 });
      back.position.set(x, cardsY);

      const mark = new Text({
        text: "?",
        style: {
          fill: theme.pixi.textMuted,
          fontSize: 18,
          fontWeight: "700",
        },
      });
      mark.anchor.set(0.5);
      mark.position.set(x + cardWidth / 2, cardsY + cardHeight / 2);
      this.root.addChild(back, mark);
    }
  }

  private computeHandLayout(handCount: number, width: number): HandLayout {
    const padding = 16;
    const maxWidth = Math.max(0, width - padding);
    const gap = handCount > 4 ? 6 : 8;
    let cardWidth = MAX_CARD_WIDTH;

    if (handCount > 0) {
      const naturalTotal = handCount * cardWidth + (handCount - 1) * gap;
      if (naturalTotal > maxWidth) {
        cardWidth = (maxWidth - (handCount - 1) * gap) / handCount;
        cardWidth = Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, cardWidth));
      }
    }

    const cardHeight = cardWidth * (MAX_CARD_HEIGHT / MAX_CARD_WIDTH);
    const totalWidth = handCount * cardWidth + Math.max(0, handCount - 1) * gap;
    const startX = Math.max(8, (width - totalWidth) / 2);

    return { cardWidth, cardHeight, gap, startX };
  }

  private drawHandCard(
    card: HandCard,
    playerId: PlayerId,
    x: number,
    y: number,
    cardWidth: number,
    cardHeight: number,
    selected: boolean,
    interactive: boolean,
  ): Container {
    const root = new Container();
    const ownerColor = playerPixi(playerId);
    const rarityColor = rarityPixi(card.template.rarity);
    const radius = Math.max(6, cardWidth * 0.09);
    const titleSize = Math.max(9, cardWidth * 0.11);
    const metaSize = Math.max(8, cardWidth * 0.09);

    const body = new Graphics()
      .roundRect(0, 0, cardWidth, cardHeight, radius)
      .fill({ color: ownerColor, alpha: selected ? 0.42 : 0.22 })
      .stroke({
        color: selected ? theme.pixi.highlight : rarityColor,
        width: selected ? 3 : 1.5,
        alpha: 0.95,
      });
    root.addChild(body);

    const title = new Text({
      text: card.template.name,
      style: {
        fill: theme.pixi.textPrimary,
        fontSize: titleSize,
        fontWeight: "700",
        wordWrap: true,
        wordWrapWidth: cardWidth - 10,
      },
    });
    title.position.set(6, 6);
    root.addChild(title);

    const meta = new Text({
      text: `HP ${card.template.maxHp} · ${card.template.arrows.length} arrows`,
      style: { fill: theme.pixi.textSecondary, fontSize: metaSize, fontFamily: "monospace" },
    });
    meta.position.set(6, cardHeight - metaSize - 8);
    root.addChild(meta);

    root.position.set(x, y);

    if (interactive && this.dragContext) {
      root.eventMode = "static";
      root.cursor = "grab";
      root.hitArea = new Rectangle(0, 0, cardWidth, cardHeight);
      root.on("pointerdown", (event) =>
        this.beginDrag(event, card, playerId, cardWidth, cardHeight),
      );
      root.on("pointertap", () => {
        if (this.suppressTapFor === card.instanceId) {
          this.suppressTapFor = null;
          return;
        }
        this.onSelect?.(card.instanceId);
      });
    } else if (interactive) {
      root.eventMode = "static";
      root.cursor = "pointer";
      root.hitArea = new Rectangle(0, 0, cardWidth, cardHeight);
      root.on("pointertap", () => this.onSelect?.(card.instanceId));
    }

    return root;
  }

  private beginDrag(
    event: FederatedPointerEvent,
    card: HandCard,
    playerId: PlayerId,
    cardWidth: number,
    cardHeight: number,
  ): void {
    const ctx = this.dragContext;
    if (!ctx || this.activeDrag) return;

    event.stopPropagation();

    const origin = event.getLocalPosition(ctx.dragLayer);
    const ghost = this.createGhost(card, playerId, cardWidth, cardHeight);
    ghost.position.set(origin.x - cardWidth / 2, origin.y - cardHeight / 2);
    ghost.alpha = 0.88;
    ghost.scale.set(1.05);
    ctx.dragLayer.addChild(ghost);

    this.activeDrag = {
      card,
      playerId,
      pointerId: event.pointerId,
      origin,
      ghost,
      moved: false,
      cardWidth,
      cardHeight,
    };

    ctx.onDragHover(null);
    ctx.dragLayer.eventMode = "static";
    ctx.dragLayer.cursor = "grabbing";

    this.boundMove = (moveEvent) => this.updateDrag(moveEvent);
    this.boundEnd = (endEvent) => this.endDrag(endEvent);

    ctx.app.stage.on("pointermove", this.boundMove);
    ctx.app.stage.on("pointerup", this.boundEnd);
    ctx.app.stage.on("pointerupoutside", this.boundEnd);
  }

  private updateDrag(event: FederatedPointerEvent): void {
    const drag = this.activeDrag;
    const ctx = this.dragContext;
    if (!drag || !ctx || event.pointerId !== drag.pointerId) return;

    const point = event.getLocalPosition(ctx.dragLayer);
    drag.ghost.position.set(
      point.x - drag.cardWidth / 2,
      point.y - drag.cardHeight / 2,
    );

    const dx = point.x - drag.origin.x;
    const dy = point.y - drag.origin.y;
    if (!drag.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      drag.moved = true;
      ctx.onDragHover(null);
    }

    if (drag.moved) {
      const hover = ctx.resolveDropTarget(event.global.x, event.global.y);
      ctx.onDragHover(hover);
    }
  }

  private endDrag(event: FederatedPointerEvent): void {
    const drag = this.activeDrag;
    const ctx = this.dragContext;
    if (!drag || !ctx || event.pointerId !== drag.pointerId) return;

    this.unbindDragListeners();

    const dropPosition = drag.moved
      ? ctx.resolveDropTarget(event.global.x, event.global.y)
      : null;

    ctx.dragLayer.removeChild(drag.ghost);
    ctx.dragLayer.eventMode = "passive";
    ctx.dragLayer.cursor = "default";
    ctx.onDragHover(null);

    if (drag.moved) {
      this.suppressTapFor = drag.card.instanceId;
      ctx.onDrop(drag.card.instanceId, dropPosition);
    }

    this.activeDrag = null;
  }

  private unbindDragListeners(): void {
    const ctx = this.dragContext;
    if (!ctx) return;
    if (this.boundMove) ctx.app.stage.off("pointermove", this.boundMove);
    if (this.boundEnd) {
      ctx.app.stage.off("pointerup", this.boundEnd);
      ctx.app.stage.off("pointerupoutside", this.boundEnd);
    }
    this.boundMove = undefined;
    this.boundEnd = undefined;
  }

  private createGhost(
    card: HandCard,
    playerId: PlayerId,
    cardWidth: number,
    cardHeight: number,
  ): Container {
    const ghost = new Container();
    const ownerColor = playerPixi(playerId);
    const rarityColor = rarityPixi(card.template.rarity);
    const radius = Math.max(6, cardWidth * 0.09);
    const titleSize = Math.max(9, cardWidth * 0.11);

    const body = new Graphics()
      .roundRect(0, 0, cardWidth, cardHeight, radius)
      .fill({ color: ownerColor, alpha: 0.5 })
      .stroke({ color: theme.pixi.highlight, width: 3, alpha: 1 });
    ghost.addChild(body);

    const title = new Text({
      text: card.template.name,
      style: {
        fill: theme.pixi.textPrimary,
        fontSize: titleSize,
        fontWeight: "700",
        wordWrap: true,
        wordWrapWidth: cardWidth - 10,
      },
    });
    title.position.set(6, 6);
    ghost.addChild(title);

    const border = new Graphics()
      .roundRect(0, 0, cardWidth, cardHeight, radius)
      .stroke({ color: rarityColor, width: 2, alpha: 0.9 });
    ghost.addChild(border);

    return ghost;
  }
}