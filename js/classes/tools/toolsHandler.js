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
    if(th==null){console.error("ToolsHandler singleton is null!");}
    return th;
  }
  //Where do we store the singleton?

  constructor(){
    canvas.betterDraw_ToolsHandler = this;
    this.createAllTools();
  }

  createAllTools() {
    this.tools = [];
    this.tools.push(new BrushTool("brush", "circle"));
    this.tools.push(new GridBrushTool("grid", "grid"));
    this.tools.push(new RectTool("rect", "rect"));
    this.tools.push(new EyedropperTool("eyedropper", "eyedropper"));
    this.activeTool = "brush";
    this.toolPreviews = [];
  }
  createToolPreviews(layerobj) {
    //Destroy any objs of they are already existing
    this.destroyToolPreviews();
    console.log("Creating tool preview objs");

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
  destroyToolPreviews(){
    for(let i = 0; i < this.toolPreviews.length; ++i)
    {
      let t = this.toolPreviews[i];
      if(t){t.destroy();}
      
    }
    this.toolPreviews = [];
  }
  validateHealth(){
    //Check that our tool previews exist
    if(this.toolPreviews==null||this.toolPreviews==undefined||this.toolPreviews.length<1){
      //Our tool previews are missing for some reason. Time to reconstruct them
      console.error("Tool Preview Objs seem to have been destroyed! Repairing...");
      let layer = getDrawLayer();
      this.createToolPreviews(layer);
    }
    
  }
  get curTool(){return this.getTool(this.activeTool);}

  getTool(name){
    for(let i = 0; i < this.tools.length; ++i)
    {
      if(this.tools[i].name == name){return this.tools[i];}
    }
    console.error("Could not find a tool with the name " + name);
    return null;
  }
  /**
   * 
   * @param {string} name
   * @return {ToolPreviewObj}
   */
  getToolPreview(name) {
    this.validateHealth();
    for(let i = 0; i < this.toolPreviews.length; ++i)
    {
      if(this.toolPreviews[i].name == name){return this.toolPreviews[i];}
    }
    console.error("Could not find a tool preview object with the name " + name+". Tool previews available are: ");
    console.error(this.toolPreviews);
    return null;
  }

  /**
   * 
   * @param {string} toolName 
   */
  setActiveTool(toolName) {
    this.clearActiveTool();
    if(toolName=="sceneConfig") { return; }
    this.activeTool = toolName;
    this.setPreviewTint();
    //Ellipse shaped brush
    if (toolName === 'brush') {
      this.getToolPreview("ellipse").setActive(true);
      //this.ellipsePreview.visible = true;
      $('#betterdraw-brush-controls #brush-size-container').show();
    }
    else {
      $('#betterdraw-brush-controls #brush-size-container').hide();
    }
    //Grid shaped brush
    if (toolName === 'grid') {
      if (canvas.scene.data.gridType === 1) { //We only work with square grids for now
        this.getToolPreview("grid").setActive(true);
        /* this.boxPreview.width = canvas.scene.data.grid;
        this.boxPreview.height = canvas.scene.data.grid;
        this.boxPreview.visible = true; */
      }
      else if ([2, 3, 4, 5].includes(canvas.scene.data.gridType)) {
        //this._initGrid();
        //this.polygonPreview.visible = true;
      }
    }

    if(toolName==='rect'){
      this.getToolPreview("rect").setActive(true);
    }
    else {

    }
  }
/**
     * Aborts any active drawing tools
     */
  clearActiveTool() {
    for(let i = 0; i < this.toolPreviews.length; ++i)
    {
      this.toolPreviews[i].setActive(false);
    }

      // Box preview
      //this.boxPreview.visible = false;
      // Ellipse Preview
      //this.ellipsePreview.visible = false;
      // Shape preview
      //this.polygonPreview.clear();
      //this.polygonPreview.visible = false;
      //this.polygonHandle.visible = false;
      this.polygon = [];
      // Cancel op flag
      this.op = false;
  }
  setPreviewTint() {
    const vt = getSetting('vThreshold');
    const bo = 1;//hexToPercent(this.getUserSetting('brushOpacity')) / 100;
    let tint = 0xFF0000;
    if (bo < vt) tint = 0x00FF00;
    for(let i = 0; i < this.toolPreviews.length; ++i)
    {
      this.toolPreviews[i].tint = tint;
    }
    //this.ellipsePreview.tint = tint;
    //this.boxPreview.tint = tint;
    //this.polygonPreview.tint = tint;
  }
}

