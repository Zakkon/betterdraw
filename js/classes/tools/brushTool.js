import { getUserSetting } from "../../settings";
import { webToHex } from "../../helpers"
import DrawTool from "./drawTool";
import ToolsHandler from "./toolsHandler";
import Color32 from "../color32";
import { PaintSyncer } from "./paintSyncer";
import { NetSyncer } from "../netSyncer";

export default class BrushTool extends DrawTool {
    
    constructor(name, type){ //string
        super(name);
        this.type = type;
        this.syncer = new PaintSyncer();
        this.lastPos = {x:-9999,y:-9999};
        let ticker = PIXI.Ticker.shared;
        var fr = this.partial(this.renderStack, this.syncer, canvas);
        ticker.add(fr);
        this.brushColor = new Color32(255,0,0,255);
        this.brushSize = 1;
    }
    partial(func /*, 0..n args */) {
        var args = Array.prototype.slice.call(arguments).splice(1);
        return function() {
          var allArguments = args.concat(Array.prototype.slice.call(arguments));
          return func.apply(this, allArguments);
        };
    }
    renderStack(syncer, canvas) {
        var parts = syncer.GetReadyStrokeParts();
        if(parts===undefined||parts.length<1) { return; }
        console.log(parts);
        const pm = canvas.drawLayer.pixelmap;
        pm.DrawStrokeParts(parts);

        NetSyncer.sendStrokeUpdates(parts);
    }

    onPointerDown(p, pixelPos,e) {
        let color = getUserSetting('brushColor')//0xff0000;
        if(color==undefined) { color = "#ff0000" };
        color = webToHex(color);
        color = Color32.fromHex(color);
        this.brushColor = color;
        this.brushSize = getUserSetting('brushSize');

        if(!this.op) { this.beginStroke(); }
        this.op = true;
        
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
            console.log(p);
            console.log(pixelPos);
            if(pixelPos.x==this.lastPos.x && pixelPos.y==this.lastPos.y){ this.lastPos = {x:pixelPos.x, y:pixelPos.y}; return;} //Simple checker to make sure that cursor has moved
            this.lastPos = {x:pixelPos.x, y:pixelPos.y};
            this.syncer.LogBrushStep(pixelPos.x, pixelPos.y);
        }
    }
    onPointerUp(p, pixelPos,e) {
        this.interruptStroke();
        this.op = false;
    }
    getPreviewObj(){
        return ToolsHandler.singleton.getToolPreview("ellipse");
    }

    beginStroke(){
        this.op = true;
        const isCellMode = false; //find from somewhere
        const brushSize = getUserSetting('brushSize');
        if(!this.brushColor){console.log("BrushColor is undefined!");}

        if(isCellMode){
            this.syncer.LogBrushStart_Cells(this.brushColor, brushSize);
        }
        else{
            this.syncer.LogBrushStart(this.type, this.brushColor, brushSize);
        }
    }
    interruptStroke(){
        if(this.op){ console.log("logbrushend"); this.syncer.LogBrushEnd(); } //logHistory();
        this.op = false;
    }
}