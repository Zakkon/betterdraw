import { hexToPercent, percentToHex, hexToWeb } from '../helpers.js';
import { getUserSetting } from "../../js/settings.js";
import { setUserSetting } from "../../js/settings.js";

export default class BrushControls extends FormApplication {

  constructor(){
    super();
    BrushControls.singleton = this;
  }

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
    let color = getUserSetting('brushColor');
    let size = getUserSetting('brushSize');
    if(!color){color = "#ff0000"; setUserSetting('brushColor', color); }
    if(!size){size = 1; setUserSetting('brushSize', size);}
    return {
      brushSize: size,
      brushOpacity: 1,//hexToPercent(canvas.drawLayer.getUserSetting('brushOpacity')),
      brushColor: color,
    };
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    this.createSubElements();
    this.configureElements();

    let se = $("#select_brushsize");
    se.on("change", () =>{
      let val = se[0].value;
      let i = parseInt(val);
      console.log("Set to " + i);
      setUserSetting('brushSize', i);
    });
  }

  createSubElements(){
    //Setup brush size dropdown options
    const sizes = [1,2,3,4,5,6,7,8,9,10,12,14,16,18,20,24,28,32];
    let x = $("#select_brushsize"); x[0].innerHTML="";
    for(let i = 0; i < sizes.length; ++i) { $("<option>"+sizes[i]+"</a>").appendTo(x); }
    x.value = sizes[0];

    $("#color-palette-expand-btn").on("click", () => this.togglePaletteExpanded());
    this.definePresets();
    this.setPaletteExpanded(false);
  }
  togglePaletteExpanded(){
    this.setPaletteExpanded($("#color-palette-grid").hasClass("hide"));
  }
  setPaletteExpanded(expanded){
    let grid = $("#color-palette-grid");
    if((expanded && grid.hasClass("hide")) || (!expanded && !grid.hasClass("hide"))){grid.toggleClass("hide");}
    let btn = $("#color-palette-expand-btn")[0];
    btn.innerHTML = expanded? "⯇" : "⯈";
  }
  configureElements(activeTool) {
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event, formData) {

    //setUserSetting('brushSize', formData.brushSize);
    //$("#brush-lbl").text("Brush Size: " + formData.brushSize);
    //await setUserSetting('brushOpacity', percentToHex(formData.brushOpacity));
    setUserSetting('brushColor', formData.brushColor);
    canvas.drawLayer.setPreviewTint();

    if (event.submitter && event.submitter.name === 'submit') {
      console.log("submit");
      console.log(this.form);
      
    let s = $("#myDropdown")[0];
    //console.log(s);
    s.classList.toggle("show");
    let e = $("#submitbtn")[0];
    let isShow = s.classList.contains("show");
    e.innerText = (isShow? "▲":"▼");
      //this.form.getElementById("myDropdown").classList.toggle("show");
    }

  }

  refreshColor(webColor){
    let s = $("#brushColorPicker")[0];
    s.value = webColor;
  }

  definePresets(){
    var presets = [
      "000000", "434343", "666666", "999999", "b7b7b7", "cccccc", "d9d9d9", "efefef", "f3f3f3", "ffffff",
      "980000", "ff0000", "ff9900", "ffff00", "00ff00", "00ffff", "fa86e8", "0000ff", "9900ff", "ff00ff",
      "e6b8af", "f4cccc", "fce5cd", "fff2cc", "d9ead3", "d0e0e3", "c9daf8", "cfe2f3", "d9d2e9", "ead1dc",
      "dd7e6b", "ea9999", "f9cb9c", "ffe599", "b6d7a8", "a2c4c9", "a4c2f4", "9fc5e8", "b4a7d6", "d5a6bd",
      "cc4125", "e06666", "f6b26b", "ffd966", "93c47d", "76a5af", "6d9eeb", "6fa8dc", "8e7cc3", "c27ba0",
      "a61c00", "cc0000", "e69138", "f1c232", "6aa84f", "45818e", "3c78d8", "3d85c6", "674ea7", "a64d79",
      "85200c", "990000", "b45f06", "bf9000", "38761d", "134f5c", "1155cc", "0b5394", "251c75", "741b47",
      "5b0f00", "660000", "783f04", "7f6000", "274e13", "0c343d", "1c4587", "073763", "20124d", "4c1130"];
      presets.forEach(e => {
        this.addPresetButton("#" + e);
      });
  }
  addPresetButton(webColor){
    let grid = $("#color-palette-grid");
    let btn = $("<button class='color-palette-button' colorval='"+webColor+"' style='background-color: "+webColor+";'>"+"</button>").appendTo(grid);
    btn.on("click", () => this.onColorPresetButton(btn[0]));
  }
  /**
   * 
   * @param {HTMLButtonElement} button 
   */
  onColorPresetButton(button){
    console.log(button);
    const webColor = button.getAttribute("colorval");
    console.log(webColor);
    setUserSetting('brushColor', webColor);
    this.refreshColor(webColor);
  }
}
