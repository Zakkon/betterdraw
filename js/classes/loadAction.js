var pixels = require('image-pixels');
import { data } from "jquery";
import { calcGridImportSize, getDrawLayer, hexToColor, isNullNumber, webToHex, sleep, setLayerControlsInteractable } from "../helpers.js";
import { getSetting, setLayerSettings, setSetting } from "../settings.js";
import Color32 from "./color32.js";
import { LayerSettings } from "./layerSettings.js";
import { SaveLayer } from "./serializiation/saveload.js";
import ToolsHandler from "./tools/toolsHandler.js";

export default class LoadAction {


    constructor() {
        LoadAction.IsUpdating = false;
    }

  /**
   * Fills the DrawLayer with a texture, based on the settings.
   * Rescales the grid and canvas if nessesary.
   * @param {LayerSettings} settings 
   */
    async Perform(settings) {
        console.log("BetterDraw LoadAction");
        //Sanity check on incoming settings
        if(isNullNumber(settings.sceneWidth)||settings.sceneWidth<1){console.error("LayerSettings.sceneWidth is invalid, aborting"); this.logLayerSettings(settings); return;}
        if(isNullNumber(settings.sceneHeight)||settings.sceneHeight<1){console.error("LayerSettings.sceneHeight is invalid, aborting"); this.logLayerSettings(settings); return;}
        if(isNullNumber(settings.textureWidth)||settings.textureWidth<1){console.error("LayerSettings.textureWidth is invalid, aborting"); this.logLayerSettings(settings); return;}
        if(isNullNumber(settings.textureHeight)||settings.textureHeight<1){console.error("LayerSettings.textureHeight is invalid, aborting"); this.logLayerSettings(settings); return;}
        if(isNullNumber(settings.desiredGridSize)||settings.desiredGridSize<1){console.error("LayerSettings.desiredGridSize is invalid, aborting"); this.logLayerSettings(settings); return;}

        /* Calculating Grid & Texture Size
        We need to define how big the grid is in relation to the source texture.
        The unit of measurement we are going to use here is 'pixels'.
        One grid space = x amount of pixels (from the source texture) in width & height. (Hex grids will be a different problem, and are not supported yet). Since Foundry currently doesn't allow for gridsizes smaller then 50 pixels, we have to work around that problem, should it arise.
        Here are a few scenarios:

        A): We have a small texture, 100x100 pixels, and each pixel is meant to represent one grid space. This could be a simple dungeon someone drew out in 1-2 minutes, or possibly generated with an algorithm.
        In this case, we would need to set the gridsize to 50px, and then upscale the texture by 50x, to 5000x5000 (more on that below).

        B): We have a texture that is 300x300, and every 3x3 pixel area is meant to represent one grid space.
        In this case, we would need to set the gridsize to 50px, and then upscale the texture by 16.66x(rounded up), to 5000x5000

        C): This is an interesting one. We have the same 100x100 texture as A, but we want each grid space to represent 3x3 pixels. This would ofcourse not line up with the source texture, unless we rescale the entire texture beforehand, which is what we will do.
        We take the source texture, and scale it up by 3x, to 300x300, using Nearest Neighbour sampling. The texture should look very much the same as before, but with each pixel being split into 9 pixels. From here, the procedure is identical to scenario B.

        D): We have a massive texture that is 5000x5000, and we want each 100x100 pixel area to represent one grid space.
        In this case, we can actually set the gridsize to 100px (Foundry allows this), and not need to rescale the source texture at all. If we for some reason had to, this might be a suitable moment to use Bilinear resampling, although Nearest Neighbour might do aswell, even with some loss of detail.

        In conclusion, it seems like Nearest Neighbour resampling works the best in most usecases. This module is designed with scenarios A & B in mind, although scenario C might work aswell. Scenario D falls outside of the intended usecases, as if you have a texture that large, chances are you have an external map drawing tool that can quickly draw high resolution maps. In this case, it would probably be more convenient to use that tool instead, rather then trying to painstakingly mimic the artstyle with the admittedly limited paint tools that are included in this module.
        */

        //Calculate what size the grid and texture should be
        let desiredGridSize = settings.desiredGridSize;
        //Calculate what size the scene (and its grid) should be
        const gridData = calcGridImportSize(desiredGridSize,
            settings.textureWidth, settings.textureWidth,
            settings.sceneWidth, settings.sceneHeight);

        let curScene = game.scenes.get(canvas.scene.data._id);
        
        //We might need to update the scene to fit the new desired specifications
        //This is problematic, but we have functions that will kick in and try to repair any damage caused.
        //Expect CanvasInit_On hook to be called.
        //Non-GM clients obviously dont need to rescale the scene, this is only nessesary when the GM creates the initial layer object
        let didRescale = false;
        if(game.user.isGM) 
        {
            canvas.drawLayer.isSetup=false;
            didRescale = await this._rescaleWorld(gridData.scenePixelsPerGrid,
                gridData.sceneWidthInGrids, gridData.sceneHeightInGrids, 0.05);
        }
        
        
        //Read the texture from the buffer, and scale it if nessesary
        const sceneSize = gridData.sceneSize;
        const texSize = gridData.texSize;
        const layer = getDrawLayer();
        const pm = layer.pixelmap;

        if(didRescale) { await layer.init(); }
        /*There are two ways we can use the loaded texture here

        A): We simply load the source texture (not changing its size) and apply it on the sprite. The sprite then handles the rescaling of the texture.
        Take into consideration what resampling mode to use: Bilinear or Nearest Neighbour?
        Bilinear will look horrible if the source texture is low res, and the sprite is very big. The texture will appear quite stretched. It is therefore suggested that you use a large source texture with good detail when using Bilinear.
        Nearest Neighbour attempts to keep the pixel sharpness of the texture, even when stretched out far. This is useful if you have a small source texture, and you want every pixel to represent one grid space or thereabouts.

        B): We load the source texture, but actively rescale it ourself, before we hand it to a sprite. The rescaled texture is also cached, meaning this could possibly be quite taxing on the RAM.

        For the moment, I am going to go with option A, since it keeps things simple. If I down the line want to do something like complex like Scenario C up in the 'Calculating Grid & Texture Size' section, option B might be better.
        */

        let fallback = false;
        //If the settings claim to know of an image file, and doesnt already contain a buffer
        if(settings.hasImageFile && !settings.hasBuffer && (settings.imageFilename!=null&&settings.imageFilename.length>0))
        {
            let buffer = null; let bufferWidth = 0; let bufferHeight = 0;
            try { //Load the buffer
                var {data, width, height} = await pixels('/betterdraw/uploaded/'+settings.imageFilename);
                console.log("Loaded texture size: " + width+"x"+height);
                buffer = data; bufferWidth = width; bufferHeight = height; //Cache these so we can use them later
            }
            catch { fallback = true; console.error("Failed loading an image file at " + settings.imageFilename); }
            if(buffer!=null) //If getting the buffer was a success
            {
                try {
                    //Read from this buffer, and apply them to the pixelmap
                    const presampleTexture = false;
                    if(!presampleTexture){ //Option A
                        //We want the pixelmap to just cache the buffer as it is
                        pm.ReadFromBuffer(buffer, bufferWidth, bufferHeight, true);
                        console.log("Loaded source texture straight from buffer");
                    }
                    else{ //Option B
                        //We want the pixelmap to rescale the buffer and cache that
                        pm.ReadFromBuffer_Scaled(buffer, bufferWidth, bufferHeight, texSize.w, texSize.h, true);
                        console.log("Loaded source texture and scaled it to fit our layer");
                    }
                }
                catch { fallback = true; console.error("Failed to load the image buffer and apply it to the pixelmap"); }
            }
            else{fallback = true;}
        }
        //If we only have a buffer stored in the LayerSettings, we can use that right now
        else if(settings.hasBuffer) {
            try { //Try reading the 
                pm.ReadFromBuffer(settings.buffer, settings.bufferWidth, settings.bufferHeight, true);
            }
            catch { fallback = true; console.error("Failed to load the image buffer and apply it to the pixelmap"); }
            
        }
        else{fallback = true;}

        if(fallback) {
            console.log("No source texture was defined, filling it in with the background color instead");
            if(settings.backgroundColor===null||settings.backgroundColor===undefined) //Fill in with white for now?
            { settings.backgroundColor = "#ffffff"; console.log("Filled in with white, since no backgroundcolor was defined");}
            const col = hexToColor(webToHex(settings.backgroundColor));
            console.log("Reforming texture to " + texSize.w + ", " + texSize.h + " pixels");
            pm.Reform(texSize.w, texSize.h, col, true);
        }

        setLayerControlsInteractable(true);
        //Put a wait period here, to let Foundry do nessesary setup functions before we continue
        await sleep(100);
        //Now we can set the layer sprite as visible
        layer.SetVisible(!settings.isHidden);
        //And then ofcourse make sure it is properly positioned
        layer.Reposition();
        layer.isSetup = true; //Allows us to interact with the layer using the cursor
        console.log("Layer.isSetup now true");

        //Cache some values in the LayerSettings, for quick access during runtime
        LayerSettings.pixelsPerGrid = gridData.texturePixelsPerGrid;
        LayerSettings.sceneWidthPerGrid = gridData.scenePixelsPerGrid;

        //What settings to we want to save in the scene?
        //The desired grid size, corrected to the actual grid size we will be using from now on (in pixels)
        //Source texture size (also saved in the texture itself)
        //The size of the scene

        //Only the GM should be able to save
        if(!game.user.isGM) { return; }
        //We will just save the settings we were given, and next time we load, we recalculate them in the same way we just did
        let saveImgFile = false;
        if(saveImgFile){
            let buffer = pm.texture.EncodeToPNG();
            //Will clear strokes, and save the settings with HasImageFile set to true, along with the filename
            let filename = await SaveLayer(settings, buffer, false, true); //Save the image file
            settings.hasImageFile = true;
            settings.imageFilename = filename;
        }
        //Lets save the settings, but to make sure we dont have some unnessesary filler data in there, lets create a new one and copy some values over
        let newSettings = new LayerSettings();
        newSettings.desiredGridSize = settings.desiredGridSize;
        newSettings.sceneWidth = settings.sceneWidth;
        newSettings.sceneHeight = settings.sceneHeight;
        newSettings.textureWidth = settings.textureWidth;
        newSettings.textureHeight = settings.textureHeight;
        newSettings.backgroundColor = settings.backgroundColor;
        newSettings.hasImageFile = settings.hasImageFile;
        newSettings.imageFilename = settings.imageFilename;
        newSettings.isHidden = settings.isHidden;
        await setLayerSettings(newSettings);
    }
    logLayerSettings(settings){
        console.error(settings);
    }

     

