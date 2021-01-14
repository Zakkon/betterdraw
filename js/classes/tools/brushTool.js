import { getUserSetting } from "../../settings";
import { webToHex } from "../../helpers"
import DrawTool from "./drawTool";
import ToolsHandler from "./toolsHandler";
import Color32 from "../color32";
import { PaintSyncer } from "./paintSyncer";
import { NetSyncer } from "../netSyncer";

export default class BrushTool extends DrawTool {
    
    constructor(name){ //string
        super(name);
        this.syncer = new PaintSyncer();
        this.lastPos = {x:-9999,y:-9999};
        let ticker = PIXI.Ticker.shared;
        var fr = this.partial(this.renderStack, this.syncer, canvas);
        ticker.add(fr);
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
        let color = getUserSetting('brushColor')//0xff0000;
            //console.log(color);
            color = webToHex(color);
            color = Color32.fromHex(color)
        this.brushColor = color;
        this.brushSize = getUserSetting('brushSize');

        if(!this.op) { this.beginStroke(); }
        this.op = true;
        
    }
    onPointerMove(p, e) {
        //const size = getUserSetting('brushSize');
        const size = this.brushSize;
        //const color = this.brushColor;
        const preview = this.getPreviewObj();
        preview.width = size * 2;
        preview.height = size * 2;
        preview.x = p.x;
        preview.y = p.y;
        // If drag operation has started
        if (this.op) {
            if(p.x==this.lastPos.x && p.y==this.lastPos.y){ this.lastPos = {x:p.x, y:p.y}; return;}
            this.lastPos = {x:p.x, y:p.y};
            //let color = getUserSetting('brushColor')//0xff0000;
            //console.log(color);
            //color = webToHex(color);
            //console.log(color);

            //networksynced test function, not stable
            this.syncer.LogBrushStep(p.x, p.y);

            //Works
           /*  const cellMode = false;
            if(cellMode){

            }
            else{
                canvas.drawLayer.pixelmap.DrawCircle(p.x, p.y, size, color, true);
            } */
            //Used to work
            //canvas.drawLayer.pixelmap.RenderBrush({x:p.x, y:p.y, fill: Color32.fromHex(color)});



            //Very old legacy
            // Send brush movement events to renderbrush to be drawn and added to history stack
            /* this.renderBrush({
            shape: "ellipse",
            x: p.x,
            y: p.y,
            fill: color,//getUserSetting('brushOpacity'),
            width: getUserSetting('brushSize'),
            height: getUserSetting('brushSize'),
            }); */
        }
    }
    onPointerUp(p,e) {
        this.interruptStroke();
        this.op = false;
    }
    getPreviewObj(){
        return ToolsHandler.singleton.getToolPreview("ellipse");
    }

    beginStroke(){
        this.op = true;
        const isCellMode = false; //find from somewhere
        const color = getUserSetting('brushColor');
        const brushSize = getUserSetting('brushSize');

        if(isCellMode){
            this.syncer.LogBrushStart_Cells(color, brushSize);
        }
        else{
            this.syncer.LogBrushStart(color, brushSize);
        }
    }
    interruptStroke(){
        if(this.op){ this.syncer.LogBrushEnd(); } //logHistory();
        this.op = false;
    }
}