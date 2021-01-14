import { hexToPercent, percentToHex, hexToWeb } from '../helpers.js';
import { getUserSetting } from "../../js/settings.js";
import { setUserSetting } from "../../js/settings.js";

export default class BrushControls extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['form'],
      closeOnSubmit: false,
      submitOnChange: true,
      submitOnClose: true,
      popOut: false,
      editable: game.user.isGM,
      template: 'modules/betterdraw/templates/brush-controls.html',
      id: 'filter-config',
      title: "BetterDraw"
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
      brushSize: getUserSetting('brushSize'),
      brushOpacity: 1,//hexToPercent(canvas.drawLayer.getUserSetting('brushOpacity')),
      brushColor: getUserSetting('brushColor'),
    };
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event, formData) {
    setUserSetting('brushSize', formData.brushSize);
    await setUserSetting('brushOpacity', percentToHex(formData.brushOpacity));
    setUserSetting('brushColor', formData.brushColor);
    canvas.drawLayer.setPreviewTint();
  }
}
