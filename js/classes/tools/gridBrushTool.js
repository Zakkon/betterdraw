import { getUserSetting } from "../../settings";
import { isNullNumber, webToHex } from "../../helpers"
import DrawTool from "./drawTool";
import ToolsHandler from "./toolsHandler";
import Color32 from "../color32";
import { PaintSyncer } from "./paintSyncer";
import { NetSyncer } from "../netSyncer";
import BrushTool from "./brushTool";
import { LayerSettings } from "../layerSettings";

export default class GridBrushTool extends BrushTool {
    
    constructor(name, type){ //string
        super(name, type);
    }

    beginStroke(){
        this.op = true;
        const brushSize = getUserSetting('brushSize');
        if(!this.brushColor){console.log("BrushColor is undefined!");}

        this.syncer.LogBrushStart_Cells(this.type, this.brushColor, brushSize);
    }
    onPointerMove(p, pixelPos, e) {
        const size = getUserSetting('brushSize');//this.brushSize;
        const preview = this.getPreviewObj();
        preview.width = size * 2;
        preview.height = size * 2;
        preview.x = p.x;
        preview.y = p.y;
        // If drag operation has started
        if (this.op) {
            
        const gridSize = LayerSettings.pixelsPerGrid;
        if(isNullNumber(gridSize)){console.error("current gridsize is invalid!");}
        const gridX = Math.floor(pixelPos.x / gridSize);
        const gridY = Math.floor(pixelPos.y / gridSize);
            if(gridX==this.lastPos.x && gridY==this.lastPos.y){ this.lastPos = {x:gridX, y:gridY}; return;} //Simple checker to make sure that cursor has moved
            this.lastPos = {x:gridX, y:gridY};
            this.syncer.LogBrushStep(gridX, gridY);
        }
    }
}