var pixels = require('image-pixels');
import { data } from "jquery";
import { calcGridImportSize, hexToColor, webToHex } from "../helpers.js";
import { getSetting, setSetting } from "../settings.js";
import Color32 from "./color32.js";
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
        //console.log(settings);
        console.log("PERFORMING ACTION!");


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
        let desiredGridSize = settings.desiredGridSize;//50 + Math.floor(Math.random() * 150);
        const gridData = calcGridImportSize(desiredGridSize, settings.sourceTexWidth, settings.sourceTexHeight);

        //lets figure out some good scene dimensions, based on grid
        console.log(gridData);

        //Rescale the grid if needed
        const sceneInGrids = 50;
        let curScene = game.scenes.get(canvas.scene.data._id);
        console.log(curScene.data);
        let didRescale = false;
        if(game.user.isGM) //clients dont need to rescale the scene, this is only nessesary when the GM creates the initial layer object
        {
            didRescale = await this._rescaleWorld(gridData.pixelsPerGrid, sceneInGrids);
        }
        
        
        
        //Read the texture from the buffer, and scale it if nessesary
        const ts = gridData.texSize;
        const layer = canvas.drawLayer;
        const pm = layer.pixelmap;

        /*There are two ways we can use the loaded texture here

        A): We simply load the source texture (not changing its size) and apply it on the sprite. The sprite then handles the rescaling of the texture.
        Take into consideration what resampling mode to use: Bilinear or Nearest Neighbour?
        Bilinear will look horrible if the source texture is low res, and the sprite is very big. The texture will appear quite stretched. It is therefore suggested that you use a large source texture with good detail when using Bilinear.
        Nearest Neighbour attempts to keep the pixel sharpness of the texture, even when stretched out far. This is useful if you have a small source texture, and you want every pixel to represent one grid space or thereabouts.

        B): We load the source texture, but actively rescale it ourself, before we hand it to a sprite. The rescaled texture is also cached, meaning this could possibly be quite taxing on the RAM.

        For the moment, I am going to go with option A, since it keeps things simple. If I down the line want to do something like complex like Scenario C up in the 'Calculating Grid & Texture Size' section, option B might be better.
        */

        if(didRescale) {
            await layer.init();
        }

        if(settings.hasSourceTexture)
        {
            
            const presampleTexture = false;
            if(!presampleTexture){ //Option A
                //We want the pixelmap to just cache the texture as it is
                pm.ReadFromBuffer(settings.buffer, settings.sourceTexWidth, settings.sourceTexHeight, true);
                console.log("Loaded source texture straight from buffer");
            }
            else{ //Option B
                //We want the pixelmap to rescale the texture and cache that
                pm.ReadFromBuffer_Scaled(settings.buffer, settings.sourceTexWidth, settings.sourceTexHeight, ts.w, ts.h, true);
                console.log("Loaded source texture and scaled it to fit our layer");
            }
        }
        else if(settings.loadFromBuffer){
            pm.ReadFromBuffer(settings.buffer, settings.bufferWidth, settings.bufferHeight, true);
            console.log("Loaded source texture straight from buffer");
        }
        else {
            console.log("No source texture was defined, filling it in with the background color instead");
            if(settings.backgroundColor===null||settings.backgroundColor===undefined)
            { settings.backgroundColor = "#ff00ff"; console.log("Filled in with default background color, since no backgroundcolor was defined");}
            const col = hexToColor(webToHex(settings.backgroundColor));
            pm.Reform(500,500, col, true);
        }

        //The actual rendered sprite object (PIXI.Sprite) needs to be rescaled to match the canvas
        //Strangely enough, a correctly scaled sprite appears 50% too big in relation to the grid, therefore we need to scale it down to 66.6%
        
        //layer.layer.width = ts.w * (2/3);
        //layer.layer.height = ts.h * (2/3);
        

        //Bug/problem: the scene adds padding ontop of the scene dimensions we provided. We need to take that into account when we position our sprite
        

        //Problem: when the scene resizes, our sprite may not line up correctly. TEST THIS!
        
        
        //Then position the sprite and stretch it correctly
        if(layer.layer===undefined){console.error("drawLayer.layer is undefined! What is going on?");}
        
        layer.SetVisible(true);
       
        layer.reposition();

        //What settings to we want to save in the scene?
        //image name, so we can find the image file later
        //the desired grid size (pixels per grid)
        //source texture size (its saved in the texture itself)
        


        layer.isSetup = true;
        console.log("set isSetup true");

        if(!game.user.isGM) { return; }
        setSetting("drawlayerinfo", {imgname:settings.textureFilename, desiredGridSize: settings.desiredGridSize, hasImg: settings.hasTexture, active: true, hasBuffer: true, spriteW: pm.width, spriteH: pm.height});
        //setSetting("buffer", layer.pixelmap.pixels); 
    }


    sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }  

    async _rescaleWorld(pixelsPerGrid, sceneInGrids){
        
        let curScene = game.scenes.get(canvas.scene.data._id);
        const oldGridSize = curScene.data.grid;
        const oldSceneWidth = curScene.data.width;
        const oldSceneHeight = curScene.data.width;
        const newSceneWidth = pixelsPerGrid*sceneInGrids;
        const newSceneHeight = pixelsPerGrid*sceneInGrids;
        let didRescale = false;
        if(oldGridSize!=pixelsPerGrid||oldSceneWidth!=newSceneWidth||oldSceneHeight!=newSceneHeight)
        {
            didRescale = true;
            this._preRescale();
            LoadAction.IsUpdating = true;
            console.log("Rescaling grid to " + pixelsPerGrid + "px...");
            //'width: value' will change scene dimension width
            await curScene.update({grid: pixelsPerGrid, width:pixelsPerGrid*sceneInGrids, height:pixelsPerGrid*sceneInGrids});
            LoadAction.IsUpdating = false;
            console.log("Rescale complete");
            return true;
        }
        return false;
    }

    _preRescale(){
        ToolsHandler.singleton.destroyToolPreviews();
        console.log("layer: ");
        var l = canvas.drawLayer.layer;
        console.log(l);
        console.log(l._destroyed);
        if(l===null||l._destroyed){
            console.error("drawLayer.layer is destroyed?");
        }
        canvas.drawLayer.layer.destroy(true);
        canvas.drawLayer.layer = undefined;
       
        canvas.drawLayer.pixelmap.recreateTexture();
    }
    
}