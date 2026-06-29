import { Application, Container, Graphics, Text } from "pixi.js";
import { GRID_SIZE } from "@magicalindustries/realm-clash-core";
import type { BoardCard, GameState, Position } from "@magicalindustries/realm-clash-core";
import { playerPixi, rarityPixi, theme } from "../ui/theme.js";
import {
  computeArenaInsets,
  computeGridLayout,
  type ArenaInsets,
  type GridLayout,
} from "./arena-layout.js";

export class BoardView {
  readonly app: Application;
  readonly ready: Promise<void>;
  private boardLayer = new Container();
  private cardLayer = new Container();
  private highlightLayer = new Container();
  private cellSize = 80;
  private gridMetrics: GridLayout = { offsetX: 0, offsetY: 0, cellSize: 80 };
  private arenaInsets: ArenaInsets = computeArenaInsets();
  private lastState: GameState | null = null;
  private lastSelectedPosition: Position | null = null;
  private dropHover: Position | null = null;
  private showDropTargets = false;
  private onCellClick?: (position: Position) => void;

  constructor(host: HTMLElement) {
    this.app = new Application();
    this.ready = this.init(host);
  }

  private async init(host: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
    });
    host.appendChild(this.app.canvas);

    this.app.stage.addChild(this.boardLayer, this.cardLayer, this.highlightLayer);
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
    this.drawGrid();
  }

  onCellSelected(handler: (position: Position) => void): void {
    this.onCellClick = handler;
  }

  /** Map stage coordinates to a grid cell, if the point is inside the board. */
  hitTestStagePoint(x: number, y: number): Position | null {
    const { offsetX, offsetY, cellSize } = this.gridMetrics;
    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);
    if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) return null;

    const cellX = offsetX + col * cellSize;
    const cellY = offsetY + row * cellSize;
    if (x < cellX || y < cellY || x >= cellX + cellSize || y >= cellY + cellSize) {
      return null;
    }

    return { row, col };
  }

  /** Highlight drop target while dragging a card from the hand. */
  setDropHover(position: Position | null, showTargets = false): void {
    this.dropHover = position;
    this.showDropTargets = showTargets;
    this.refreshHighlights();
  }

  render(state: GameState, selectedPosition: Position | null, interactive: boolean): void {
    const { width, height } = this.app.screen;
    this.arenaInsets = computeArenaInsets();
    this.gridMetrics = computeGridLayout(width, height, this.arenaInsets);
    this.cellSize = this.gridMetrics.cellSize;
    const { offsetX, offsetY } = this.gridMetrics;
    this.lastState = state;
    this.lastSelectedPosition = selectedPosition;

    this.boardLayer.removeChildren();
    this.cardLayer.removeChildren();
    this.highlightLayer.removeChildren();

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const x = offsetX + col * this.cellSize;
        const y = offsetY + row * this.cellSize;
        const empty = !state.grid[row]?.[col];
        const cell = this.drawCell(x, y, empty, interactive && empty);
        if (interactive && empty) {
          cell.on("pointertap", () => this.onCellClick?.({ row, col }));
        }
        this.boardLayer.addChild(cell);
      }
    }

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const card = state.grid[row]?.[col];
        if (!card) continue;
        const x = offsetX + col * this.cellSize;
        const y = offsetY + row * this.cellSize;
        this.cardLayer.addChild(this.drawCard(card, x, y));
      }
    }

    this.refreshHighlights();
  }

  private refreshHighlights(): void {
    this.highlightLayer.removeChildren();
    const state = this.lastState;
    if (!state) return;

    const { offsetX, offsetY, cellSize } = this.gridMetrics;

    if (this.showDropTargets) {
      for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
          if (state.grid[row]?.[col]) continue;
          const x = offsetX + col * cellSize;
          const y = offsetY + row * cellSize;
          const isHover =
            this.dropHover?.row === row && this.dropHover?.col === col;
          const glow = new Graphics()
            .roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 8)
            .stroke({
              color: theme.pixi.highlight,
              width: isHover ? 3 : 1.5,
              alpha: isHover ? 0.95 : 0.35,
            });
          this.highlightLayer.addChild(glow);
        }
      }
    } else if (this.lastSelectedPosition) {
      const { row, col } = this.lastSelectedPosition;
      const x = offsetX + col * cellSize;
      const y = offsetY + row * cellSize;
      const glow = new Graphics()
        .roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 8)
        .stroke({ color: theme.pixi.highlight, width: 3, alpha: 0.9 });
      this.highlightLayer.addChild(glow);
    }
  }

  getArenaInsets(): ArenaInsets {
    return this.arenaInsets;
  }

  private drawGrid(): void {
    // Initial empty draw; render() repaints each update.
  }

  private drawCell(x: number, y: number, empty: boolean, interactive: boolean): Graphics {
    const g = new Graphics()
      .roundRect(x + 3, y + 3, this.cellSize - 6, this.cellSize - 6, 8)
      .fill({
        color: empty ? theme.pixi.bgCellEmpty : theme.pixi.bgCellFilled,
        alpha: 0.95,
      })
      .stroke({ color: theme.pixi.border, width: 1.5, alpha: 0.8 });

    if (interactive) {
      g.eventMode = "static";
      g.cursor = "pointer";
    }
    return g;
  }

  private drawCard(card: BoardCard, x: number, y: number): Container {
    const root = new Container();
    const pad = 6;
    const w = this.cellSize - pad * 2;
    const h = this.cellSize - pad * 2;
    const ownerColor = playerPixi(card.owner);
    const rarityColor = rarityPixi(card.template.rarity);

    const body = new Graphics()
      .roundRect(x + pad, y + pad, w, h, 10)
      .fill({ color: ownerColor, alpha: 0.28 })
      .stroke({ color: rarityColor, width: 2, alpha: 0.95 });
    root.addChild(body);

    const name = new Text({
      text: card.template.name,
      style: {
        fill: theme.pixi.textPrimary,
        fontSize: Math.max(10, this.cellSize * 0.13),
        fontWeight: "700",
        wordWrap: true,
        wordWrapWidth: w - 8,
      },
    });
    name.position.set(x + pad + 4, y + pad + 4);
    root.addChild(name);

    const hp = new Text({
      text: `HP ${card.currentHp}`,
      style: {
        fill: theme.pixi.textSecondary,
        fontSize: Math.max(9, this.cellSize * 0.11),
        fontFamily: "monospace",
      },
    });
    hp.position.set(x + pad + 4, y + pad + h - 18);
    root.addChild(hp);

    this.drawArrows(root, card, x + pad + w / 2, y + pad + h / 2);
    return root;
  }

  private drawArrows(root: Container, card: BoardCard, cx: number, cy: number): void {
    const radius = this.cellSize * 0.34;
    for (const arrow of card.template.arrows) {
      const angle = ((arrow.direction - 2 + 8) % 8) * (Math.PI / 4);
      const ax = cx + Math.cos(angle) * radius;
      const ay = cy + Math.sin(angle) * radius;
      const line = new Graphics()
        .moveTo(cx, cy)
        .lineTo(ax, ay)
        .stroke({ color: theme.pixi.arrow, width: 2, alpha: 0.9 });
      root.addChild(line);

      const label = new Text({
        text: `${arrow.attack}/${arrow.defense}`,
        style: { fill: theme.pixi.arrow, fontSize: 8, fontFamily: "monospace" },
      });
      label.anchor.set(0.5);
      label.position.set(ax, ay);
      root.addChild(label);
    }
  }
}