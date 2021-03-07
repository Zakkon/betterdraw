import { getDrawLayer } from "../../helpers";
import { getSetting, setSetting, setStrokes, setLayerSettings, getLayerSettings } from "../../settings";
import { LayerSettings } from "../layerSettings";

/**
 * 
 * @param {LayerSettings} settings 
 * @param {any} buffer 
 * @param {boolean} saveSettings 
 * @param {boolean} deleteStrokes 
 */
export async function SaveLayer(settings, buffer, saveSettings=true, deleteStrokes=true) {
    //We will save this layer as an image file
    //We will name the image file after the unique id of the scene, to avoid naming conflicts
    const id = canvas.scene.data._id;
    const filename = id + ".png"
    
    //The scene flags need to know that we have an image saved, and the name of the image
    settings.hasImageFile = true;
    settings.imageFilename = filename;
    console.log("Settings that are being saved alongside texture: ");
    console.log(settings);
    if(saveSettings){ await setLayerSettings(settings);}

    //Clear any strokes saved to scene flags, as they wont be needed anymore once we have saved the image
    //Note: this means we cannot undo the strokes once the image has been saved!
    if(deleteStrokes){ await setStrokes(null); }

    //Then save the image (png for now)
    const dataPath = "betterdraw/uploaded";
    console.log("Saving image file...");
    await savePNG(buffer, filename, dataPath);
    return filename;
}
export async function QuicksaveLayer() {
    //Scene flags should tell us where to quicksave to
    let settings = await getLayerSettings();
    const drawLayer = getDrawLayer();
    let buffer = drawLayer.pixelmap.texture.EncodeToPNG();
    SaveLayer(settings, buffer);
}
async function savePNG(buffer, fileName, path){
    const file = new File([buffer], fileName, {type: "image/png"});
    await saveInData(file, path);
}
async function saveInData(file, localPath) { //localPath can be like: 'betterdraw/uploaded'
    var source = "data";
    let response;
    if (file.isExternalUrl) { response = {path: file.url}}
    else { response = await FilePicker.upload(source, localPath, file, {}); }
    console.log(response);
}