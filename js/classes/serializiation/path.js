export class LayerPath {

    constructor(layerName, sceneName)
    {
        this.layerName = layerName; this.sceneName = sceneName;
        this.fileName = layerName+".png";
    }

    get basePath(){return "betterdraw/";}
    get sceneFolderPath() { return this.basePath() + "scenes/" + this.sceneName + "/"; }
    get fullFilePath() { return this.sceneFolderPath() + this.fileName; }
}