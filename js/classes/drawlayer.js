import Color32 from "./color32";
import LoadAction from "./loadAction";
import PixelMap from "./pixelmap";
import SmartTexture from "./smarttexture";
var pixels = require('image-pixels');


export default class DrawLayer extends CanvasLayer {

    constructor(layername) {
        super();
        this.lock = false;
        this.layername = layername;
        this.pixelmap = new PixelMap(400,400);
        /* const a = () => new Promise( resolve => {
            (async() => {
                var {data, width, height} = await pixels('/betterdraw/uploaded/image.png');
                console.log("WIDTH: " + width);
                resolve( {buffer:data, w:width, h:height} );
            })();
        } );
        a().then( ( data ) => { 
            this.pixelmap.ReadFromBuffer(data.buffer, data.w, data.h);
        }); */

        
        //this.pixelmap.DrawRect(0,0,this.pixelmap.width, this.pixelmap.height, new Color32(255,255,0), false);
    }

    get name(){return this.layername;}

    async init() {
        this.checkHealth();
    }
    async checkHealth(){
        this.pixelmap.checkHealth();
        if(this.layer&& this.layer._destroyed){
            console.error("drawLayer.layer seems to have been destroyed!");
            console.log(this.layer);
            this.layer = undefined; //throw it away
            //Create a new one
        }
        if(this.layer==undefined){
            this.createSubLayer();
        }
    }
    async createSubLayer(){
        //console.log("Creating drawLayer.layer");
        if(this.pixelmap.texture==undefined) { console.error("pixelmap texture is null!"); return; }
        if(this.pixelmap.texture.baseTexture===null){ console.error("pixelmap baseTexture is null!"); return;}
        console.log(this.pixelmap.texture);
        this.pixelmap.DrawRect(0,0,100,100,new Color32(255,0,0,255), true); //Debug

        this.layer = await new PIXI.Sprite(this.pixelmap.texture); //This is the rendered object in the scene which we will paint with pixel data
        await this.addChild(this.layer); //It will be a child of this object
        //console.log("drawLayer.layer:");
        //console.log(this.layer);
        this.pixelmap.ApplyPixels();
        this.SetVisible(true); //false
    }

    SetVisible(v) { this.layer.visible = v; }
   /*  get visible() { return this.layer.visible; }
    set visible(value) { this.layer.visible = value;} */

    SetLayerObjSize(width, height)
    {
        this.layer.width = width; this.layer.height = height;
    }

    static getMaskTexture() {
        const d = canvas.dimensions;
        let res = 1.0;
        if (d.width * d.height > 16000 ** 2) res = 0.25;
        else if (d.width * d.height > 8000 ** 2) res = 0.5;
    
        // Create the mask elements
       /*  const tex = PIXI.RenderTexture.create({
          width: canvas.dimensions.width,
          height: canvas.dimensions.height,
          resolution: res,
        }); */
        const tex = SmartTexture.create(canvas.dimensions.width, canvas.dimensions.height, 1, res);
        console.log(tex != undefined);
        return tex;
    }
    /**
   * Returns a blank PIXI Sprite of canvas dimensions
   */
    static getCanvasSprite() {
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        const d = canvas.dimensions;
        sprite.width = d.width;
        sprite.height = d.height;
        sprite.x = 0;
        sprite.y = 0;
        sprite.zIndex = 0;
        return sprite;
    }
    

    setFill() {
        const fill = new PIXI.Graphics();
        //fill.beginFill(0xffffff); //full white
        fill.beginFill(0xffff00); //full yellow
        fill.drawRect(0, 0, canvas.dimensions.width, canvas.dimensions.height);
        fill.endFill();
        this.composite2(fill);
        fill.destroy();
    }

    /**
   * Renders the given brush to the layer mask
   * @param data {Object}       PIXI Object to be used as brush
   */
    composite(brush) { //PIXI.CanvasRenderer.render
        canvas.app.renderer.render(brush, this.maskTexture, false, null, false);
    }
    composite2(brush) { //PIXI.CanvasRenderer.render
        canvas.app.renderer.render(brush, this.pixelmap.texture, false, null, false);
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

    readPixels(target, x, y, width, height) { //target = rendertexture, hopefully
        const { renderer } = canvas.app;
        let resolution;
        let renderTexture;
        let generated = false;
        if (target instanceof PIXI.RenderTexture) {
            renderTexture = target;
        }
        else {
            renderTexture = renderer.generateTexture(target);
            generated = true;
        }
        if (renderTexture) {
            resolution = renderTexture.baseTexture.resolution;
            renderer.renderTexture.bind(renderTexture);
        }
        const pixels = new Uint8Array(width*height*4);
        // read pixels to the array
        const { gl } = renderer;
        //Do we mult width & height with resolution aswell?
        gl.readPixels(x * resolution, y * resolution, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        if (generated) { renderTexture.destroy(true); }
        return pixels;
    }
    
    reposition(){
        let r = canvas.dimensions.sceneRect;
        let l = canvas.drawLayer.layer;;
        l.transform.scale.set(1,1);
        //let g = canvas.grid;
        l.x = r.x/l.parent.transform.scale.x;
        l.y = r.y/l.parent.transform.scale.y;
        l.width = r.width/l.parent.transform.scale.x;
        l.height = r.height/l.parent.transform.scale.y;
    }
}