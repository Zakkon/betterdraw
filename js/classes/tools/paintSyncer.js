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
     * Creates a new stroke using provided parameters, making it the active one.
     * @param {string} type
     * @param {Color32} color 
     * @param {number} brushSize 
     * @param {boolean} cellBased
     */
    LogStrokeStart(type, color, brushSize, cellBased=false) {
        this.strokes.forEach(function(s){s.isActive=false;});
        var stroke = new Stroke(type, brushSize, color, cellBased);
        stroke.isActive = true;
        this.strokes.push(stroke);
    }
    /**
     * Log a point in the stroke using integer pixel coordinates.
     * @param {number} x 
     * @param {number} y 
     */
    LogStrokeStep(x, y) {
        if(this.strokes.length<1) { console.error("no active stroke to add steps to"); return; }
        this.activeStroke.AddCoords({x:x, y:y});
    }
    /**
     * Mark the active stroke as having ended.
     */
    LogStrokeEnd(){
        if(this.strokes.length<1){return;}
        this.activeStroke.isActive = false;
        NetSyncer.onStrokeEnd();
    }
    /**
     * Creates a new RectStroke and makes it the active one.
     * @param {number} fromX 
     * @param {number} fromY 
     * @param {number} width 
     * @param {number} height
     * @param {number} brushSize 
     * @param {Color32} color 
     */
    LogRect(fromX, fromY, width, height, brushSize, color){
        this.strokes.forEach(function(s) { s.isActive=false; });
        var stroke = new RectStroke("rect", brushSize, color, cellBased, fromX, fromY, width, height);
        this.strokes.push(stroke);
    }
    /**
     * 
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
            else if(stroke.type=="grid") {
                parts.push({ type:stroke.type, xyCoords: stroke.GetSteps(false), color:stroke.color });
            }
            else if(stroke.type == "rect") {
                parts.push({type: stroke.type, x:stroke.x, y:stroke.y, width:stroke.width, height:stroke.height, color:stroke.color, cellBased:stroke.cellBased});
            }
            else if(stroke.type==undefined){console.error("Brush does not have a designated type!");}
            else{console.error("Did not recognize a brush of type " + stroke.type); console.log(stroke);}
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