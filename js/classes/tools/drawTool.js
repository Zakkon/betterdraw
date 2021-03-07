import ToolsHandler from "./toolsHandler";

/**
 * Base class for tools related to drawing. Meant to be extended.
 */
export default class DrawTool {

    constructor(name) {
        this.name = name;
    }

    onPointerDown(p, pixelPos, e){
        
    }
    onPointerMove(p, pixelPos, e){

    }
    onPointerUp(p, pixelPos, e){
        
    }

    get syncer() { return ToolsHandler.singleton.syncer;}
}