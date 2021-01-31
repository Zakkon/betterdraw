import Color32 from "./classes/color32.js";
import LoadAction from "./classes/loadAction.js";
import DrawLayer from "./classes/drawlayer.js";
import SimpleDrawLayer from "./classes/simpledraw.js";
import ToolsHandler from "./classes/tools/toolsHandler.js";
import { SaveLayer } from "./classes/serializiation/saveload.js";
var pixels = require('image-pixels');
import { sleep } from "./helpers.js";
import { getSetting, setSetting, setUserSetting } from "./settings.js";
import { LayerSettings } from "./classes/layerSettings.js";
import { NetSyncer } from "./classes/netSyncer.js";
import BrushControls from "./classes/BrushControls.js";
import CreateLayerDialog from "./classes/CreateLayerDialog.js";

Hooks.once('canvasInit', () => {
    console.log("CANVASINIT_ONCE");
    //Create the ToolsHandler
    const th = new ToolsHandler(); //will create a singleton of itself
    canvas.toolsHandler = th; //Storing it in canvas aswell, hoping not to have it be garbage collected
    
    //Add our SimpleDrawLayer to the canvas. This wont have any visible effect at first, it's simply a place that interacts with controls, and can in the future spawn sprites that we can draw on.
    const layerct = canvas.stage.children.length;
    canvas.drawLayer = canvas.stage.addChildAt(new SimpleDrawLayer("DrawLayer"), layerct);
    canvas.drawLayer.draw(); //This has to be called straight away, it basically initializes the CanvasLayer that is the core of SimpleDrawLayer
});
Hooks.on("canvasInit", async function() {
  //This hook can be called on things like world grid rescale, so expect this to be called more then once
  console.log("CANVASINIT_ON");

  await canvas.drawLayer.init();//Make sure we have a sprite object in the layer, and that its rendertexture is properly set, drawing from the pixelmap
  //We need to insert our drawLayer into the .layers of the canvas, so the game can find our drawLayer in some core functions
  let theLayers = Canvas.layers;
  theLayers.drawLayer = SimpleDrawLayer;
  Object.defineProperty(Canvas, 'layers', {get: function() { return theLayers }});
  //Set the initial visibility of the sprite
  canvas.drawLayer.SetVisible(false);
  await sleep(100); //Need to sleep here to ensure that layer is properly positioned
  canvas.drawLayer.reposition();
  canvas.drawLayer.isSetup = true; //Set isSetup to true, which tells the drawLayer that its ready to interact with stuff like cursors
  canvas.drawLayer.layer.texture = canvas.drawLayer.pixelmap.texture; //Just to make sure the layer texture is properly set. Probably unessesary.
  //Create the preview objects for the different brushes. They will live inside drawLayer.
  ToolsHandler.singleton.createToolPreviews(canvas.drawLayer);
  
  //Do any test drawing functions here
});
Hooks.on("ready", async function() {
  NetSyncer.onReady();
  game.socket.on('module.betterdraw', (data) => recieveNetMsg(data));

  if(canvas.scene===null) { return; }
  canvas.drawLayer.SetVisible(true);
  await TryLoadLayer(); //Load the image file to use as a background
  
});

function recieveNetMsg(data){
  //console.log("MSG RECIEVED!");
  //console.log(data);
  switch(data.event){
    case "onClientJoin": //A new client has just connected/reloaded their scene
      if(game.user.isGM) { NetSyncer.onClientJoin(); }
      break;
    case "strokeparts":
      NetSyncer.onStrokePartsRecieved(data.parts);
      break;
    case "texturerefreshed": NetSyncer.onRecieveTexture(); break;
    default: console.error("message event " + data.event + " is not recognized"); break;
  }
}
Hooks.on('updateUser', () => {
  console.log("UPDATEUSER");
});
Hooks.on('updateScene', () => {
  console.log("UPDATE SCENE");
  NetSyncer.onUpdateScene();
});
/**
 * Add control buttons
 */
