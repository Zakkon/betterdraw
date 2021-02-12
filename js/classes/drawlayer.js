import Color32 from "./color32";
import LoadAction from "./loadAction";
import PixelMap from "./pixelmap";
import SmartTexture from "./smarttexture";
var pixels = require('image-pixels');


export default class DrawLayer extends CanvasLayer {

    constructor(layername) {
        super();
        this.layername = layername;
        this.pixelmap = new PixelMap(400,400);
    }

    get name(){return this.layername;}

    async init() {
        this._checkHealth();
    }
    async _checkHealth(){
        this.pixelmap.checkHealth();
        if(this.layer&& this.layer._destroyed){
            console.error("drawLayer.layer seems to have been destroyed!");
            console.log(this.layer);
            this.layer = undefined; //throw it away
            //Create a new one
        }
        if(this.layer==undefined){
            this._createSubLayer();
        }
    }
    async _createSubLayer(){
        if(this.pixelmap.texture==undefined) { console.error("pixelmap texture is null!"); return; }
        if(this.pixelmap.texture.baseTexture===null){ console.error("pixelmap baseTexture is null!"); return;}

        this.layer = await new PIXI.Sprite(this.pixelmap.texture); //This is the rendered object in the scene which we will paint with pixel data
        await this.addChild(this.layer); //It will be a child of this object
        this.pixelmap.ApplyPixels();
        this.SetVisible(true);
    }

    SetVisible(v) { this.layer.visible = v; }
   /*  get visible() { return this.layer.visible; }
    set visible(value) { this.layer.visible = value;} */

    SetLayerObjSize(width, height)
    {
        this.layer.width = width; this.layer.height = height;
    }


    /**
   * Actions upon layer becoming active
   */
    activate() {
        super.activate();
        this.interactive = true;
    }

    /**
     * Actions upon layer becoming inactive
     */
    deactivate() {
        super.deactivate();
        this.interactive = false;
    }

    async draw() {
        await super.draw();
    }

    
    Reposition(){
        let r = canvas.dimensions.sceneRect;
        let l = canvas.drawLayer.layer;;
        l.transform.scale.set(1,1);
        l.x = r.x/l.parent.transform.scale.x;
        l.y = r.y/l.parent.transform.scale.y;
        l.width = r.width/l.parent.transform.scale.x;
        l.height = r.height/l.parent.transform.scale.y;
    }
}