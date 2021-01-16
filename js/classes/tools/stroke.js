import Color32 from "../color32";

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
        this.xyCoords = [];
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
     * Returns an array of integer pixel coordinates
     * @param {boolean} deleteAfterwards 
     */
    GetSteps(deleteAfterwards) {
        const toParse = this.xyCoords.length-this.parseIndex;
        const steps = this.xyCoords.slice(this.parseIndex, this.parseIndex+toParse);
        this.parseIndex = this.parseIndex + toParse;
        if(deleteAfterwards) { this.xyCoords = []; this.parseIndex = 0;}
        return steps;
    }
    get isEmpty(){ return this.xyCoords.length<1 || this.parseIndex >= this.xyCoords.length; }
}
export class RectStroke {
    constructor(type, brushSize, color, cellBased, fromX, fromY, width, height) {
        this.width = width;
        this.height = height;
    }
    get isEmpty() { return this.width<1 || this.height<1;}
}