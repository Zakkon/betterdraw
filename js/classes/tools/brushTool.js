import { getUserSetting } from "../../settings";
import { webToHex } from "../../helpers"
import DrawTool from "./drawTool";
import ToolsHandler from "./toolsHandler";
import Color32 from "../color32";
import { PaintSyncer } from "./paintSyncer";

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
        const pm = canvas.drawLayer.pixelmap;
        //todo: check against duplicate coordinates
        for(let i = 0; i < parts.length; ++i)
        {
            let p = parts[i];
            for(let j = 0; j < p.xyCoords.length; ++j)
            {
                let c = Color32.fromWeb(p.color); //Convert color from #FFFFFF format to a Color32
                if(p.cellBased) { } //TODO
                else { pm.DrawCircle(p.xyCoords[j].x, p.xyCoords[j].y, p.brushSize, c, false); }
            }
            
        }
        //Apply the pixels (renders the texture to the sprite)
        if(parts.length>0) { pm.ApplyPixels(); }
        //canvas.drawLayer.update();
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
    /* syncUpdate(){
        if(!this.op){
            this.doSync();
        }
        else if(this.didChange)
        {

        }
    }
    doSync(){
        //Take all the changes that have occured since last sync, send them to clients

        //Get unsynced strokes from the syncer
        var strokes = syncer.GetReadyStrokeParts();
        //Note: now that we have the strokes, we need to send them. There is no backup of the strokes.
        for (let i = 0; i < strokes.Length; ++i)
        {
            var s = strokes[i];
            //Todo: check that the stroke isnt too long, might want to split it up into parts before transmitting
            Player.LocalPlayer.SSendDrawingInstructions(s.tabID, (byte)s.layerID, s.xyCoords, s.brushSize, s.rgba32, s.cellBased);
        }
    } */
}