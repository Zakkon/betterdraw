import Color32 from "../color32";
import { StrokePart } from "./strokePart";

export class Stroke {

    /**
     * @param {string} type
     * @param {number} brushSize 
     * @param {Color32} color 
     * @param {boolean} cellBased 
     */
    constructor(type, brushSize, color, cellBased){
        this.type = type;
        this.brushSize = brushSize;
        this.color = color;
        this.cellBased = cellBased;
        this.isActive = true;
        /**@type {{x:number, y:number}[]} */
        this.xyCoords = [];
        this.timestamp = 0;
        this.parseIndex = 0;
    }
    /**
     * Add an integer pixel coordinate to the stroke
     * @param {{x:number,y:number}} pos 
     */
    AddCoords(pos) { //object with integer x & y parameters
        this.xyCoords.push(pos);
    }
    /**
     * Fetches an array of integer pixel coordinates stored in the stroke. Can optionally delete these coordinates from the original array before returning them.
     * @param {boolean} deleteAfterwards 
     * @return {{x:number, y:number}[]}
     */
    GetSteps(deleteAfterwards) {
        const toParse = this.xyCoords.length - this.parseIndex;
        const steps = this.xyCoords.slice(this.parseIndex, this.parseIndex+toParse);
        this.parseIndex = this.parseIndex + toParse;
        if(deleteAfterwards) { this.xyCoords = []; this.parseIndex = 0;}
        return steps;
    }
    get isEmpty(){ return this.xyCoords.length<1 || this.parseIndex >= this.xyCoords.length; }
}
export class RectStroke extends Stroke {
    /**
     * 
     * @param {string} type 
     * @param {number} brushSize 
     * @param {Color32} color 
     * @param {boolean} cellBased 
     * @param {number} fromX 
     * @param {number} fromY 
     * @param {number} width 
     * @param {number} height 
     */
    constructor(type, brushSize, color, cellBased, fromX, fromY, width, height) {
        super(type, brushSize, color, cellBased);
        this.x = fromX;
        this.y = fromY;
        this.width = width;
        this.height = height;
        this.expired = false;
    }
    get isEmpty() { return this.expired || this.width<1 || this.height<1;}
}