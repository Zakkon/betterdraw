import { getUserSetting } from "../../settings";
import { getDrawLayer, pixelPosToWorldPos, webToHex } from "../../helpers"
import DrawTool from "./drawTool";
import ToolsHandler from "./toolsHandler";
import Color32 from "../color32";
import { PaintSyncer } from "./paintSyncer";
import { NetSyncer } from "../netSyncer";
import BrushTool from "./brushTool";
import { LayerSettings } from "../layerSettings";

export default class RectTool extends DrawTool {
    
    constructor(name){ //string
        super(name);
        this.lastPos = {x:-9999,y:-9999};
        this.brushColor = new Color32(255,0,0,255);
        this.brushSize = 1;
        this.dragStart = {x:0, y:0};
        this.dragCurrent = {x:0, y:0};
    }

    onPointerDown(p, pixelPos, e) {
        let color = getUserSetting('brushColor')
        if(color==undefined) { color = "#ff0000" };
        color = webToHex(color);
        color = Color32.fromHex(color);
        this.brushColor = color;
        this.brushSize = getUserSetting('brushSize');

        if(!this.op) { this.beginStroke(); }
        this.op = true;
        this.dragStart = {x:pixelPos.x, y:pixelPos.y};
    }
    onPointerMove(p, pixelPos, e) {
        //Todo: check if mouse is still down. If not, interrupt

        const preview = this.getPreviewObj();
        // If drag operation has started
        if (this.op) {
            if(pixelPos.x==this.lastPos.x && pixelPos.y==this.lastPos.y){ this.lastPos = {x:pixelPos.x, y:pixelPos.y}; return;} //Simple checker to make sure that cursor has moved
            this.lastPos = {x:pixelPos.x, y:pixelPos.y};
            this.dragCurrent = this.lastPos;
            let rect = this.getRect();
            const wp = pixelPosToWorldPos({x:rect.x, y:rect.y});
            this.positionCursor(preview, wp.x, wp.y, rect.width, rect.height);
        }
       
    }
    onPointerUp(p,e) {
        this.interruptStroke();
        this.op = false;
    }
    getPreviewObj(){ return ToolsHandler.singleton.getToolPreview("rect"); }
    beginStroke(){
        this.op = true;
        const isCellMode = false; //find from somewhere
        const brushSize = 1;//getUserSetting('brushSize');
        if(!this.brushColor){console.log("BrushColor is undefined!");}
        //Draw rect shape here with the preview obj, but dont start an actual stroke yet
    }
    interruptStroke(){
        if(this.op) {
            //Create the stroke and send it to syncer
            let rect = this.getRect();
            this.syncer.LogRect(rect.x, rect.y, rect.width, rect.height, 1, this.brushColor);
        }
        this.op = false;
        this.positionCursor(this.getPreviewObj(), 0,0,0,0);
    }
    positionCursor(cursor, x, y, width, height){
        cursor.transform.scale.x = 1;
        cursor.transform.scale.y = 1;
        cursor.width = ((width * LayerSettings.sceneWidthPerGrid) / cursor.parent.transform.scale.x) / LayerSettings.pixelsPerGrid;
        cursor.height = ((height * LayerSettings.sceneWidthPerGrid) / cursor.parent.transform.scale.y) / LayerSettings.pixelsPerGrid;
        cursor.x = x;
        cursor.y = y;
    }
    getRect(){
        let fromX = this.dragStart.x < this.dragCurrent.x? this.dragStart.x : this.dragCurrent.x;
        let fromY = this.dragStart.y < this.dragCurrent.y? this.dragStart.y : this.dragCurrent.y;
        let width = Math.abs(this.dragCurrent.x - this.dragStart.x);
        let height = Math.abs(this.dragCurrent.y - this.dragStart.y);
        return {x:fromX, y:fromY, width: width, height: height};
    }
}