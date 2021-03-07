import Color32 from "./classes/color32.js";
import LoadAction from "./classes/loadAction.js";
import DrawLayer from "./classes/drawlayer.js";
import SimpleDrawLayer from "./classes/simpledraw.js";
import ToolsHandler from "./classes/tools/toolsHandler.js";
var pixels = require('image-pixels');
import { getDrawLayer, setLayerControlsInteractable, sleep, redrawScene } from "./helpers.js";
import { getSetting, getFoundrySceneSettings, getStrokes, setStrokes, getLayerSettings, getLayerSettingsSync, setLayerSettings } from "./settings.js";
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

  const drawLayer = getDrawLayer();
  await drawLayer.init();//Make sure we have a sprite object in the layer, and that its rendertexture is properly set, drawing from the pixelmap
  //We need to insert our drawLayer into the .layers of the canvas, so the game can find our drawLayer in some core functions
  let theLayers = Canvas.layers;
  theLayers.drawLayer = SimpleDrawLayer;
  Object.defineProperty(Canvas, 'layers', {get: function() { return theLayers }});

  drawLayer.showControls = false;

  //Set the initial visibility of the sprite
  drawLayer.SetVisible(false);
  await sleep(100); //Need to sleep here to ensure that layer is properly positioned
  drawLayer.Reposition();
  drawLayer.isSetup = true; //Set isSetup to true, which tells the drawLayer that its ready to interact with stuff like cursors
  drawLayer.layer.texture = drawLayer.pixelmap.texture; //Just to make sure the layer texture is properly set. Probably unessesary.
  //Create the preview objects for the different brushes. They will live inside drawLayer.
  if(ToolsHandler.singleton==null){console.error("ToolsHandler could not be found!");}
  ToolsHandler.singleton.createToolPreviews(drawLayer);
  
  //Do any test drawing functions here
});
Hooks.on("ready", async function() {
  NetSyncer.onReady();
  game.socket.on('module.betterdraw', (data) => recieveNetMsg(data));
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
    case "undo": NetSyncer.UndoLast();
    default: console.error("message event " + data.event + " is not recognized"); break;
  }
}
Hooks.on('updateUser', () => {
  console.log("UPDATEUSER");
});
Hooks.on('updateScene', () => {
  //console.log("NET MSG: UPDATE SCENE");
  NetSyncer.onUpdateScene();
});
/**
 * Add control buttons
 */
