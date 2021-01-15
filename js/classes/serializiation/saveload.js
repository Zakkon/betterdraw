import { setSetting } from "../../settings";

export function loadJSON(path) {

    const a = () => new Promise( resolve => {
        (async() => {
            let response = await fetch('/basic-paint/uploaded/image.png');
            let json = await response.json();
            console.log(json);
            resolve( json );
        })();
    } );
    a().then( ( json ) => { });
}
export async function loadJSONasync(path) {
    let response = await fetch(path);
    let json = await response.json();
    console.log(json);
    return json;
}

export function loadLayer(path)
{
    
}
export function loadModuleSettings(settingsName){
    //return a ClientSettings
    return game.settings.get("betterdraw", settingsName);
}

export function saveSceneSettings(){
    //Get current settings
    //var curSettings = loadModuleSettings("main");
    //curSettings.config = false; //Set this to false, so it doesnt appear in module configuration menu
    
    var data = {
        imgname: "dungeon.png",
        gridsize: 50,
        texW: 100,
        texH: 100,
    }
    setSetting("drawlayerinfo", data);
}
export function saveLayer(layerObj, path){
    const pixelmap = layerObj.pixelmap;
    const buffer = pixelmap.texture.encodeToPNG();
    savePNG(buffer, "dungeon.png", "betterdraw/uploaded");
}
export async function savePNG(buffer, fileName, path){
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