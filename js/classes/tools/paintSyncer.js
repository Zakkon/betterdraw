import Color32 from "../color32";
import { NetSyncer } from "../netSyncer";
import { Stroke } from "./stroke";
import { StrokePart } from "./strokePart";

export class PaintSyncer {

    constructor() {
        this.activeStrokes = [];
    }
    /**
     * @return {Stroke}
     */
    get activeStroke() {return this.activeStrokes[this.activeStrokes.length-1];}
    /**
     * 
     * @param {Color32} color 
     * @param {number} brushSize 
     */
    LogBrushStart(color, brushSize) {
        this.activeStrokes.forEach(function(s){s.isActive=false;});
        var stroke = new Stroke(brushSize, color, false);
        stroke.isActive = true;
        this.activeStrokes.push(stroke);
    }
    /**
     * 
     * @param {Color32} color 
     * @param {number} brushSize 
     */
    LogBrushStart_Cells(color, brushSize){
        this.activeStrokes.forEach(function(s){s.isActive=false;});
        var stroke = new Stroke(brushSize, color, true); stroke.isActive = true;
        this.activeStrokes.push(stroke);
    }
    /**
     * Log a point in the stroke.
     * @param {number} x 
     * @param {number} y 
     */
    LogBrushStep(x, y) { //integers
        if(this.activeStrokes.length<1){return;}
        this.activeStroke.AddCoords({x:x, y:y});
    }
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {{cellRealSize:number}} gridSettings 
     */
    LogBrushStep_Cells(pixelX, pixelY, gridSettings){
        if(this.activeStrokes.length<1){return;}
        const cX = Math.floor(pixelX / gridSettings.cellRealSize);
        const cY = Math.floor(pixelY / gridSettings.cellRealSize);
        this.activeStroke.AddCoords({x:cX, y:cY});
    }
    LogBrushEnd(){
        if(this.activeStrokes.length<1){return;}
        this.activeStroke.isActive = false;
        NetSyncer.onStrokeEnd();
    }
    /**
     * @return {StrokePart[]}
     */
    GetReadyStrokeParts(){
        var parts = [];
        //Try to find strokes or parts of strokes that are waiting to be synced across the network
        //Start from the oldest ones
        for(let i = 0; i < this.activeStrokes.length; ++i)
        {
            //Ask the stroke for any un-synced steps.
            let steps = this.activeStrokes[i].GetSteps(false);
            if(steps.length>0){ //Create a new strokepart
                parts.push(new StrokePart(steps, this.activeStrokes[i].brushSize, this.activeStrokes[i].color, this.activeStrokes[i].cellBased));
            }
            //Delete the entire stroke if its empty and not the active stroke
            if(this.activeStrokes[i].isEmpty && !this.activeStrokes[i].isActive){
                //Delete this stroke, its spent
                const s = this.activeStrokes.splice(i,1); i = i -1;
                NetSyncer.LogPastStrokes(s);
            }
        }
        return parts;
    }
}