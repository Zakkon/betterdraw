import { LayerSettings } from "./classes/layerSettings";

export function getSetting(name) {
    let setting = getSceneFlag(name);
    if (setting === undefined) setting = getUserSetting(name);
    if (setting === undefined) setting = defaultSettings()[name];
    return setting;
}
export function getSceneFlag(name) { return canvas.scene.getFlag("betterdraw", name); }
export async function setSceneFlag(name, value) {
  const v = await canvas.scene.setFlag("betterdraw", name, value);
  return v;
}

export async function setSetting(name, value) {
    const v = await setSceneFlag(name, value); return v;
}
export function getUserSetting(name) {
    let setting = game.user.getFlag("betterdraw", name);
    if (setting === undefined) { setting = defaultSettings()[name]; }
    return setting;
}
export async function setUserSetting(name, value) {
    const v = await game.user.setFlag("betterdraw", name, value);
    return v;
}
export function defaultSettings(){
    const defaults = {
        visible: false,
        blurQuality: 2,
        blurRadius: 5,
        brushSize: 50,
        brushOpacity: 1,
    };
    return defaults;
}
export function brushSizeIsDiameter() { return true; }

export function getFoundrySceneSettings() {
    let dims = canvas.dimensions;
    console.log(canvas);
    return { width: dims.sceneWidth, height: dims.sceneHeight,  rect: dims.sceneRect, paddingX: dims.paddingX, paddingY: dims.paddingY};
}
export async function setStrokes(data) {
  await setSetting("strokes", data);
}
/**
 * @returns {{type:string, color:Color32, cellBased:boolean, brushSize: number, x:number, y:number, width:number, height:number, xyCoords:{x:number, y:number}[]}[]}
 */
export function getStrokes() {
  return getSetting("strokes");
}
/**
 * @returns {LayerSettings}
 */
export async function getLayerSettings() {
  let s = await getSceneFlag("drawlayerinfo"); return s;
}
export function getLayerSettingsSync() {
  let s = getSceneFlag("drawlayerinfo"); return s;
}
  /**
 * @param {LayerSettings} settings
 */
export async function setLayerSettings(settings) {
  await setSceneFlag("drawlayerinfo", settings);
}