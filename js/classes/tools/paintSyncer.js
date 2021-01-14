import { Stroke } from "./stroke";
import { StrokePart } from "./strokePart";

export class PaintSyncer {

    constructor() {
        this.strokes = [];
        
    }
    get activeStroke() {return this.strokes[this.strokes.length-1];}
    LogBrushStart(color, brushSize) {
        this.strokes.forEach(function(s){s.isActive=false;});
        var stroke = new Stroke(brushSize, color, false); stroke.isActive = true;
        this.strokes.push(stroke);
    }
    LogBrushStart_Cells(color, brushSize){
        this.strokes.forEach(function(s){s.isActive=false;});
        var stroke = new Stroke(brushSize, color, true); stroke.isActive = true;
        this.strokes.push(stroke);
    }
    
    LogBrushStep(x, y) { //integers
        if(this.strokes.length<1){return;}
        this.activeStroke.AddCoords({x:x, y:y});
    }
    LogBrushStep_Cells(pixelX, pixelY, gridSettings){
        if(this.strokes.length<1){return;}
        const cX = Math.floor(pixelX / gridSettings.cellRealSize);
        const cY = Math.floor(pixelY / gridSettings.cellRealSize);
        this.activeStroke.AddCoords({x:cX, y:cY});
    }
    LogBrushEnd(){
        if(this.strokes.length<1){return;}
        this.activeStroke.isActive = false;
    }
    GetReadyStrokeParts(){
        var parts = [];
        //Try to find strokes or parts of strokes that are waiting to be synced across the network
        //Start from the oldest ones
        for(let i = 0; i < this.strokes.length; ++i)
        {
            //Ask the stroke for any un-synced steps. Delete the original steps afterward.
            let steps = this.strokes[i].GetSteps(true);
            if(steps.length>0){ //Create a new strokepart
                parts.push(new StrokePart(steps, this.strokes[i].brushSize, this.strokes[i].color, this.strokes[i].cellBased));
            }
            //Delete the entire stroke if its empty and not the active stroke
            if(this.strokes[i].isEmpty && !this.strokes[i].isActive){
                //Delete this step, its spents
                this.strokes.splice(i,1); i = i -1;
            }
        }
        return parts;
    }
}