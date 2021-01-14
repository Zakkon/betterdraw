import ToolPreviewObj from "./tools/toolPreviewObj.js";
import DrawingHistory from "./drawingHistory.js";
import DrawLayer from "./drawlayer.js";
import ToolsHandler from "./tools/toolsHandler.js";
import { saveLayer } from "./serializiation/saveload.js";

export default class SimpleDrawLayer extends DrawLayer {

    constructor(layername) {
        super(layername);
        
        // Register event listerenrs
        this._registerMouseListeners();
        this._registerKeyboardListeners();
        this.history = new DrawingHistory();
        
        this.pointer = 0;
        this.gridLayout = {};
        this.dragStart = { x: 0, y: 0 };
        // Not actually used, just to prevent foundry from complaining
        //this.history = [];
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
    }

    setActiveTool(tool) { //string
        ToolsHandler.singleton.setActiveTool(tool);
        return;
        this.clearActiveTool();
        this.activeTool = tool;
        this.setPreviewTint();
        if (tool === 'brush') {
          this.ellipsePreview.visible = true;
          $('#simplefog-brush-controls #brush-size-container').show();
        }
        else {
          $('#simplefog-brush-controls #brush-size-container').hide();
        }
        if (tool === 'grid') {
          if (canvas.scene.data.gridType === 1) {
            this.boxPreview.width = canvas.scene.data.grid;
            this.boxPreview.height = canvas.scene.data.grid;
            this.boxPreview.visible = true;
          }
          else if ([2, 3, 4, 5].includes(canvas.scene.data.gridType)) {
            this._initGrid();
            this.polygonPreview.visible = true;
          }
        }
    }
    
    setPreviewTint() {
        ToolsHandler.singleton.setPreviewTint();
        return;
        const vt = getSetting('vThreshold');
        const bo = 1;//hexToPercent(this.getUserSetting('brushOpacity')) / 100;
        let tint = 0xFF0000;
        if (bo < vt) tint = 0x00FF00;
        this.ellipsePreview.tint = tint;
        //this.boxPreview.tint = tint;
        //this.polygonPreview.tint = tint;
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
        // Box preview
        //this.boxPreview.visible = false;
        // Ellipse Preview
        this.ellipsePreview.visible = false;
        // Shape preview
        //this.polygonPreview.clear();
        //this.polygonPreview.visible = false;
        //this.polygonHandle.visible = false;
        //this.polygon = [];
        // Cancel op flag
        this.op = false;
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
    // Only react if simplefog layer is active
        if (ui.controls.activeControl !== this.layername) return;
        // Don't react if game body isn't target
        if (!event.target.tagName === 'BODY') return;
        if (event.which === 219 && this.activeTool === 'brush') {
            const s = getUserSetting('brushSize');
            this.setBrushSize(s * 0.8);
        }
        if (event.which === 221 && this.activeTool === 'brush') {
            const s = getUserSetting('brushSize');
            this.setBrushSize(s * 1.25);
        }

        //debug, ctrl+s to test save the layer
        if(event.which === 83 && event.ctrlKey) {
            event.stopPropagation();
            console.log("Saving layer...");
            saveLayer(canvas.drawLayer, "test");
        }

        // React to ctrl+z
        if (event.which === 90 && event.ctrlKey) {
            event.stopPropagation();
            this.undo();
            }
        });
    }
    /**
     * Mouse handlers for canvas layer interactions
     */
    _pointerDown(e) {
        // Don't allow new action if history push still in progress
        if (this.history.historyBuffer.length > 0) return;
        // On left mouse button
        if (e.data.button === 0) {
            const p = e.data.getLocalPosition(canvas.drawLayer);//canvas.app.stage);
            // Round positions to nearest pixel
            p.x = Math.round(p.x);
            p.y = Math.round(p.y);
            this.op = true;
            // Check active tool
            const curTool = ToolsHandler.singleton.curTool;
            curTool.onPointerDown(p, e);
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
        // Get mouse position translated to canvas coords;
        const p = e.data.getLocalPosition(canvas.drawLayer.layer);//canvas.drawLayer //canvas.app.stage);
        // Round positions to nearest pixel
        //p.x = Math.round(p.x);
        //p.y = Math.round(p.y);

        //If we want to round to a square pixel, rounding down is more accurate, as the value only changes once the cursor moves onto a new pixel, not whenever it happens to be closer to the top-left of another pixel
        p.x = Math.floor(p.x); p.y = Math.floor(p.y);
        const curTool = ToolsHandler.singleton.curTool;
        if(curTool==null){return;}
        curTool.onPointerMove(p, e);
    }
    _pointerUp(e) {
    // Only react to left mouse button
        if (e.data.button === 0) {
            // Translate click to canvas position
            const p = e.data.getLocalPosition(canvas.drawLayer);//canvas.app.stage);
            // Round positions to nearest pixel
            p.x = Math.round(p.x);
            p.y = Math.round(p.y);
            const curTool = ToolsHandler.singleton.curTool;
            curTool.onPointerUp(p, e);
            // Push the history buffer
            this.history.commitHistory();
        }
    }

    /**
     * Brush Tool
     */
    _pointerDownBrush() {
        this.op = true;
    }
    _pointerMoveBrush(p) {
        const size = this.getUserSetting('brushSize');
        this.ellipsePreview.width = size * 2;
        this.ellipsePreview.height = size * 2;
        this.ellipsePreview.x = p.x;
        this.ellipsePreview.y = p.y;
        // If drag operation has started
        if (this.op) {
            // Send brush movement events to renderbrush to be drawn and added to history stack
            this.renderBrush({
            shape: this.BRUSH_TYPES.ELLIPSE,
            x: p.x,
            y: p.y,
            fill: getUserSetting('brushOpacity'),
            width: getUserSetting('brushSize'),
            height: getUserSetting('brushSize'),
            });
        }
    }

    static Listen(data){
        console.log("MSG RECIEVED!");
        
        console.log(data);
    }
}

