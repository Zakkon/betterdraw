import Color32 from "../color32";
var pixels = require('image-pixels');

export class LayerSettings{

    static PIXIMaxTextureWidth(){return 12000;}
    static FoundryMinGridSize(){return 50;}
    /**
     * Color in Web format (#FFFFFF)
     */
    static DefaultBackgroundColor(){return "#FFFFFFFF";}

    /**
     * @returns {Number}
     */
    static get pixelsPerGrid() {return LayerSettings._ppg;}
     /**
     * @param {Number} value
     */
    static set pixelsPerGrid(value) {LayerSettings._ppg = value;}
     /**
     * @returns {Number}
     */
    static get sceneWidthPerGrid() {return LayerSettings._swpg;}
     /**
     * @param {Number} value
     */
    static set sceneWidthPerGrid(value) {LayerSettings._swpg = value;}

    /**
     * Create layer settings based on a set number of grids, and how many pixels each grid is meant to contain
     * @param {number} gridsX 
     * @param {number} gridsY 
     * @param {number} gridSizeTexturePixels 
     */
    static ByGrids(gridsX, gridsY, gridSizeTexturePixels)
    {
        let s = new LayerSettings();
        s.desiredGridSize = gridSizeTexturePixels;
        s.sceneWidth = s.textureWidth = gridsX * gridSizeTexturePixels;
        s.sceneHeight = s.textureWidth = gridsY * gridSizeTexturePixels;
        return s;
    }
    /**
     * Create layer settings based on a set number of grids, and how many pixels each grid is meant to contain
     * @param {number} textureWidth 
     * @param {number} textureWidth 
     * @param {number} gridSizeTexturePixels 
     */
    static ByTextureSize(textureWidth, textureHeight, gridSizeTexturePixels)
    {
        let s = new LayerSettings();
        s.desiredGridSize = gridSizeTexturePixels;
        //Not sure if this is right
        s.sceneWidth = s.textureWidth = textureWidth;
        s.sceneHeight = s.textureHeight = textureHeight;
        return s;
    }

    constructor() //set default values
    {
        //Define the dimensions of the texture (in pixels) that we will be drawing on the background object later.
        //Note that the background object will be scaled to fit the scene, so a small texture (16x16 pixels) will work with a 2400x2400 "pixels" scene, and vice versa.
        this.textureWidth = 0; //width of the displayed texture (buffer), in pixels
        this.textureHeight = 0; //height of the displayed texture (buffer), in pixels

        //Define how big a grid will be in terms of texture pixels
        this.desiredGridSize = 1; //in pixels

        //Define how big the scene in Foundry will be.
        //These values are best set to the same as textureWidth and textureHeight.
        //Later on, we will probably end up upscaling these two values to something Foundry can manage
        this.sceneWidth = 0; //width of the scene rect, in "pixels"
        this.sceneHeight = 0; //height of the scene rect, in "pixels"

        

        //Settings to keep track of a saved image file, if there is any
        this.hasImageFile = false; //Should we read from an image file somewhere?
        this.imageFilename = ""; //Includes extension
        this.hasSourceTexture = false;/* 
        this.buffer = []; //Contains texture pixel data. Will be filled with data whenever we load from an image file
        this.bufferWidth = 0; //in pixels
        this.bufferHeight = 0; //in pixels */
        this.hasBuffer = false; //Should we load straight from the buffer instead of caring about a texture file somewhere?
        
        this.backgroundColor = LayerSettings.DefaultBackgroundColor();
        this.isSetup = false;
        this.isHidden = false;
    }