    /**
     * Very heavy function that updates the entire Foundry scene. Use only when nessesary.
     * @param {number} pixelsPerGrid 
     * @param {number} sceneGridsX 
     * @param {number} sceneGridsY 
     * @param {number} paddingGrids
     */
    async _rescaleWorld(pixelsPerGrid, sceneGridsX, sceneGridsY, paddingGrids){
        
        //Sanity check on parameters
        let curScene = game.scenes.get(canvas.scene.data._id);
        const oldGridSize = curScene.data.grid;
        const oldSceneWidth = curScene.data.width;
        const oldSceneHeight = curScene.data.width;
        const newSceneWidth = pixelsPerGrid*sceneGridsX;
        const newSceneHeight = pixelsPerGrid*sceneGridsY;
        const oldPadding = curScene.padding;
        const setPadding = true;
        let didRescale = false;
        if(oldGridSize!=pixelsPerGrid||oldSceneWidth!=newSceneWidth||oldSceneHeight!=newSceneHeight||(setPadding && oldPadding!=paddingGrids))
        {
            didRescale = true;
            this._preRescale();
            LoadAction.IsUpdating = true;
            console.log("Rescaling grid to " + pixelsPerGrid + "px...");
            //'width: value' will change scene dimension width
            let data = {grid: pixelsPerGrid, width:pixelsPerGrid*sceneGridsX, height:pixelsPerGrid*sceneGridsY};
            if(setPadding){data.padding = paddingGrids;}
            await curScene.update(data);
            LoadAction.IsUpdating = false;
            console.log("Rescale complete");
            return true;
        }
        return false;
    }

    _preRescale(){
        ToolsHandler.singleton.destroyToolPreviews();
        const drawLayer = getDrawLayer();
        var l = drawLayer.layer;
        if(l===null||l._destroyed){
            console.error("drawLayer.layer is destroyed?");
        }
        drawLayer.layer.destroy(true);
        drawLayer.layer = undefined;
       
        drawLayer.pixelmap.RecreateTexture();
    }
    
}