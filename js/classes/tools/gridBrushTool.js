import { getUserSetting } from "../../settings";
import { isNullNumber, pixelPosToWorldPos, webToHex } from "../../helpers"
import BrushTool from "./brushTool";
import { LayerSettings } from "../layerSettings";
import ToolsHandler from "./toolsHandler";
import SimpleDrawLayer from "../simpledraw";

export default class GridBrushTool extends BrushTool {
    
    constructor(name, type){ //string
        super(name, type);
        
    }
    resetLastPos() { this.lastPos = {x:-9999, y:-9999};}

    beginStroke(){
        this.op = true;
        const brushSize = getUserSetting('brushSize');
        if(!this.brushColor){console.log("BrushColor is undefined!");}

        this.syncer.LogStrokeStart(this.type, this.brushColor, brushSize, true);
    }
    onPointerMove(p, pixelPos, e) {
        const size = getUserSetting('brushSize');
        //Todo: cursor object
        const preview = ToolsHandler.singleton.getToolPreview("grid");

        const wp = pixelPosToWorldPos(pixelPos);
        this.positionCursor(preview, wp.x, wp.y, size, size);

        //If we have begun our stroke
        if (this.op) {
            const gridSize = LayerSettings.pixelsPerGrid;
            if(isNullNumber(gridSize)) {console.error("LayerSettings.pixelsPerGrid is invalid!" + gridSize); }
            const gridX = Math.floor(pixelPos.x / gridSize);
            const gridY = Math.floor(pixelPos.y / gridSize);

            //Check that the cursor has moved to another grid before we log another step
            if(gridX==this.lastPos.x && gridY==this.lastPos.y) { return; }
            this.lastPos = {x:gridX, y:gridY};

            //Log a step in the stroke
            this.syncer.LogStrokeStep(gridX, gridY);
        }
    }

    positionCursorClamped(cursor, x, y, width, height, gridX, gridY){
        cursor.transform.scale.x = 1;
        cursor.transform.scale.y = 1;
        cursor.width = ((width * LayerSettings.sceneWidthPerGrid) / cursor.parent.transform.scale.x) / LayerSettings.pixelsPerGrid;
        cursor.height = ((height * LayerSettings.sceneWidthPerGrid) / cursor.parent.transform.scale.y) / LayerSettings.pixelsPerGrid;

        let xx = ((gridX * LayerSettings.sceneWidthPerGrid) / cursor.parent.transform.scale.x) / LayerSettings.pixelsPerGrid;
        let yy = ((gridX * LayerSettings.sceneWidthPerGrid) / cursor.parent.transform.scale.x) / LayerSettings.pixelsPerGrid;
        cursor.x = xx;
        cursor.y = yy;
    }
}