    /**
     * Create LayerSettings for loading an image file from a path
     * @param {LayerSettings} settings 
     * @param {String} filename 
     */
    static async LoadImage(settings, filename){

        try{
            var d = await LayerSettings._loadImg(filename); //Try to load the image file
            if(d.buffer) { //If success, put buffer into settings
                settings.buffer = d.buffer;
                settings.hasBuffer = true;
                settings.bufferWidth = d.bufferWidth;
                settings.bufferHeight = d.bufferHeight;
                settings.textureWidth = d.bufferWidth;
            }
        }
        catch(exception) { //If fail
            console.error("Failed to load image file " + filename);
            console.error(exception);
            throw exception;
        }

        return settings;
    }
    /**
     * 
     * @param {{hasImageFile:boolean, sceneWidth:number, sceneHeight:number, desiredGridSize:number, imageFilename:string, backgroundColor:string}} settings 
     */
    static async ParseSettings(settings) { //custom object
        var s = null;
        //If we defined a path to an image file
        if(settings.hasImageFile) {
            const n = settings.imageFilename;
            if(n===null||n.length<1) { console.error("Settings does not include a path for the image!"); s = new LayerSettings(); }
            else { s = await this.LoadImage(settings, settings.imageFilename); } //Create settings around the buffer of an image file
        }
        else {
            s = new LayerSettings();
            //TODO: Rounding might be an issue here!
            const maxSize = LayerSettings.PIXIMaxTextureWidth();
            s.textureWidth = LayerSettings.clamp(settings.sceneWidth, 1, maxSize);
            s.textureHeight = LayerSettings.clamp(settings.sceneHeight, 1, maxSize);
        }
        s.desiredGridSize = settings.desiredGridSize; //Define what preferred grid size we want (in pixels)
        //scene width & height
        s.sceneWidth = settings.sceneWidth;
        s.sceneHeight = settings.sceneHeight;
        s.backgroundColor = settings.backgroundColor;
        s.isHidden = settings.isHidden;

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
        settings.hasBuffer = true; //Mark down that we intend to use the buffer
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
    static async _loadImg(filename) {
        var {data, width, height} = await pixels('/betterdraw/uploaded/'+filename);
        console.log("Loaded texture size: " + width+"x"+height);
        return {buffer: data, bufferWidth: width, bufferHeight: height}
    }
    
    static bufferToUint8ClampedArray(buffer){return Uint8ClampedArray.from({...buffer, length: Object.keys(buffer).length });}

    clampSize(){
        //If the desired settings are too large for Foundry to handle, we need to clamp them down to something more sensible

        const maxWidthPixels = 25000;
        const maxHeightPixels = 25000;
        const maxPIXIWidth = LayerSettings.PIXIMaxTextureWidth();
        const maxPIXIHeight = maxPIXIWidth;
        const foundryMinGridSize = LayerSettings.FoundryMinGridSize();;
        const actualGridSize = Math.max(this.desiredGridSize, foundryMinGridSize);
        const minWidthPixels = actualGridSize * 1;
        const minHeightPixels = actualGridSize * 1;
        let desiredWidthPixels = this.sceneWidth;
        let desiredHeightPixels = this.sceneHeight;

        //What would the scene size be after grid scaling?
        let desiredSceneWidthPixels = (this.sceneHeight / this.desiredGridSize * foundryMinGridSize);
        let desiredSceneHeightPixels = (this.sceneHeight / this.desiredGridSize * foundryMinGridSize);

        //Clamp to a reasonable size here
        desiredSceneWidthPixels = LayerSettings.clamp(desiredSceneWidthPixels, minWidthPixels, maxWidthPixels); //Could use gridsize * something aswell
        desiredSceneHeightPixels = LayerSettings.clamp(desiredSceneHeightPixels, minHeightPixels, maxHeightPixels);

        //How many whole grids would this result in?
        let desiredGridsX = desiredSceneWidthPixels % actualGridSize;
        let desiredGridsY = desiredSceneHeightPixels % actualGridSize;

        //We can then clamp it down to fit a integer number of grids
        //desiredSceneWidthPixels = desiredGridsX * actualGridSize;
        //desiredSceneHeightPixels = desiredGridsY * actualGridSize;

        this.sceneWidth = desiredSceneWidthPixels;
        this.sceneHeight = desiredSceneHeightPixels;
    }
    static clamp(value, min, max){
        if(value<min){return min;}
        if(value>max){return max;}
        return value;
    }

    static DefaultSettings(){
        let s = this.ByGrids(50,50,1);

        console.log("Created settings:");
        console.log(s);
        return s;
    }
    /**
     * 
     * @param {LayerSettings} settings 
     */
    static VerifySettingSanity(settings) {
        if(settings==null){return false;}
        if(settings.desiredGridSize==null){return false;}
        if(settings.sceneWidth==null){return false;}
        if(settings.sceneHeight==null){return false;}
        return true;
    }
    static VerifyImageSanity(data){

    }
    /**
     * 
     * @param {{type:string, color:Color32, cellBased:boolean, brushSize: number, x:number, y:number, width:number, height:number, xyCoords:{x:number, y:number}[]}[]} strokeParts
     */
    static VerifyStrokeDataSanity(strokeParts){
        if(strokeParts==null||strokeParts.length<1){return false;}
        for(let i = 0; i < strokeParts.length; ++i)
        {
            let p = strokeParts[i];
            if(p==null){return false;}
        }
        return true;
    }
}