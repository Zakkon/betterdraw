import ToolPreviewObj from "./toolPreviewObj";
import BrushTool from "./brushTool";
import DrawTool from "./drawTool";
import { getUserSetting, getSetting } from "../../settings";
import RectTool from "./rectTool";
import GridBrushTool from "./gridBrushTool";
import EyedropperTool from "./eyedropperTool";
import { getDrawLayer } from "../../helpers";

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
  }

  /**
   * Define all new tools
   */
  createAllTools() {
    this.tools = [];
    this.tools.push(new BrushTool("brush", "circle"));
    this.tools.push(new GridBrushTool("grid", "grid"));
    this.tools.push(new RectTool("rect", "rect"));
    this.tools.push(new EyedropperTool("eyedropper", "eyedropper"));
    this.activeTool = "brush";
    this.toolPreviews = [];
  }

  /**
   * Creates new tool preview objects.
   */
  createToolPreviews(layerobj) {
    //Destroy any objs of they are already existing
    this.destroyToolPreviews();

    let ellipse = new ToolPreviewObj("ellipse");
    ellipse.setActive(false);
    layerobj.addChild(ellipse);
    this.toolPreviews.push(ellipse);

    let grid = new ToolPreviewObj("grid");
    grid.setActive(false);
    layerobj.addChild(grid);
    this.toolPreviews.push(grid);

    let rect = new ToolPreviewObj("rect");
    rect.setActive(false);
    layerobj.addChild(rect);
    this.toolPreviews.push(rect);
  }

  /**
   * Destroys the tool preview objects.
   */
  destroyToolPreviews(){
    for(let i = 0; i < this.toolPreviews.length; ++i)
    {
      let t = this.toolPreviews[i];
      if(t){t.destroy();}
    }
    this.toolPreviews = [];
  }
  
  /**
   * Sanity check function that validates the health of the tool preview objects
   */
  validateHealth(){
    //Check that our tool previews exist
    if(this.toolPreviews==null||this.toolPreviews==undefined||this.toolPreviews.length<1){
      //Our tool previews are missing for some reason. Time to reconstruct them
      console.error("Tool Preview Objs seem to have been destroyed! Repairing...");
      let layer = getDrawLayer();
      this.createToolPreviews(layer);
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
   * Get the tool preview object of the specified tool
   * @param {string} toolName
   * @return {ToolPreviewObj}
   */
  getToolPreview(toolName) {
    this.validateHealth();
    for(let i = 0; i < this.toolPreviews.length; ++i)
    {
      if(this.toolPreviews[i].name == toolName){return this.toolPreviews[i];}
    }
    console.error("Could not find a tool preview object with the name " + toolName+". Tool previews available are: ");
    console.error(this.toolPreviews);
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
    this.setPreviewTint();

    //Only show the Brush Size dropdown when certain tools are active
    if(toolName=="brush" || toolName=="grid") { $('#brushsize_container').show(); }
    else{ $('#brushsize_container').hide(); }

    //Brush drawing tool
    if (toolName === 'brush') { this.getToolPreview("ellipse").setActive(true); }
    //Grid drawing tool
    if (toolName === 'grid') {
      if (canvas.scene.data.gridType === 1) { //We only work with square grids for now
        this.getToolPreview("grid").setActive(true);
      }
      //Other gridtypes (TODO?)
      /* else if ([2, 3, 4, 5].includes(canvas.scene.data.gridType)) {
        //this._initGrid();
        //this.polygonPreview.visible = true;
      } */
    }
    //Rect drawing tool
    if(toolName==='rect') { this.getToolPreview("rect").setActive(true);  }
  }

  /**
  * Deactivates tool preview objects, and sets activeTool to NONE
  */
  clearActiveTool() {
    //Deactivate all tool previews
    for(let i = 0; i < this.toolPreviews.length; ++i)
    { this.toolPreviews[i].setActive(false); }
    this.activeTool = "NONE";
  }

  /**
   * Set the tint of the tool preview objects to its default value.
   */
  setPreviewTint() {
    const vt = getSetting('vThreshold');
    const bo = 1;//hexToPercent(this.getUserSetting('brushOpacity')) / 100;
    let tint = 0xFF0000;
    if (bo < vt) tint = 0x00FF00;
    for(let i = 0; i < this.toolPreviews.length; ++i)
    { this.toolPreviews[i].tint = tint; }
  }
}