Hooks.on('getSceneControlButtons', (controls) => {
    console.log("GET SCENE CONTROL BUTTONS!");
    if (game.user.isGM) {
      if (canvas != null) {
        controls.push({
          name: 'DrawLayer',
          title: "BetterDraw",
          icon: 'fas fa-pencil-alt',
          layer: 'DrawLayer',
          tools: [
            {
              name: 'brush',
              title: "Brush",
              icon: 'fas fa-paint-brush',
            },
            {
              name: 'grid',
              title: "Grid",
              icon: 'fas fa-border-none',
            },
            /* {
              name: 'box',
              title: "Rectangle",
              icon: 'far fa-square',
            },
            {
              name: 'ellipse',
              title: "Ellipse",
              icon: 'far fa-circle',
            }, */
            {
              name: 'eyedropper',
              title: "Eyedropper",
              icon: 'custom-icon eyedropper-icon',
            },
           /*  {
              name: 'sceneConfig',
              title: "Config",
              icon: 'fas fa-cog',
              onClick: () => {
                new BetterdrawConfig().render(true);
              },
              button: true,
            }, */
            {
              name: 'addLayer',
              title: "Add Layer",
              icon: 'fa fa-plus',
              onClick: () => {
                new CreateLayerDialog().render(true);
              },
              button: true,
            },
          ],
          activeTool: 'brush',
        });
      }
    }
});
  
/**
 * Handles adding the custom brush controls pallet
 * and switching active brush flag
 */
Hooks.on('renderSceneControls', (controls) => {
  console.log("RENDER SCENE CONTROLS!");
  // Switching to layer
  if (canvas != null) {
    //console.log("ActiveControl: " + controls.activeControl);
    //console.log("ActiveTool: " + controls.activeTool);
    if (controls.activeControl == 'DrawLayer' && controls.activeTool != undefined) {
      // Open brush tools if not already open
      //console.log("Open brush tools");
      if (!$('#betterdraw-brush-controls').length) { canvas.drawLayer.brushControls = new BrushControls().render(true); }
      // Set active tool
      const tool = controls.controls.find((control) => control.name === 'DrawLayer').activeTool; //get type of tool from controlBtn
      //canvas.drawLayer.brushControls.configureElements(tool);
      canvas.drawLayer.setActiveTool(tool);
    }
    // Switching away from layer
    else {
      //console.log("Leaving layer");
      if(ToolsHandler.singleton){ToolsHandler.singleton.clearActiveTool();}
      

      // Remove brush tools if open
      const bc = $('#betterdraw-brush-controls');
      if (bc) bc.remove();
    }
  }

  
});

/**
 * Sets Y position of the brush controls to account for scene navigation buttons
 */
function setBrushControlPos() {
  const bc = $('#betterdraw-brush-controls');
  if (bc) {
    const h = $('#navigation').height();
    bc.css({ top: `${h + 30}px` });
  }
}

// Reset position when brush controls are rendered or sceneNavigation changes
Hooks.on('renderBrushControls', setBrushControlPos);
Hooks.on('renderSceneNavigation', setBrushControlPos);

async function TryLoadLayer() {
  //Load settings, or create new ones if none were found
  let settings = getSetting("drawlayerinfo");
  const isGM = game.user.isGM;
  //Only the GM can auto-create layer settings
  if(!settings && isGM) {
    //Lets create a LayerSettings that wishes to represent each pixel in the image as its own grid
    settings = new LayerSettings();
    //We would like the sprite to have the exact same size (in pixels) as our texture
    settings.spriteWidth = width;
    settings.spriteHeight = height;
    //And each grid cell to be one pixel large (impossible in Foundry, will work around that later on)
    settings.desiredGridSize = 1;
  }
  else if(!settings && !isGM) { return; } //If not GM and no settings exist, stop here

  let e = null;
  //If our settings specify an image file, we load it and build the settings around it
  if(settings.hasimg) {
    //Grab an image file from the server
    //data = buffer, width = buffer width, height = buffer height
    var {data, width, height} = await pixels('/betterdraw/uploaded/' + settings.imgname);
    e = await LayerSettings.LoadFromBuffer(settings, data, width, height);
  }
  else { e = await LayerSettings.LoadFromSettings(settings); }

  //Then hand over the settings to the loadaction
  let task = new LoadAction();
  await task.Perform(e);

  //Any strokes made after this texture was last saved will be drawn ontop
  let strokeHistory = await getSetting("strokes");
  if(!strokeHistory) { return; }
  //let strokes = NetSyncer.DecodeStrokes(strokeHistory);
  //Draw the strokes onto the pixelmap
  canvas.drawLayer.pixelmap.DrawStrokeParts(strokeHistory, true);
}