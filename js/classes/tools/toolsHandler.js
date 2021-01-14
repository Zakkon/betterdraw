import ToolPreviewObj from "./toolPreviewObj";
import BrushTool from "./brushTool";
import DrawTool from "./drawTool";
import { getUserSetting, getSetting } from "../../settings";

export default class ToolsHandler {

  constructor(){
    ToolsHandler.singleton = this;
    this.createAllTools();
  }

  createAllTools() {
    this.tools = [];
    this.tools.push(new BrushTool("brush"));
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
  }
  destroyToolPreviews(){
    for(let i = 0; i < this.toolPreviews.length; ++i)
    {
      let t = this.toolPreviews[i];
      t.destroy();
    }
    this.toolPreviews = [];
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
  getToolPreview(name){
    for(let i = 0; i < this.toolPreviews.length; ++i)
    {
      if(this.toolPreviews[i].name == name){return this.toolPreviews[i];}
    }
    console.error("Could not find a tool preview object with the name " + name);
    return null;
  }

  setActiveTool(toolName) {
    this.clearActiveTool();
    if(toolName=="sceneConfig"){return;}
    this.activeTool = toolName;
    this.setPreviewTint();
    if (toolName === 'brush') {
      this.getToolPreview("ellipse").setActive(true);
      //this.ellipsePreview.visible = true;
      $('#simplefog-brush-controls #brush-size-container').show();
    }
    else {
      $('#simplefog-brush-controls #brush-size-container').hide();
    }
    if (toolName === 'grid') {
      if (canvas.scene.data.gridType === 1) {
        this.boxPreview.width = canvas.scene.data.grid;
        this.boxPreview.height = canvas.scene.data.grid;
        this.boxPreview.visible = true;
      }
      else if ([2, 3, 4, 5].includes(canvas.scene.data.gridType)) {
        //this._initGrid();
        //this.polygonPreview.visible = true;
      }
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

