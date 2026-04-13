import { Draw } from '../draw/Draw';

const INPUT_GROUP_INTERVAL = 1000;

interface IHistoryEntry {
  restore: Function;
}

export class HistoryManager {
  private undoStack: IHistoryEntry[] = [];
  private redoStack: IHistoryEntry[] = [];
  private maxRecordCount: number;
  private lastInputTime: number = 0;

  constructor(draw: Draw) {
    this.maxRecordCount = draw.getOptions().historyMaxRecordCount + 1;
  }

  public undo() {
    if (this.undoStack.length > 1) {
      const pop = this.undoStack.pop()!;
      this.redoStack.push(pop);
      if (this.undoStack.length) {
        this.undoStack[this.undoStack.length - 1].restore();
      }
    }
  }

  public redo() {
    if (this.redoStack.length) {
      const pop = this.redoStack.pop()!;
      this.undoStack.push(pop);
      pop.restore();
    }
  }

  public execute(entry: IHistoryEntry | Function) {
    this.undoStack.push(this._normalizeEntry(entry));
    if (this.redoStack.length) {
      this.redoStack = [];
    }
    while (this.undoStack.length > this.maxRecordCount) {
      this.undoStack.shift();
    }
  }

  public replaceLatest(entry: IHistoryEntry | Function) {
    const normalizedEntry = this._normalizeEntry(entry);
    if (this.undoStack.length > 0) {
      this.undoStack[this.undoStack.length - 1] = normalizedEntry;
    } else {
      this.execute(normalizedEntry);
    }
    if (this.redoStack.length) {
      this.redoStack = [];
    }
  }

  public isInputGroupable(): boolean {
    return Date.now() - this.lastInputTime < INPUT_GROUP_INTERVAL;
  }

  public recordInputTime() {
    this.lastInputTime = Date.now();
  }

  public resetInputTime() {
    this.lastInputTime = 0;
  }

  public isCanUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public isCanRedo(): boolean {
    return !!this.redoStack.length;
  }

  public isStackEmpty(): boolean {
    return !this.undoStack.length && !this.redoStack.length;
  }

  public recovery() {
    this.undoStack = [];
    this.redoStack = [];
  }

  public popUndo() {
    return this.undoStack.pop();
  }

  private _normalizeEntry(entry: IHistoryEntry | Function): IHistoryEntry {
    if (typeof entry === 'function') {
      return {
        restore: entry
      };
    }
    return entry;
  }
}
