export function getSetting(name) {
    let setting = canvas.scene.getFlag("betterdraw", name);
    if (setting === undefined) setting = getUserSetting(name);
    if (setting === undefined) setting = defaultSettings()[name];
    return setting;
}
export async function setSetting(name, value) {
    if(value===null){console.error("Clear scene setting " + name);}
    else{ console.error("Set scene setting " + name); }
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