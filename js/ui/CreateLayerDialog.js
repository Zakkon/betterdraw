import { webToHex, hexToWeb, redrawScene, affirmWebRGB } from '../helpers.js';
import { getUserSetting, setUserSetting, setSetting, getSetting } from "../settings.js";
import ToolsHandler from '../tools/toolsHandler.js';
import { LayerSettings } from '../layer/layerSettings.js';
import LoadAction from '../loadAction.js';
import { NetSyncer } from '../netSyncer.js';

export default class CreateLayerDialog extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['form'],
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
      popOut: true,
      editable: game.user.isGM,
      width: 500,
      template: 'modules/betterdraw/templates/create-layer.html',
      id: 'betterdraw-newlayer-dialog',
      title: game.i18n.localize('Create New Layer'),
    });
  }

  /* -------------------------------------------- */

  /**
   * Obtain module metadata and merge it with game settings which track current module visibility
   * @return {Object}   The data provided to the template when rendering the form
   */
  getData() {
  // Return data to the template
    return {
      gridSize: 1,
      sceneWidth: 50,
      sceneHeight: 50,
      backgroundColor: affirmWebRGB(LayerSettings.DefaultBackgroundColor()),
    };
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event, formData) {
    

    // If save button was clicked, close app
    if (event.submitter && event.submitter.name === 'submit') {

        
        
        //Setup a layer
        let curScene = game.scenes.get(canvas.scene.data._id);
        const oldGridSize = curScene.data.grid;
        const newGridSize = formData.gridSize;
        const texFilePath = formData.img; //string
        const sceneWidth = formData.sceneWidth;
        const sceneHeight = formData.sceneHeight;
        const options = {desiredGridSize: formData.gridSize, texFilePath: formData.img, sceneWidth : formData.sceneWidth, sceneHeight: formData.sceneHeight, backgroundColor: formData.backgroundColor};
        /* if(oldGridSize!=formData.gridSize)
        {
          console.log("old grid size: " + curScene.data.grid);
          this.preRescale();
          curScene.update({grid: formData.gridSize});
        } */
        
        if(!CreateLayerDialog.areOptionsOK(options)){
          this.onOptionsFaulty(options); return;
        }

        await this.onOptionsVerified(options);
      
    }

    // Update sight layer
    //canvas.sight.refresh();
  }

  preRescale(){
    ToolsHandler.singleton.destroyToolCursors();
  }

  async onOptionsVerified(options){
    //Close UI
    Object.values(ui.windows).forEach((val) => {
      if (val.id === 'betterdraw-newlayer-dialog') val.close();});
    //Parse together the options as a LayerSettings
    var s = await LayerSettings.ParseSettings(options);
    //Use the options to create a new layer
    var task = new LoadAction();
    await task.Perform(s);
    //Send a net message here, telling clients that a new layer has been created?
    NetSyncer.CmdOnLayerCreated();
    await redrawScene();
    //LayerSettings.SaveLayer();
  }
  onOptionsFaulty(options){
    //Close UI
    Object.values(ui.windows).forEach((val) => {
      if (val.id === 'betterdraw-newlayer-dialog') val.close();});
  }
  static areOptionsOK(options){
    if(options.desiredGridSize === undefined || options.desiredGridSize < 1){return false;}
    if(options.sceneWidth === undefined || options.sceneHeight === undefined || options.sceneWidth<50 || options.sceneHeight<50){return;}
    return true;
  }
}
