import Color32 from "../color32";
import { NetSyncer } from "../netSyncer";
import { RectStroke, Stroke } from "./stroke";
import { StrokePart } from "./strokePart";

export class PaintSyncer {

    constructor() {
        this.strokes = [];
    }
    /**
     * @return {Stroke}
     */
    get activeStroke() {return this.strokes[this.strokes.length-1];}
    /**
     * 
     * @param {Color32} color 
     * @param {number} brushSize 
     */
    LogBrushStart(color, brushSize) {
        this.strokes.forEach(function(s){s.isActive=false;});
        var stroke = new Stroke(brushSize, color, false);
        stroke.isActive = true;
        this.strokes.push(stroke);
    }
    /**
     * 
     * @param {Color32} color 
     * @param {number} brushSize 
     */
    LogBrushStart_Cells(color, brushSize){
        this.strokes.forEach(function(s){s.isActive=false;});
        var stroke = new Stroke(brushSize, color, true); stroke.isActive = true;
        this.strokes.push(stroke);
    }
    /**
     * Log a point in the stroke.
     * @param {number} x 
     * @param {number} y 
     */
    LogBrushStep(x, y) { //integers
        if(this.strokes.length<1){return;}
        this.activeStroke.AddCoords({x:x, y:y});
    }
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {{cellRealSize:number}} gridSettings 
     */
    LogBrushStep_Cells(pixelX, pixelY, gridSettings){
        if(this.strokes.length<1){return;}
        const cX = Math.floor(pixelX / gridSettings.cellRealSize);
        const cY = Math.floor(pixelY / gridSettings.cellRealSize);
        this.activeStroke.AddCoords({x:cX, y:cY});
    }
    LogBrushEnd(){
        if(this.strokes.length<1){return;}
        this.activeStroke.isActive = false;
        NetSyncer.onStrokeEnd();
    }
    LogRect(fromX, fromY, width, height, cellBased, brushSize, color){
        this.strokes.forEach(function(s){s.isActive=false;});
        var stroke = new RectStroke("rect", brushSize, color, cellBased, fromX, fromyY, width, height);
        this.strokes.push(stroke);
    }
    /**
     * @return {{type:string, color:Color32, cellBased:boolean}[]}
     */
    GetReadyStrokeParts(){
        var parts = [];
        //Try to find strokes or parts of strokes that are waiting to be synced across the network
        //Start from the oldest ones
        for(let i = 0; i < this.strokes.length; ++i)
        {
            let stroke = this.strokes[i];
            if(stroke.type=="circle") {
                parts.push({type:stroke.type, xyCoords: stroke.GetSteps(false), color:stroke.color, brushSize:stroke.brushSize, cellBased: stroke.cellBased});
            }
            else if(stroke.type == "rect") {
                parts.push({type: stroke.type, x:stroke.x, y:stroke.y, width:stroke.width, height:stroke.height, color:stroke.color, cellBased:stroke.cellBased});
            }
            //Delete the entire stroke if its empty and not the active stroke
            if(this.strokes[i].isEmpty && !this.strokes[i].isActive){
                //Delete this stroke, its spent
                const s = this.strokes.splice(i,1); i = i -1;
                NetSyncer.LogPastStrokes(s);
            }
        }
        return parts;
    }
}