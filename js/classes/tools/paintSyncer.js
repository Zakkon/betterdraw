import Color32 from "../color32";
import { NetSyncer } from "../netSyncer";
import { RectStroke, Stroke } from "./stroke";

export class PaintSyncer {

    
    constructor() {
        /**
        * @type {Stroke[]}
        */
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
        if(this.strokes.length<1) { console.error("No active stroke to add steps to"); return; }
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
        let cellBased = false;
        this.strokes.forEach(function(s) { s.isActive=false; });
        var stroke = new RectStroke("rect", brushSize, color, cellBased, fromX, fromY, width, height);
        stroke.isActive = false; //Stroke is already done
        this.strokes.push(stroke);

    }
    /**
     * Retrieves parts of a stroke that are ready for rendering or syncing across the network
     * @return {{type:string, color:Color32, cellBased:boolean}[]}
     */
    GetReadyStrokeParts() {
        var parts = [];
        //Try to find strokes or parts of strokes that are waiting to be synced across the network
        //Start from the oldest ones
        for(let i = 0; i < this.strokes.length; ++i)
        {
            let stroke = this.strokes[i];
            if(stroke.type=="circle") {
                //We need type, xycoords, color, brushsize, and cellbased boolean
                //Once we have fetched all the xycoords with stroke.GetSteps, it will set itself as expired
                parts.push({type: stroke.type, xyCoords: stroke.GetSteps(), color: stroke.color, brushSize: stroke.brushSize, cellBased: stroke.cellBased});
            }
            else if(stroke.type=="grid") {
                //We need type, xycoords, color, brushsize
                //Once we have fetched all the xycoords with stroke.GetSteps, it will set itself as expired
                parts.push({type: stroke.type, brushSize: stroke.brushSize, xyCoords: stroke.GetSteps(), color: stroke.color });
            }
            else if(stroke.type == "rect") {
                //We need type, x, y, width, height, color, and cellbased boolean
                parts.push({type: stroke.type, x: stroke.x, y: stroke.y, width: stroke.width, height: stroke.height, color: stroke.color, cellBased: stroke.cellBased});
                //Since rect strokes dont have a GetSteps function, we need to set the expired value manually
                //We can set it here already, since we already fetched all the info we needed
                stroke.expired = true;
            }
            else if(stroke.type==undefined){console.error("Brush does not have a designated type!");}
            else{console.error("Did not recognize a brush of type " + stroke.type); console.log(stroke);}

        }
        //Delete expired && inactive strokes, and log them to history (enabled Undo for them)
        let removed = [];
        for(let i = 0; i < this.strokes.length; i++)
        {
            //Check that stroke isnt null?
            if(this.strokes[i].expired && !this.strokes[i].isActive){
                removed = removed.concat(this.strokes.splice(i, 1)); i = i-1;
            }
        }
        if(removed.length>0) { NetSyncer.LogPastStrokes(removed); }
        return parts;
    }
}