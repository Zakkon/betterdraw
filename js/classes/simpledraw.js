import ToolPreviewObj from "./tools/toolPreviewObj.js";
import DrawingHistory from "./drawingHistory.js";
import DrawLayer from "./drawlayer.js";
import ToolsHandler from "./tools/toolsHandler.js";
import { QuicksaveLayer } from "./serializiation/saveload.js";
import { NetSyncer } from "./netSyncer.js";
import { worldPosToPixelPos } from "../helpers.js";

export default class SimpleDrawLayer extends DrawLayer {

    constructor(layername) {
        super(layername);
        this.isSetup = false;
        this.interactable = false;
        this.showControls = false; //Turns most scene control buttons related to this layer on, like brushes, hide/show, delete
        this._cachedVisibility = false; //A cached value of visibility, which is also applied to the underlying PIXI object
        
        // Register event listerenrs
        this._registerMouseListeners();
        this._registerKeyboardListeners();
        this.history = new DrawingHistory();
        
        this.pointer = 0;
        this.gridLayout = {};
        this.dragStart = { x: 0, y: 0 };
        this.BRUSH_TYPES = {
          ELLIPSE: 0,
          BOX: 1,
          ROUNDED_RECT: 2,
          POLYGON: 3,
        };
        this.DEFAULTS = {
            visible: false,
            blurQuality: 2,
            blurRadius: 5,
            brushSize: 50,
            brushOpacity: 1,
        };

        
    }
    async init(){
        super.init();
        this.isSetup = false;
    }
    /**
     * @param {string} tool 
     */
    setActiveTool(tool) {
        ToolsHandler.singleton.setActiveTool(tool);
    }
    
    setPreviewTint() {
        ToolsHandler.singleton.setPreviewTint();
    }

    /**
     * Sets the active tool & shows preview for brush & grid tools
     * @param {Number}  Size in pixels
     */
    async setBrushSize(s) {
        await setUserSetting('brushSize', s);
        const p = { x: this.ellipsePreview.x, y: this.ellipsePreview.y };
        this._pointerMoveBrush(p);
    }

    /**
     * Aborts any active drawing tools
     */
    clearActiveTool() {
        // Clear history buffer
        this.history.clearBuffer();
    }
    onLeaveDrawControl(){ToolsHandler.singleton.clearActiveTool();}

     /**
   * Adds the mouse listeners to the layer
   */
    _registerMouseListeners() {
        this.addListener('pointerdown', this._pointerDown);
        this.addListener('pointerup', this._pointerUp);
        this.addListener('pointermove', this._pointerMove);
        this.dragging = false;
        this.brushing = false;
    }
    /**
    * Adds the keyboard listeners to the layer
    */
    _registerKeyboardListeners() {
    $(document).keydown((event) => {
    // Only react if betterdraw layer is active
        if (ui.controls.activeControl !== this.layername) return;
        // Don't react if game body isn't target
        if (!event.target.tagName === 'BODY') return;
        /* if (event.which === 219 && this.activeTool === 'brush') {
            const s = getUserSetting('brushSize');
            this.setBrushSize(s * 0.8);
        }
        if (event.which === 221 && this.activeTool === 'brush') {
            const s = getUserSetting('brushSize');
            this.setBrushSize(s * 1.25);
        } */

        //debug, ctrl+s to test save the layer
        if(event.which === 83 && event.ctrlKey) {
            event.stopPropagation();
            console.log("Saving layer...");
            QuicksaveLayer();
        }

        // React to ctrl+z
        if (event.which === 90 && event.ctrlKey) {
            event.stopPropagation();
            NetSyncer.UndoLast();
            //Send undo command to clients
            NetSyncer.CmdSendUndo();
            }
        });
    }
    /**
     * Mouse handlers for canvas layer interactions
     */
    _pointerDown(e) {
        if(!this.isSetup){return;}
        // Don't allow new action if history push still in progress
        if (this.history.historyBuffer.length > 0) return;
        // On left mouse button
        if (e.data.button === 0) {
            let data = this._cursorData(e);

            this.op = true;
            // Check active tool
            const curTool = ToolsHandler.singleton.curTool;
            if(curTool==null){return;}
            curTool.onPointerDown(data.p, data.pixelPos, e);
            // Call _pointermove so single click will still draw brush if mouse does not move
            this._pointerMove(e);
        }
        // On right button, cancel action
        else if (e.data.button === 2) {
        // Todo: Not sure why this doesnt trigger when drawing ellipse & box
            if (['polygon', 'box', 'ellipse'].includes(this.activeTool)) {
            this.clearActiveTool();
            }
        }
    }
    _pointerMove(e) {
        if(!this.isSetup){return;}
       
        let data = this._cursorData(e);

        const curTool = ToolsHandler.singleton.curTool;
        if(curTool==null) { return; }
        curTool.onPointerMove(data.p, data.pixelPos, e);
    }
    _pointerUp(e) {
        if(!this.isSetup){return;}
        // Only react to left mouse button
        if (e.data.button === 0) {
            let data = this._cursorData(e);
            const curTool = ToolsHandler.singleton.curTool;
            if(curTool==null){return;}
            curTool.onPointerUp(data.p, data.pixelPos, e);
            // Push the history buffer
            this.history.commitHistory();
        }
    }
    /** Returns mouse position in worldspace (p) and canvas space (pixelPos)
     * @return {p:{x:number,y:number}, pixelPos:{x:number, y:number}}
     */
    _cursorData(e){
         //Position in relation to drawLayer (used to position graphical object)
        const p = e.data.getLocalPosition(canvas.drawLayer);
        let r = canvas.dimensions.sceneRect;
        //Pixel on the drawlayer (needs rounding)
        let pixelPos = worldPosToPixelPos(p);

        // Round positions to nearest pixel
        //If we want to round to a square pixel, rounding down is more accurate, as the value only changes once the cursor moves onto a new pixel, not whenever it happens to be closer to the top-left of another pixel
        pixelPos.x = Math.floor(pixelPos.x);
        pixelPos.y = Math.floor(pixelPos.y);
        return {p:p, pixelPos: pixelPos};
    }
}

