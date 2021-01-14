import { getSetting, setSetting } from "../settings";
var pixels = require('image-pixels');

export class LayerSettings{

    constructor() //set default values
    {
        this.desiredGridSize = 1; //in pixels
        this.sceneWidth = 5000; //in pixels
        this.sceneHeight = 5000; //in pixels
        this.hasSourceTexture = false;
        this.sourceTexWidth = 0; //in pixels
        this.sourceTexHeight = 0; //in pixels
        this.buffer = []; //Contains texture pixel data
        this.loadFromBuffer = false; //Should we load straight from the buffer instead of caring about a texture file somewhere?
        this.bufferWidth = 0; //in pixels
        this.bufferHeight = 0; //in pixels
        this.textureFilename = null; //includes extension
        this.backgroundColor = "#FFFFFF";
    }
    /**
     * 
     * @param {String} path 
     */
    static async LoadImage(path){
        var s = new LayerSettings();

        var d = await s._loadImg(path); //Try to load the image file
        s.hasSourceTexture = d.buffer!=undefined;
        if(s.hasSourceTexture) { //If success
            s.buffer = d.buffer; s.sourceTexWidth = d.bufferWidth; s.sourceTexHeight = d.bufferHeight;
            s.textureFilename = path;
        }
        else { //If fail
            console.error("Failed to load img from " + path);
            return null;
        }

        return s;
    }
    static async LoadFromSceneFlags(){
        const settings = getSetting("drawlayerinfo");
        return await this.LoadFromSettings(settings);
    }

    static async LoadFromSettings(settings) { //custom object
        var s = null;
        if(settings.hasImg) {
            const n = settings.imgname;
            if(n===null||n.length<1) { console.error("Settings does not include a path for the image!"); s = new LayerSettings(); }
            else { s = await this.LoadImage(settings.imgname); }
        }
        else {
            s = new LayerSettings();
        }
        s.desiredGridSize = settings.desiredGridSize;
        //scene width & height
        s.sceneWidth = settings.sceneWidth;
        s.sceneHeight = settings.sceneHeight;
        s.backgroundColor = settings.backgroundColor;

        return s;
    }
    /**
     * Prepare LayerSettings based on a pixel buffer array.
     * texWidth & texHeight must be defined in the settings object.
     * @param {} settings 
     * @param {Uint8ClampedArray} buffer 
     */
    static async LoadFromBuffer(settings, buffer) { //custom object
        var s = new LayerSettings();
        s.buffer = buffer;
        s.loadFromBuffer = true;
        s.bufferWidth = settings.spriteW;
        s.bufferHeight = settings.spriteH;
        s.desiredGridSize = settings.desiredGridSize;
        //scene width & height
        s.sceneWidth = settings.sceneWidth;
        s.sceneHeight = settings.sceneHeight;
        s.backgroundColor = settings.backgroundColor;

        return s;
    }

    async _loadImg(filename) {
        var {data, width, height} = await pixels('/betterdraw/uploaded/'+filename);
        console.log("Loaded texture size: " + width+"x"+height);
        return {buffer: data, bufferWidth: width, bufferHeight: height}
    }

    static SaveLayer() {
        //Save the status of the drawLayer

        var l = canvas.drawLayer;
        if(!l.isSetup) {

        }
        else{
            var pm = l.pixelmap;
            console.log(pm);
            setSetting("isActive", false);
            setSetting("buffer", pm.pixels);
            setSetting("gridSize");
            setSetting("canvasWidth");
            setSetting("canvasHeight");
        }
       
    }
    static bufferToUint8ClampedArray(buffer){return Uint8ClampedArray.from({...buffer, length: Object.keys(buffer).length });}
}