import "../styles.css";
import { Container } from "pixi.js";
import { GameController, playerLabel } from "../game-controller.js";
import {
  difficultyLabel,
  parseDifficulty,
} from "../match/difficulty.js";
import type { MatchMode } from "../match/types.js";
import { DEFAULT_REALM_ID, requireRealm } from "../realms/index.js";
import { HAND_STRIP_HEIGHT } from "../pixi/arena-layout.js";
import { BoardView } from "../pixi/board-view.js";
import { HandView } from "../pixi/hand-view.js";
import { runHandRevealSequence, type HandRevealStep } from "../ui/hand-reveal-modal.js";
import { bindPanels, renderPanels } from "../ui/panels.js";
import { defaultFooter, mountShell } from "../ui/shell.js";

const params = new URLSearchParams(window.location.search);
const matchMode = (params.get("mode") === "cpu" ? "cpu" : "pvp") satisfies MatchMode;
const realmId = params.get("realm") ?? DEFAULT_REALM_ID;
const difficulty = parseDifficulty(params.get("difficulty"));
const realm = requireRealm(realmId);

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

const modeLabel =
  matchMode === "cpu"
    ? `vs Computer · ${difficultyLabel(difficulty)}`
    : "Hot-seat PvP";

mountShell(
  root,
  {
    activeRoute: "play",
    subtitle: `${realm.name} · ${modeLabel} · Rules v2.0`,
    status: "Dealing cards…",
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
          <div id="action-hint" class="hint">Examining dealt cards…</div>
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

const controller = new GameController({ mode: matchMode, realmId, difficulty });
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

let arenaActive = false;
let revealRunning = false;

function buildRevealSteps(): HandRevealStep[] {
  const { state } = controller.getSnapshot();

  if (matchMode === "cpu") {
    return [
      {
        title: "Your Hand",
        subtitle: `Examine your ${difficultyLabel(difficulty)}-match cards before play begins.`,
        buttonLabel: "Start match",
        cards: state.hands[1],
      },
    ];
  }

  return [
    {
      title: "Player 1 Hand",
      subtitle: "Player 1 — review your cards, then pass the device to Player 2.",
      buttonLabel: "Pass to Player 2",
      cards: state.hands[0],
    },
    {
      title: "Player 2 Hand",
      subtitle: "Player 2 — review your cards. The match begins when you continue.",
      buttonLabel: "Start match",
      cards: state.hands[1],
    },
  ];
}

async function beginMatchWithReveal(): Promise<void> {
  if (revealRunning) return;
  revealRunning = true;
  arenaActive = false;

  await runHandRevealSequence(buildRevealSteps());

  arenaActive = true;
  revealRunning = false;
  syncUi();
}

boardView.onCellSelected((position) => {
  if (!arenaActive) return;
  controller.selectCell(position);
  syncUi();
});

function wireHand(handView: HandView): void {
  handView.onCardSelected((instanceId) => {
    if (!arenaActive) return;
    controller.selectCard(instanceId);
    syncUi();
  });

  handView.configureDrag({
    dragLayer,
    app: boardView.app,
    resolveDropTarget: (globalX, globalY) => {
      if (!arenaActive) return null;
      const local = boardView.app.stage.toLocal({ x: globalX, y: globalY });
      const hit = boardView.hitTestStagePoint(local.x, local.y);
      const snapshot = controller.getSnapshot();
      if (!hit) return null;
      if (snapshot.state.grid[hit.row]?.[hit.col]) return null;
      return hit;
    },
    onDragHover: (position) => {
      if (!arenaActive) return;
      boardView.setDropHover(position, true);
    },
    onDrop: (instanceId, position) => {
      if (!arenaActive) return;
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
  controller.resetMatch({ mode: matchMode, realmId, difficulty });
  void beginMatchWithReveal();
});

let computerTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleComputerTurn(): void {
  if (!arenaActive) return;
  if (computerTimer) clearTimeout(computerTimer);
  if (!controller.isComputerTurn()) return;

  computerTimer = setTimeout(() => {
    computerTimer = null;
    controller.runComputerTurn();
    syncUi();
  }, 450);
}

function syncUi(): void {
  if (!arenaActive) return;

  const snapshot = controller.getSnapshot();
  const { state, phase, selectedCardId, selectedPosition, matchMode: mode } = snapshot;
  const currentPlayer = state.currentPlayer;
  const humanPlayer = snapshot.humanPlayer;
  const interactiveBoard =
    phase === "select_cell" && !controller.isComputerPlayer(currentPlayer);
  const interactiveHand =
    phase === "select_card" && !state.pending && currentPlayer === humanPlayer;
  const screenWidth = boardView.app.screen.width;
  const screenHeight = boardView.app.screen.height;

  boardView.render(state, selectedPosition, interactiveBoard);

  stageOverlay.removeChildren();

  const topLabel = playerLabel(0, mode);
  const bottomLabel = playerLabel(1, mode);
  const hideTopHand = mode === "cpu";

  handTop.render(
    state.hands[0],
    0,
    currentPlayer === 0 ? selectedCardId : null,
    currentPlayer === 0 && interactiveHand,
    screenWidth,
    {
      dimmed: currentPlayer !== 0,
      label: topLabel,
      hidden: hideTopHand,
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
      label: bottomLabel,
    },
  );
  handBottom.root.position.set(0, screenHeight - HAND_STRIP_HEIGHT);
  stageOverlay.addChild(handBottom.root);

  renderPanels(panels, snapshot, {
    onMode: (pick) => {
      controller.chooseMode(pick);
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

  scheduleComputerTurn();
}

boardView.app.renderer.on("resize", () => {
  syncUi();
});

void boardView.ready.then(() => {
  void beginMatchWithReveal();
});