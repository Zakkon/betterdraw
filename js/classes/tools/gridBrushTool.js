import { getUserSetting } from "../../settings";
import { webToHex } from "../../helpers"
import DrawTool from "./drawTool";
import ToolsHandler from "./toolsHandler";
import Color32 from "../color32";
import { PaintSyncer } from "./paintSyncer";
import { NetSyncer } from "../netSyncer";
import BrushTool from "./brushTool";

export default class GridBrushTool extends BrushTool {
    
    constructor(name){ //string
        super(name);
    }

    beginStroke(){
        this.op = true;
        const brushSize = getUserSetting('brushSize');
        if(!this.brushColor){console.log("BrushColor is undefined!");}

        this.syncer.LogBrushStart_Cells(this.brushColor, brushSize);
    }
}