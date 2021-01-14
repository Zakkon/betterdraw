export class Stroke {

    constructor(brushSize, color, cellBased){
        this.brushSize = brushSize;
        this.color = color;
        this.cellBased = cellBased;
        this.isActive = true;
        this.xyCoords = [];
    }
    AddCoords(pos) { //object with integer x & y parameters
        this.xyCoords.push(pos);
    }
    /**
     * Returns an array of integer pixel coordinates
     * @param {boolean} deleteAfterwards 
     */
    GetSteps(deleteAfterwards) {
        const steps = this.xyCoords;
        if(deleteAfterwards) { this.xyCoords = []; }
        return steps;
    }
    get isEmpty(){return this.xyCoords.length<1;}
}