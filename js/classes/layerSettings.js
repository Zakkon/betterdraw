import { getSetting, setSetting } from "../settings";
import Color32 from "./color32";
var pixels = require('image-pixels');

export class LayerSettings{

    constructor() //set default values
    {
        this.desiredGridSize = 1; //in pixels
        this.hasSourceTexture = false;
        this.sceneWidth = 0; //width of the scene rect, in pixels
        this.sceneHeight = 0; //height of the scene rect, in pixels
        this.textureWidth = 0; //width of the displayed texture (buffer), in pixels
        this.textureHeight = 0; //height of the displayed texture (buffer), in pixels
        this.buffer = []; //Contains texture pixel data
        this.loadFromBuffer = false; //Should we load straight from the buffer instead of caring about a texture file somewhere?
        this.bufferWidth = 0; //in pixels
        this.bufferHeight = 0; //in pixels
        this.textureFilename = null; //includes extension
        this.backgroundColor = "#FFFFFF";
    }
    /**
     * Create LayerSettings for loading an image file from a path
     * @param {String} path 
     */
    static async LoadImage(path){
        var s = new LayerSettings();

        var d = await s._loadImg(path); //Try to load the image file
        s.hasSourceTexture = d.buffer != undefined; //Mark in the settings if a buffer is present
        if(s.hasSourceTexture) { //If success, put buffer into settings
            s.buffer = d.buffer;
            s.bufferWidth = d.bufferWidth;
            s.bufferHeight = d.bufferHeight;
            s.textureWidth = d.bufferWidth;
            s.textureHeight = d.bufferHeight;
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
    /**
     * 
     * @param {{hasImg:boolean, sceneWidth:number, sceneHeight:number, desiredGridSize:number, imgname:string, backgroundColor:string}} settings 
     */
    static async LoadFromSettings(settings) { //custom object
        var s = null;
        //If we defined a path to an image file
        if(settings.hasImg) {
            const n = settings.imgname;
            if(n===null||n.length<1) { console.error("Settings does not include a path for the image!"); s = new LayerSettings(); }
            else { s = await this.LoadImage(settings.imgname); } //Create settings around the buffer of an image file
        }
        else {
            s = new LayerSettings();
            //TODO: Rounding might be an issue here!
            s.textureWidth = settings.sceneWidth;
            s.textureHeight = settings.sceneHeight;
        }
        s.desiredGridSize = settings.desiredGridSize; //Define what preferred grid size we want (in pixels)
        //scene width & height
        s.sceneWidth = settings.sceneWidth;
        s.sceneHeight = settings.sceneHeight;
        s.backgroundColor = settings.backgroundColor;

        return s;
    }
    /**
     * Prepare LayerSettings based on a pixel buffer array.
     * texWidth & texHeight must be defined in the settings object.
     * @param {LayerSettings} settings 
     * @param {Uint8ClampedArray} buffer 
     */
    static async LoadFromBuffer(settings, buffer, bufferWidth, bufferHeight) {
        settings.buffer = buffer; //Load our buffer into the settings
        settings.loadFromBuffer = true; //Mark down that we intend to use the buffer
        //Mark down the size of the buffer
        settings.bufferWidth = bufferWidth;
        settings.bufferHeight = bufferHeight;

        //Sanity check time
        if(bufferWidth<1 || bufferHeight<1){console.error("Buffer dimensions ("+bufferWidth+"x"+bufferHeight+") are invalid!");}
        if(!buffer){console.error("Buffer is invalid!");}
        else if(buffer.length!=(bufferWidth*bufferHeight*4)){
            console.error("Buffer did not match expected size. Buffer length was said to be ("+bufferWidth+"x"+bufferHeight+"px) x 4 bytes per pixel = " + (bufferWidth*bufferHeight*4)+", when infact the buffer length is " + buffer.length);
        }

        return settings;
    }
/**
 * 
 * @param {string} filename 
 * @returns {{buffer:Uint8ClampedArray, bufferWidth:number, bufferHeight:number}}
 */
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