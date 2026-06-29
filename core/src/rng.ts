import type { Rng } from "./types.js";

/** Deterministic RNG for tests and replays. */
export class SeededRng implements Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  rollDie(sides: number): number {
    if (sides < 1) throw new Error("sides must be >= 1");
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return (this.state % sides) + 1;
  }
}

/** Fair Math.random-based roller for live play. */
export class RandomRng implements Rng {
  rollDie(sides: number): number {
    if (sides < 1) throw new Error("sides must be >= 1");
    return Math.floor(Math.random() * sides) + 1;
  }
}

/** Returns dice in order for each rollDie call. */
export class ScriptedRng implements Rng {
  private index = 0;

  constructor(private readonly rolls: number[]) {}

  rollDie(sides: number): number {
    const value = this.rolls[this.index];
    if (value === undefined) {
      throw new Error(`ScriptedRng exhausted at roll ${this.index}`);
    }
    if (value < 1 || value > sides) {
      throw new Error(`Scripted roll ${value} out of range 1..${sides}`);
    }
    this.index += 1;
    return value;
  }
}