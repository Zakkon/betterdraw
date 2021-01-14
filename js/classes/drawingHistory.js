export default class DrawingHistory {

    constructor() {
        this.historyBuffer = [];
        this.history = [];
        this.lock = false;
    }

    /**
   * Add buffered history stack to scene flag and clear buffer
   */
    async commitHistory() {
    // Do nothing if no history to be committed, otherwise get history
    if (this.historyBuffer.length === 0) return;
    if (this.lock) { return; }
    this.lock = true;
    let history = canvas.scene.getFlag("betterdraw", "history");

    // If history storage doesnt exist, create it
    if (!history) { history = { events: [], pointer: 0,  }; }

    // If pointer is less than history length (f.x. user undo), truncate history
    history.events = history.events.slice(0, history.pointer);

    // Push the new history buffer to the scene
    history.events.push(this.historyBuffer);
    history.pointer = history.events.length;

    await canvas.scene.unsetFlag("betterdraw", "history");
    await this.setSetting("history", history);
    //simplefogLog(`Pushed ${this.historyBuffer.length} updates.`);
    console.log("Pushed " + this.historyBuffer.length + " updates");
    // Clear the history buffer
    this.historyBuffer = [];
    this.lock = false;
    }
    clearBuffer(){
        this.historyBuffer = [];
    }
}