import Color32 from "./classes/color32.js";
import LoadAction from "./classes/loadAction.js";
import DrawLayer from "./classes/drawlayer.js";
import SimpleDrawLayer from "./classes/simpledraw.js";
import ToolsHandler from "./classes/tools/toolsHandler.js";
import { loadJSONasync, saveSceneSettings } from "./classes/serializiation/saveload.js";
var pixels = require('image-pixels');
import { calcGridImportSize } from "./helpers.js";
import { getSetting, setSetting, setUserSetting } from "./settings.js";
import { LayerSettings } from "./classes/layerSettings.js";
import { NetSyncer } from "./classes/netSyncer.js";
import BrushControls from "./classes/BrushControls.js";
import CreateLayerDialog from "./classes/CreateLayerDialog.js";

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

    //This creates a sprite inside the drawLayer, but hides it for now
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
  //await setSetting("strokes", null);
  NetSyncer.onReady();
  //Set up our socket listener
  game.socket.on('module.betterdraw', (data) => recieveNetMsg(data));
  //game.socket.emit('module.betterdraw', {event: "clientready", userid: [game.user.id]});
  //game.socket.emit("module.BetterDraw", {event: "testevent", eventdata: ["hey"]});

  //await loadFromSceneFlags();

  await tryGet3(); //Load the image file to use as a background
  //Any strokes made after this texture was last saved will be drawn ontop


  let strokeHistory = await getSetting("strokes");
  if(!strokeHistory){return;}
  let strokes = NetSyncer.DecodeStrokes(strokeHistory);
  //Draw the strokes onto the pixelmap
  canvas.drawLayer.pixelmap.DrawStrokes(strokes, true);
});
async function loadFromSceneFlags() {
  //Lets check the scene flags and see if any texture data is stored on there
  let settings = getSetting("drawlayerinfo");
  console.log(settings);
  if(!settings){return;}
  if(settings.active && settings.hasBuffer) {
    //The layer is active, and a buffer has been cached
    let buffer = getSetting("buffer");
    if(!buffer){return;}
    //There's a problem, we get the buffer in a strange non-array format, and we need to fix that
    var bufferArray = LayerSettings.bufferToUint8ClampedArray(buffer);
    if(bufferArray.length!=settings.spriteW*settings.spriteH*4){console.error("Buffer does not match its specified size!"); return; }
    //Load the layer on our client
    let e = await LayerSettings.LoadFromBuffer(settings, bufferArray);
    let task = new LoadAction();
    task.Perform(e);
  }
  else {

  }
  await setSetting("buffer", null); //Debug
}
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
  //console.log(arg1);
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


function tryUpload(file) {
  var source = "data";
  let response;
  if (file.isExternalUrl) { response = {path: file.url}}
  else { response = FilePicker.upload(source, "basic-paint/uploaded", file, {}); }
  console.log(response);
}
/* function tryDownload(){
  var buffer;
  let promise = new Promise(function(resolve, reject) {
      let response = await fetch('/basic-paint/uploaded/image.png');
      let blob = await response.blob();
      console.log(blob);
      buffer = await new Response(blob).arrayBuffer();
      console.log(buffer);
      resolve("done");
    });
    promise.then(
      result => applyToDrawLayer(buffer, 400, 400),
      error => console.log(error)
    );
  /* (async() => {
      
      //Apply that to the drawLayer
      applyToDrawLayer(buffer, 400, 400);
  })(); */
/*}*/ 
function tryget(callback) {
  const a = () => new Promise( resolve => {
      var allo = 123;
      (async() => {
      let response = await fetch('/betterdraw/uploaded/image.png');
      let blob = await response.blob();
      let buffer = await new Response(blob).arrayBuffer();
      setTimeout( () => resolve( buffer ), 1000 ); // 1s delay
      })();
  } );
  a().then( ( result ) => {
      console.log( 'a() success:', result );
      applyToDrawLayer(result, 400,400);
  });
}
function tryGet2(){
  
  const container = new PIXI.Container();
  canvas.app.stage.addChild(container);

  const texture = PIXI.Texture.from('/betterdraw/uploaded/image.png');
  var rt = canvas.drawLayer.maskTexture;
  const sprite = new PIXI.Sprite(rt);
  sprite.x = 450;
  sprite.y = 60;
  canvas.app.stage.addChild(sprite);
  canvas.app.renderer.render(container, rt);
}
async function tryGet3(){
  var {data, width, height} = await pixels('/betterdraw/uploaded/image.png');
  console.log(data);
  console.log(width + " x " + height);

  //applyToDrawLayer(data, width, height);
  let settings = getSetting("drawlayerinfo");
  console.log(settings);
  let e = await LayerSettings.LoadFromBuffer(settings, data);
  let task = new LoadAction();
  task.Perform(e);
  await setSetting("buffer", null); //Debug
}