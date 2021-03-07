import Color32 from "../color32";

export class StrokePart {
    /**
     * 
     * @param {{x:number, y:number}[]} xyCoords 
     * @param {number} brushSize 
     * @param {Color32} color 
     * @param {boolean} cellBased 
     */
    constructor(xyCoords, brushSize, color, cellBased) {
        this.xyCoords = xyCoords;
        this.brushSize = brushSize;
        this.color = color;
        this.cellBased = cellBased;
    }
}