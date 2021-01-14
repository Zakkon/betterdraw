/* import SimplefogConfig from './classes/SimplefogConfig.js';
import BrushControls from './classes/BrushControls.js';
import CreateLayerDialog from './classes/CreateLayerDialog.js';

/**
 * Add control buttons
 */
Hooks.on('getSceneControlButtons', (controls) => {
  console.log("GET SCENE CONTROL BUTTONS!");
  console.error("getscenecontrolbtns");
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
    console.log("ActiveControl: " + controls.activeControl);
    console.log("ActiveTool: " + controls.activeTool);
    if (controls.activeControl == 'DrawLayer' && controls.activeTool != undefined) {
      // Open brush tools if not already open
      console.log("Open brush tools");
      if (!$('#simplefog-brush-controls').length) new BrushControls().render(true);
      // Set active tool
      const tool = controls.controls.find((control) => control.name === 'DrawLayer').activeTool; //get type of tool from controlBtn
      console.log(tool);
      canvas.drawLayer.setActiveTool(tool);
    }
    // Switching away from layer
    else {
      //console.log("Leaving layer");
      // Clear active tool
      //canvas.drawLayer.onLeaveDrawControl();
      //canvas.toolsHandler.clearActiveTool();
      //canvas.simplefog.clearActiveTool(); //uncomment this later!

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
 */