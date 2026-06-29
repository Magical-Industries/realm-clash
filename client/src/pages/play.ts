import "../styles.css";
import { Container } from "pixi.js";
import { GameController } from "../game-controller.js";
import { HAND_STRIP_HEIGHT } from "../pixi/arena-layout.js";
import { BoardView } from "../pixi/board-view.js";
import { HandView } from "../pixi/hand-view.js";
import { bindPanels, renderPanels } from "../ui/panels.js";
import { defaultFooter, mountShell } from "../ui/shell.js";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

mountShell(
  root,
  {
    activeRoute: "play",
    subtitle: "Local hot-seat · Rules v2.0",
    status: "Loading…",
    showBottomNav: false,
    marketingBackground: false,
    headerActions: `<button id="new-game" type="button" class="btn btn--ghost btn--sm">New game</button>`,
  },
  `
    <div class="arena-layout">
      <section class="stage-wrap">
        <div id="pixi-host"></div>
      </section>
      <aside class="sidebar">
        <section class="panel">
          <h2 class="label">Actions</h2>
          <div id="action-hint" class="hint">Select a card from your hand.</div>
          <div id="mode-actions" class="mode-actions hidden"></div>
          <div id="chain-actions" class="chain-actions hidden"></div>
        </section>
        <section class="panel">
          <h2 class="label">Scores</h2>
          <div id="scores" class="scores"></div>
        </section>
        <section class="panel panel-grow">
          <h2 class="label">Event log</h2>
          <ol id="event-log" class="event-log"></ol>
        </section>
      </aside>
    </div>
  `,
  defaultFooter(),
);

const controller = new GameController();
const panels = bindPanels();

const host = document.getElementById("pixi-host");
if (!host) {
  throw new Error("#pixi-host not found");
}

const boardView = new BoardView(host);
const handTop = new HandView();
const handBottom = new HandView();
const stageOverlay = new Container();
const dragLayer = new Container();

boardView.app.stage.addChild(stageOverlay, dragLayer);

boardView.onCellSelected((position) => {
  controller.selectCell(position);
  syncUi();
});

function wireHand(handView: HandView): void {
  handView.onCardSelected((instanceId) => {
    controller.selectCard(instanceId);
    syncUi();
  });

  handView.configureDrag({
    dragLayer,
    app: boardView.app,
    resolveDropTarget: (globalX, globalY) => {
      const local = boardView.app.stage.toLocal({ x: globalX, y: globalY });
      const hit = boardView.hitTestStagePoint(local.x, local.y);
      const snapshot = controller.getSnapshot();
      if (!hit) return null;
      if (snapshot.state.grid[hit.row]?.[hit.col]) return null;
      return hit;
    },
    onDragHover: (position) => {
      boardView.setDropHover(position, true);
    },
    onDrop: (instanceId, position) => {
      if (position) {
        controller.placeFromHand(instanceId, position);
      }
      boardView.setDropHover(null, false);
      syncUi();
    },
  });
}

wireHand(handTop);
wireHand(handBottom);

panels.newGameButton.addEventListener("click", () => {
  controller.resetMatch();
  syncUi();
});

function syncUi(): void {
  const snapshot = controller.getSnapshot();
  const { state, phase, selectedCardId, selectedPosition } = snapshot;
  const currentPlayer = state.currentPlayer;
  const interactiveBoard = phase === "select_cell";
  const interactiveHand = phase === "select_card" && !state.pending;
  const screenWidth = boardView.app.screen.width;
  const screenHeight = boardView.app.screen.height;

  boardView.render(state, selectedPosition, interactiveBoard);

  stageOverlay.removeChildren();

  handTop.render(
    state.hands[0],
    0,
    currentPlayer === 0 ? selectedCardId : null,
    currentPlayer === 0 && interactiveHand,
    screenWidth,
    {
      dimmed: currentPlayer !== 0,
      label: "Player 1",
    },
  );
  handTop.root.position.set(0, 0);
  stageOverlay.addChild(handTop.root);

  handBottom.render(
    state.hands[1],
    1,
    currentPlayer === 1 ? selectedCardId : null,
    currentPlayer === 1 && interactiveHand,
    screenWidth,
    {
      dimmed: currentPlayer !== 1,
      label: "Player 2",
    },
  );
  handBottom.root.position.set(0, screenHeight - HAND_STRIP_HEIGHT);
  stageOverlay.addChild(handBottom.root);

  renderPanels(panels, snapshot, {
    onMode: (mode) => {
      controller.chooseMode(mode);
      syncUi();
    },
    onChain: (option) => {
      controller.chooseChain({
        attackerInstanceId: option.attackerInstanceId,
        direction: option.direction,
      });
      syncUi();
    },
  });
}

boardView.app.renderer.on("resize", () => {
  syncUi();
});

void boardView.ready.then(() => {
  syncUi();
});