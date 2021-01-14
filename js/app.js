import { buffer } from "d3";
import Color32 from "./classes/color32.js";
import LoadAction from "./classes/loadAction.js";
import DrawLayer from "./classes/drawlayer.js";
import SimpleDrawLayer from "./classes/simpledraw.js";
import ToolsHandler from "./classes/tools/toolsHandler.js";
import { loadJSONasync, saveSceneSettings } from "./classes/serializiation/saveload.js";
var pixels = require('image-pixels');
import SimplefogConfig from '../simplefog/classes/SimplefogConfig.js'
import BrushControls from '../simplefog/classes/BrushControls.js';
import CreateLayerDialog from '../simplefog/classes/CreateLayerDialog.js';
import { calcGridImportSize } from "./helpers.js";
import { getSetting, setSetting, setUserSetting } from "./settings.js";
import { LayerSettings } from "./classes/layerSettings.js";
import { NetSyncer } from "./classes/netSyncer.js";

Hooks.once('canvasInit', () => {
    console.log("CANVASINIT_ONCE");
    //Create the ToolsHandler
    const th = new ToolsHandler(); //will create a singleton of itself
    canvas.toolsHandler = th;
    
    //Add our SimpleDrawLayer to the canvas. This wont have any visible effect at first, it's simply a place that interacts with controls, and can in the future spawn sprites that we can draw on.
    const layerct = canvas.stage.children.length;
    canvas.drawLayer = canvas.stage.addChildAt(new SimpleDrawLayer("DrawLayer"), layerct);
    canvas.drawLayer.draw(); //This has to be called straight away, it basically initializes the CanvasLayer that is the core of SimpleDrawLayer
});
Hooks.on("canvasInit", function() {
    console.log("CANVASINIT_ON");
    //This function can be called on things like world grid rescale, so expect this to be called more then once

    //This creates a visible sprite inside the drawLayer
    canvas.drawLayer.init();
    addToCanvasLayersArray(); //We need to call this so the game can find our drawLayer in some core functions

    //Create the preview objects for the different brushes. They will live inside drawLayer.
    ToolsHandler.singleton.createToolPreviews(canvas.drawLayer);
    
});
function addToCanvasLayersArray(){
    //Call this from Hooks.on("canvasInit")
    //FIX FOR having Canvas.Layers not contain drawLayer, which leads to the controlbutton to the left bugging out
    //CAUSES BUG: Brush preview obj doesnt line up with mousecursor. i suspect this is the previewobjs fault
    //ALSO FIXES: positioning of layer object, its now lined up with background layer object
    let theLayers = Canvas.layers;
    theLayers.drawLayer = SimpleDrawLayer;

    Object.defineProperty(Canvas, 'layers', {get: function() {
        return theLayers
    }});
}

Hooks.on("ready", async function() {
  console.log("READY");
  NetSyncer.onReady();
  //Set up our socket listener
  game.socket.on('module.betterdraw', (data) => recieveNetMsg(data));
  //game.socket.emit('module.betterdraw', {event: "clientready", userid: [game.user.id]});
  //game.socket.emit("module.BetterDraw", {event: "testevent", eventdata: ["hey"]});

  //Lets check the scene flags and see if any texture data is stored on there
  let settings = getSetting("drawlayerinfo");
  console.log(settings);
  if(settings.active && settings.hasBuffer) {
    //The layer is active, and a buffer has been cached
    let buffer = getSetting("buffer");
    //Load the layer on our client
    let e = await LayerSettings.LoadFromBuffer(settings, buffer);
    let task = new LoadAction();
    task.Perform(e);
  }

  //canvas.drawLayer.pixelmap.DrawRect(0,0,20,20, new Color32(0,0,255), true);
});
function recieveNetMsg(data){
  console.log("MSG RECIEVED!");
  console.log(data);
  switch(data.event){
    case "clientready": //A new client has just connected/reloaded their scene
      if(game.user.isGM) { serverOnClientReady(data); }
      break;
    default: console.error("message event " + data.event + " is not recognized"); break;
  }
}
/**
 * Called on the GM whenever a client has reloaded their scene
 * @param {} data 
 */
function serverOnClientReady(data) {
  
}
Hooks.on('updateUser', () => {
  console.log("UPDATEUSER");
});
Hooks.on('updateScene', () => {
  console.log("UPDATESCENE");
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
          icon: 'fas fa-cloud',
          layer: 'DrawLayer',
          tools: [
            {
              name: 'brush',
              title: game.i18n.localize('SIMPLEFOG.brushTool'),
              icon: 'fas fa-paint-brush',
            },
            {
              name: 'grid',
              title: game.i18n.localize('SIMPLEFOG.gridTool'),
              icon: 'fas fa-border-none',
            },
            {
              name: 'box',
              title: game.i18n.localize('SIMPLEFOG.boxTool'),
              icon: 'far fa-square',
            },
            {
              name: 'ellipse',
              title: game.i18n.localize('SIMPLEFOG.ellipseTool'),
              icon: 'far fa-circle',
            },
            {
              name: 'sceneConfig',
              title: game.i18n.localize('SIMPLEFOG.sceneConfig'),
              icon: 'fas fa-cog',
              onClick: () => {
                new SimplefogConfig().render(true);
              },
              button: true,
            },
            {
              name: 'addLayer',
              title: "Add Layer",
              icon: 'fas fa-cloud',
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
      if (!$('#simplefog-brush-controls').length) new BrushControls().render(true);
      // Set active tool
      const tool = controls.controls.find((control) => control.name === 'DrawLayer').activeTool; //get type of tool from controlBtn
      console.log(tool);
      canvas.drawLayer.setActiveTool(tool);
    }
    // Switching away from layer
    else {
      //console.log("Leaving layer");
      ToolsHandler.singleton.clearActiveTool();

      // Remove brush tools if open
      const bc = $('#simplefog-brush-controls');
      if (bc) bc.remove();
    }
  }

  
});

/**
 * Sets Y position of the brush controls to account for scene navigation buttons
 */
function setBrushControlPos() {
  const bc = $('#simplefog-brush-controls');
  if (bc) {
    const h = $('#navigation').height();
    bc.css({ top: `${h + 30}px` });
  }
}

// Reset position when brush controls are rendered or sceneNavigation changes
Hooks.on('renderBrushControls', setBrushControlPos);
Hooks.on('renderSceneNavigation', setBrushControlPos);
