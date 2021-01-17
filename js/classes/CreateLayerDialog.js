import { webToHex, hexToWeb } from '../helpers.js';
import { getUserSetting, setUserSetting, setSetting, getSetting } from "../../js/settings.js";
import ToolsHandler from '../../js/classes/tools/toolsHandler.js';
import { LayerSettings } from '../../js/classes/layerSettings.js';
import LoadAction from '../../js/classes/loadAction.js';

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
      backgroundColor: "#FFFFFF",
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

        console.log("GridSize: " + formData.gridSize);
        
        
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
    ToolsHandler.singleton.destroyToolPreviews();
  }

  async onOptionsVerified(options){
    //Close UI
    Object.values(ui.windows).forEach((val) => {
      if (val.id === 'betterdraw-newlayer-dialog') val.close();});
    //Parse together the options
    var s = await LayerSettings.LoadFromSettings(options);
    console.log(s);
    //Use the options to create a new layer
    var task = new LoadAction();
    await task.Perform(s);

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
