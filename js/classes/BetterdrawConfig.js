import { webToHex, hexToWeb } from '../helpers.js';
import { getUserSetting, setUserSetting, setSetting, getSetting } from "../settings.js";

export default class BetterdrawConfig extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['form'],
      closeOnSubmit: false,
      submitOnChange: true,
      submitOnClose: true,
      popOut: true,
      editable: game.user.isGM,
      width: 500,
      template: 'modules/betterdraw/templates/scene-config.html',
      id: 'betterdraw-scene-config',
      title: game.i18n.localize('Betterdraw Options'),
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
      gmAlpha: Math.round(getSetting('gmAlpha') * 100),
      gmTint: hexToWeb(getSetting('gmTint')),
      playerAlpha: Math.round(getSetting('playerAlpha') * 100),
      playerTint: hexToWeb(getSetting('playerTint')),
      transition: getSetting('transition'),
      transitionSpeed: getSetting('transitionSpeed'),
      blurRadius: getSetting('blurRadius'),
      blurQuality: getSetting('blurQuality'),
      autoVisibility: getSetting('autoVisibility'),
      autoFog: getSetting('autoFog'),
      autoVisGM: getSetting('autoVisGM'),
      vThreshold: Math.round(getSetting('vThreshold') * 100),
      fogTextureFilePath: getSetting('fogTextureFilePath'),
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
    Object.entries(formData).forEach(async ([key, val]) => {
      // If setting is an opacity slider, convert from 1-100 to 0-1
      if (['gmAlpha', 'playerAlpha', 'vThreshold'].includes(key)) val /= 100;
      // If setting is a color value, convert webcolor to hex before saving
      if (['gmTint', 'playerTint'].includes(key)) val = webToHex(val);
      // Save settings to scene
      await setSetting(key, val);
      // If saveDefaults button clicked, also save to user's defaults
      if (event.submitter && event.submitter.name === 'saveDefaults') {
        setUserSetting(key, val);
      }
    });

    // If save button was clicked, close app
    if (event.submitter && event.submitter.name === 'submit') {
      Object.values(ui.windows).forEach((val) => {
        if (val.id === 'betterdraw-scene-config') val.close();
      });
    }

    // Update sight layer
    canvas.sight.refresh();
  }
}
