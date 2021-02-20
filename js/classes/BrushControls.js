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
    console.log(s);
    console.log(webColor);
    s.value = webColor;
  }
}
