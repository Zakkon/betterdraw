import { getUserSetting } from "../../settings";
import { webToHex } from "../../helpers"
import DrawTool from "./drawTool";
import ToolsHandler from "./toolsHandler";
import Color32 from "../color32";
import { PaintSyncer } from "./paintSyncer";
import { NetSyncer } from "../netSyncer";
import BrushTool from "./brushTool";

export default class RectTool extends DrawTool {
    
    constructor(name){ //string
        super(name);
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
        if(parts===undefined||parts.length<1){return;}
        const pm = canvas.drawLayer.pixelmap;
        pm.DrawStrokeParts(parts);

        NetSyncer.sendStrokeUpdates(parts);
    }

    onPointerDown(p,e) {
        let color = getUserSetting('brushColor')
        if(color==undefined) { color = "#ff0000" };
        color = webToHex(color);
        color = Color32.fromHex(color);
        this.brushColor = color;
        this.brushSize = getUserSetting('brushSize');

        if(!this.op) { this.beginStroke(); }
        this.op = true;
        
    }
    onPointerMove(p, e) {
        const size = getUserSetting('brushSize');//this.brushSize;
        const preview = this.getPreviewObj();
        preview.width = size * 2;
        preview.height = size * 2;
        let pointerPos = e.data.getLocalPosition(canvas.app.stage);
        preview.x = pointerPos.x;
        preview.y = pointerPos.y;
        // If drag operation has started
        if (this.op) {
            if(p.x==this.lastPos.x && p.y==this.lastPos.y){ this.lastPos = {x:p.x, y:p.y}; return;} //Simple checker to make sure that cursor has moved
            this.lastPos = {x:p.x, y:p.y};
        }
    }
    onPointerUp(p,e) {

        

        this.interruptStroke();
        this.op = false;
    }
    getPreviewObj(){ return ToolsHandler.singleton.getToolPreview("rect"); }
    beginStroke(){
        this.op = true;
        const isCellMode = false; //find from somewhere
        const brushSize = 1;//getUserSetting('brushSize');
        if(!this.brushColor){console.log("BrushColor is undefined!");}
        //Draw rect shape here with the preview obj, but dont start an actual stroke yet
    }
    interruptStroke(){
        if(this.op) {
            //Create the stroke and send it to syncer
            this.syncer.LogRect(0,0,10,10, false, this.brushColor);
        }
        this.op = false;
    }
}