import { Draw } from '../draw/Draw';

const INPUT_GROUP_INTERVAL = 1000;

export class HistoryManager {
  private undoStack: Array<Function> = [];
  private redoStack: Array<Function> = [];
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
        this.undoStack[this.undoStack.length - 1]();
      }
    }
  }

  public redo() {
    if (this.redoStack.length) {
      const pop = this.redoStack.pop()!;
      this.undoStack.push(pop);
      pop();
    }
  }

  public execute(fn: Function) {
    this.undoStack.push(fn);
    if (this.redoStack.length) {
      this.redoStack = [];
    }
    while (this.undoStack.length > this.maxRecordCount) {
      this.undoStack.shift();
    }
  }

  public replaceLatest(fn: Function) {
    if (this.undoStack.length > 0) {
      this.undoStack[this.undoStack.length - 1] = fn;
    } else {
      this.execute(fn);
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
}