Hooks.on('getSceneControlButtons', (controls) => {
    console.log("GET SCENE CONTROL BUTTONS!");
    const interactable = false; //layerInteractable();
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
              visible: layerInteractable(),
            },
            {
              name: 'grid',
              title: "Grid",
              icon: 'fas fa-border-none',
              visible: layerInteractable(),
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
              visible: layerInteractable(),
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
              name: 'toggleVisible',
              title: "Toggle Visible",
              icon: 'fas fa-eye',
              toggle: true,
              active: getDrawLayer()._cachedVisibility == true,
              onClick: () => {
                const curVis = getDrawLayer()._cachedVisibility == true;
                NetSyncer.CmdSetVisible(!curVis);
              },
              visible: layerInteractable(),
            },
            {
              name: 'addLayer',
              title: "Create Layer",
              icon: 'fa fa-plus',
              onClick: () => {
                new CreateLayerDialog().render(true);
              },
              button: true,
            },
            {
              name: 'removeLayer',
              title: "Delete Layer",
              icon: 'fa fa-trash',
              onClick: () => {
                DeleteLayer();
              },
              button: true,
              visible: layerInteractable(),
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
      const drawLayer = getDrawLayer();
      // Open brush tools if not already open
      //console.log("Open brush tools");
      if (!$('#betterdraw-brush-controls').length) { drawLayer.brushControls = new BrushControls().render(true); }
      // Set active tool
      const tool = controls.controls.find((control) => control.name === 'DrawLayer').activeTool; //get type of tool from controlBtn
      //canvas.drawLayer.brushControls.configureElements(tool);
      drawLayer.setActiveTool(tool);
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
function layerInteractable(){
  const l = getDrawLayer();
  //console.log(l);
  let x =  l && l.showControls == true;
  //console.log("Render controls: " + x);
  return x;
}

// Reset position when brush controls are rendered or sceneNavigation changes
Hooks.on('renderBrushControls', setBrushControlPos);
Hooks.on('renderSceneNavigation', setBrushControlPos);



//Hooks.on("setup", ()=> {console.log("SETUP HOOK")});
Hooks.on("canvasReady", async function() {
  //This is more reliable then the 'ready' hook, and fires each time we switch scenes
  console.log("CANVAS READY");

  await onSceneLoaded();

});
async function onSceneLoaded() {

  //Called when a scene loads, and when we switch to another scene
  //If we had the scene controls of betterdraw open when we left the previous scene, they are still visible here
  //So we need to redraw the scene to only show the buttons we want
  //await redrawScene();
  console.log("UI CONTROLS:");
  console.log(ui.controls);
  if(canvas.scene===null) { console.error("No canvas.scene found!"); return; }
  const drawLayer = getDrawLayer();
  drawLayer.SetVisible(drawLayer._cachedVisibility); //Refresh whatever visibility the layer last had

  ToolsHandler.singleton.validateHealth(); //Validate the health of the tools, sometimes they break during Foundry setup

  
  await TryLoadLayer(); //Load the image file to use as a background
  
  console.log("Rendering scene controls...");
  ui.controls.initialize();
}

async function TryLoadLayer() {
  console.log("TryLoadLayer");
  //Load settings, or create new ones if none were found
  let settings = await getLayerSettings();
  //console.log(settings);

  const isGM = game.user.isGM;
  //Check if settings exist
  let settingsExist = LayerSettings.VerifySettingSanity(settings);

  if(!settingsExist && isGM) {
    let l = getDrawLayer(); l.sceneControlButtonsShow = false;
    //For now, dont auto-create new layer settings, even for the GM
    //This means that the layer object will still exist, but it wont be accessible until we create a new LayerSettings object through the plus button on the controls
    return;
    console.log("Found no layer settings for this scene, creating new ones...");
    //Assume settings were corrupted or are otherwise missing
    //Create fresh default settings. Will probably lead to rescaling of the scene.
    settings = LayerSettings.DefaultSettings();
    //Delete strokes
    setStrokes(null);
  }
  else if(!settingsExist && !isGM) { let l = getDrawLayer(); l.sceneControlButtonsShow = false; return; } //If not GM and no settings exist, stop here

  console.log(settings);
  let e = null;
  //If our settings specify an image file, we load it and build the settings around it
  if(settings.hasImageFile) {
    //Grab an image file from the server
    //data = buffer, width = buffer width, height = buffer height
    console.log("Loading layer image...");
    let failed = false;
    try{
      e = await LayerSettings.LoadImage(settings, settings.imageFilename);
    }
    catch{
      console.error("Could not load corrupted or missing image at /betterdraw/uploaded/" + settings.imageFilename);
      failed = true;
      //Just forget we have an image for now (until we save the settings again)
      settings.imageFilename = "";
      settings.hasImageFile = false;
    }
    
    if(failed){
      //Revert to fallback, parse the settings
      e = await LayerSettings.ParseSettings(settings);
      //Delete strokes here? Not sure
    }
  }
  else {
    //If settings does not have an image file
    //Basically just sets the texture size of the settings based on other settings, or image present
    e = await LayerSettings.ParseSettings(settings);
  } 

  //Then hand over the settings to the loadaction
  console.log(e);
  let task = new LoadAction();
  await task.Perform(e);

  //Any strokes made after this texture was last saved will be drawn ontop
  let strokeHistory = await getStrokes();
  //Check integrity of strokes here?
  if(!LayerSettings.VerifyStrokeDataSanity(strokeHistory)){return;}
  console.log("StrokeParts length: " + strokeHistory.length);
  //Draw the strokes onto the pixelmap
  let layer = getDrawLayer();
  layer.pixelmap.DrawStrokeParts(strokeHistory, true);
}

/**
 * Delete the layer settings and strokes saved in the scene flags, aswell as telling all clients to hide the layer.
 * The layer object will still exist on the canvas, but be hidden and uninteractable
 */
async function DeleteLayer(){
  const isGM = game.user.isGM;
  if(!isGM){return;}
  console.log("Delete layer");
  const layer = getDrawLayer();
  //NetSyncer.CmdSetVisible(false); //Pointless, since we will refresh the canvas soon anyway
  await setLayerSettings(null);
  await setStrokes(null);
  setLayerControlsInteractable(false);
  layer.interactable = false;
  layer.isSetup = false;
  layer.showControls = false;
  //Reload scene controls ui
  //Accomplish this by calling scene draw?
  await redrawScene();
}
