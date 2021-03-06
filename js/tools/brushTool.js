import { brushSizeIsDiameter, getUserSetting } from "../settings";
import { getDrawLayer, webToHex } from "../helpers"
import DrawTool from "./drawTool";
import ToolsHandler from "./toolsHandler";
import Color32 from "../color32";
import { LayerSettings } from "../layer/layerSettings";

export default class BrushTool extends DrawTool {
    
    constructor(name, type){ //string
        super(name);
        this.type = type;
        this.lastPos = {x:-9999,y:-9999};
        this.brushColor = new Color32(255,0,0,255);
        this.brushSize = 1;
    }

    onPointerDown(p, pixelPos,e) {
        let color = getUserSetting('brushColor');
        if(color==undefined) { color = "#ff0000" };
        color = webToHex(color);
        color = Color32.fromHex(color);
        this.brushColor = color;
        this.brushSize = getUserSetting('brushSize');

        if(!this.op) { this.beginStroke(); }
        this.op = true;
        
    }
    onPointerMove(p, pixelPos, e) {
        const size = getUserSetting('brushSize');
        //Move the brush cursor object
        const cursorObj = this.getCursorObj();
        this.positionCursor(cursorObj, p.x, p.y, size, size);

        //If we have begun our stroke
        if (this.op) {
            if(pixelPos.x==this.lastPos.x && pixelPos.y==this.lastPos.y){ this.lastPos = {x:pixelPos.x, y:pixelPos.y}; return;} //Simple checker to make sure that cursor has moved
            this.lastPos = {x:pixelPos.x, y:pixelPos.y};
            //Add these coordinates to the stroke
            this.syncer.LogStrokeStep(pixelPos.x, pixelPos.y);
        }
    }
    onPointerUp(p, pixelPos,e) {
        this.interruptStroke();
        this.op = false;
    }
    getCursorObj(){
        return ToolsHandler.singleton.getToolCursor("ellipse");
    }

    beginStroke() {
        this.op = true;
        const isCellMode = false; //find from somewhere
        const brushSize = getUserSetting('brushSize');
        if(!this.brushColor){console.log("BrushColor is undefined!");}
        //Start a new stroke. We will add coordinates to this stroke with LogStrokeStep later
        this.syncer.LogStrokeStart(this.type, this.brushColor, brushSize);
    }
    interruptStroke(){
        if(this.op){ this.syncer.LogStrokeEnd(); } //logHistory();
        this.op = false;
    }
    positionCursor(cursor, x, y, width, height){
        cursor.transform.scale.x = 1;
        cursor.transform.scale.y = 1;
        cursor.width = ((width * LayerSettings.sceneWidthPerGrid) / cursor.parent.transform.scale.x) / LayerSettings.pixelsPerGrid;
        cursor.height = ((height * LayerSettings.sceneWidthPerGrid) / cursor.parent.transform.scale.y) / LayerSettings.pixelsPerGrid;
        cursor.x = x;
        cursor.y = y;
    }
}