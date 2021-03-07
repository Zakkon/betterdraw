import { getSetting, setSetting } from "../../settings";

export function SaveLayer(settings, buffer) {
    //We will save this layer as an image file
    const id = canvas.scene.data._id;
    const imgname = id + ".png"
    
    //Save current settings
    settings.hasimg = true;
    settings.imgname = imgname;
    setSetting("drawlayerinfo", settings);

    //Clear any strokes saved to scene flags, as they wont be needed anymore
    setSetting("strokes", null);

    //Then save the image (png for now)
    const dataPath = "betterdraw/uploaded";
    savePNG(buffer, imgname, dataPath)
}
export function QuicksaveLayer() {
    //scene flags should tell us where to quicksave to
    let settings = getSetting("drawlayerinfo");
    //Catch here if nothing found
    let buffer = canvas.drawLayer.pixelmap.texture.encodeToPNG();
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