export function getSetting(name) {
    let setting = canvas.scene.getFlag("betterdraw", name);
    if (setting === undefined) setting = getUserSetting(name);
    if (setting === undefined) setting = defaultSettings()[name];
    return setting;
}
export async function setSetting(name, value) {
    const v = await canvas.scene.setFlag("betterdraw", name, value);
    return v;
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
  export function deleteStrokes() {
    setSetting("strokes", null);
  }
  export async function getStrokes() {
    return await getSetting("strokes");
  }