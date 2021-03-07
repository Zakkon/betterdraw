import ToolCursor from "./toolCursor";
import BrushTool from "./brushTool";
import DrawTool from "./drawTool";
import { getUserSetting, getSetting } from "../settings";
import RectTool from "./rectTool";
import GridBrushTool from "./gridBrushTool";
import EyedropperTool from "./eyedropperTool";
import { getDrawLayer } from "../helpers";
import { PaintSyncer } from "../syncing/paintSyncer";
import { NetSyncer } from "../netSyncer";

export default class ToolsHandler {

  /**
   * @returns {ToolsHandler}
   */
  static get singleton()
  {
    let th = canvas.betterDraw_ToolsHandler;
    if(th==null) { console.error("ToolsHandler singleton is null!"); }
    return th;
  }
  constructor(){
    //Where do we store the singleton?
    canvas.betterDraw_ToolsHandler = this;
    this.createAllTools();
    
    this.syncer = new PaintSyncer();
    let ticker = PIXI.Ticker.shared;
    var fr = this.partial(this.renderStack, this.syncer, canvas);
    ticker.add(fr);
  }
  partial(func /*, 0..n args */) {
    var args = Array.prototype.slice.call(arguments).splice(1);
    return function() {
      var allArguments = args.concat(Array.prototype.slice.call(arguments));
      return func.apply(this, allArguments);
    };
  }

  /**
   * Rendering update loop
   * @param {PaintSyncer} syncer 
   * @param {any} canvas 
   */
  renderStack(syncer, canvas) {
      /*We want to draw strokes here, so we need their data
      But a stroke might be too large or too complex to draw all at once, so we will fetch parts of it (as large as we can manage) at a atime
      */
      var parts = syncer.GetReadyStrokeParts();
      if(parts===undefined||parts.length<1) { return; }
      const pm = getDrawLayer().pixelmap;
      pm.DrawStrokeParts(parts);
      NetSyncer.CmdSendStrokeUpdates(parts);
  }

  /**
   * Create all the different tools and set one as active.
   */
  createAllTools() {
    this.tools = [];
    this.tools.push(new BrushTool("brush", "circle"));
    this.tools.push(new GridBrushTool("grid", "grid"));
    this.tools.push(new RectTool("rect", "rect"));
    this.tools.push(new EyedropperTool("eyedropper", "eyedropper"));
    this.activeTool = "brush";
    this.toolCursors = [];
  }

  
  
  /**
   * Sanity check function that validates the health of the tool cursor objects
   */
  validateHealth(){
    //Check that our tool cursror exist
    if(this.toolCursors==null||this.toolCursors==undefined||this.toolCursors.length<1){
      //Our tool cursors are missing for some reason. Time to reconstruct them
      console.error("Tool Cursor Objs seem to have been destroyed! Repairing...");
      let layer = getDrawLayer();
      this.createToolCursors(layer);
    }
    
  }

  /**
   * Returns the active tool
   * @returns {DrawTool}
   */
  get curTool() { if(this.activeTool=="NONE"){return null;} return this.getTool(this.activeTool); }

  /**
   * Fetches a DrawTool by matching its name to toolName
   * @param {string} toolName
   * @return {DrawTool}
   */
  getTool(toolName){
    for(let i = 0; i < this.tools.length; ++i)
    {
      if(this.tools[i].name == toolName) { return this.tools[i]; }
    }
    console.error("Could not find a tool with the name " + toolName);
    return null;
  }

  

  /**
   * Sets the active drawing tool.
   * @param {string} toolName 
   */
  setActiveTool(toolName) {
    this.clearActiveTool();
    if(toolName=="sceneConfig") { return; }
    this.activeTool = toolName;
    this.setToolCursorTint();

    //Only show the certain UI when certain tools are active
    let showPalettePickerUI = toolName == "brush" || toolName == "grid" || toolName == "rect";
    let showColorPickerUI = showPalettePickerUI;
    let showBrushSizeUI = toolName == "brush" || toolName == "grid";

    if(showBrushSizeUI) { $('#brushsize_container').show(); }
    else { $('#brushsize_container').hide(); }
    if(showColorPickerUI) { $('#brush-color').show(); }
    else { $('#brush-color').hide(); }
    if(showPalettePickerUI) { $('#color-palette-expand-btn').show(); $('#color-palette-grid').show(); }
    else { $('#color-palette-expand-btn').hide(); $('#color-palette-grid').hide();}

    //Brush drawing tool
    if (toolName === 'brush') { this.getToolCursor("ellipse").setActive(true); }
    //Grid drawing tool
    if (toolName === 'grid') {
      //WARNING: Only works for square grids at the moment.
      //TODO: Display a warning message that this tool doesn't support hex grids.
      this.getToolCursor("grid").setActive(true);
    }
    //Rect drawing tool
    if(toolName==='rect') { this.getToolCursor("rect").setActive(true);  }
  }

  /**
  * Deactivates tool cursor objects, and sets activeTool to NONE
  */
  clearActiveTool() {
    //Deactivate all tool cursors
    for(let i = 0; i < this.toolCursors.length; ++i)
    { this.toolCursors[i].setActive(false); }
    this.activeTool = "NONE";
  }

  //#region Tool Cursors
  /**
   * Creates new tool cursor objects.
   */
   createToolCursors(layerobj) {
    //Destroy any objs of they are already existing
    this.destroyToolCursors();

    let ellipse = new ToolCursor("ellipse");
    ellipse.setActive(false);
    layerobj.addChild(ellipse);
    this.toolCursors.push(ellipse);

    let grid = new ToolCursor("grid");
    grid.setActive(false);
    layerobj.addChild(grid);
    this.toolCursors.push(grid);

    let rect = new ToolCursor("rect");
    rect.setActive(false);
    layerobj.addChild(rect);
    this.toolCursors.push(rect);

    this.setToolCursorTint();
  }

  /**
   * Destroys the tool cursor objects.
   */
  destroyToolCursors(){
    for(let i = 0; i < this.toolCursors.length; ++i)
    {
      let t = this.toolCursors[i];
      if(t){t.destroy();}
    }
    this.toolCursors = [];
  }
  /**
   * Get the tool cursor object of the specified tool
   * @param {string} toolName
   * @return {ToolCursor}
   */
   getToolCursor(toolName) {
    this.validateHealth();
    for(let i = 0; i < this.toolCursors.length; ++i)
    {
      if(this.toolCursors[i].name == toolName){return this.toolCursors[i];}
    }
    console.error("Could not find a tool cursor object with the name " + toolName+". Tool cursors available are: ");
    console.error(this.toolCursors);
    return null;
  }
  /**
   * Set the tint of the tool cursor objects to its default value.
   */
  setToolCursorTint() {
    const vt = getSetting('vThreshold');
    const bo = 1;
    let tint = 0xFF0000;
    if (bo < vt) tint = 0x00FF00;
    for(let i = 0; i < this.toolCursors.length; ++i)
    { this.toolCursors[i].tint = tint; }
  }
  //#endregion


}

