import { setSetting, getSetting } from "../settings";
import { LayerSettings } from "./layerSettings";
import LoadAction from "./loadAction";
import { StrokePart } from "./tools/strokePart";

export class NetSyncer {
//Assumes there is only one GM in the session, and that he is authorative when it comes to drawing
    static get isMaster() { return game.user.isGM; }
    /**
     * Called from the isMaster hook in Foundry
     */
    static onReady() {
        if(!NetSyncer.isMaster){game.socket.emit('module.betterdraw', {event: "onClientJoin"});}
    }
    /**
     * Called from the updateScene hook in Foundry
     */
    static onUpdateScene() {
        //The GM has the authorative version of the texture already, no need to fetch it from sceneflags
        if(NetSyncer.isMaster) { return; }
        console.log("refresh texture");
        NetSyncer.refreshLayerTexture();
    }
    static async refreshLayerTexture() {
        console.log("Refreshing layer texture...");
        //Fetch layer info from sceneflags
        const settings = getSetting("drawlayerinfo");
        console.log(settings);
        if(settings.active && settings.hasBuffer) {
          //The layer is active, and a buffer has been cached
          const buffer = getSetting("buffer");
          var bufferArray = LayerSettings.bufferToUint8ClampedArray(buffer);
          const pixelmap = canvas.drawLayer.pixelmap;
          console.log(pixelmap.width*pixelmap.height);
          pixelmap.ReadFromBuffer(bufferArray, pixelmap.width, pixelmap.height, true);
        }
        else if(!settings.active) { console.log("Layer was not active"); }
        else {console.error("Layer did not have a buffer ready for us");}
    }
    /**
     * Called from the socket whenever a client in the session has loaded/reloaded their scene
     */
    static onClientJoin() {
        if(!NetSyncer.isMaster) { return; }
        //We might want to set scene flags here, in order to give the client the full texture
        this.updateSceneFlags();
    }
    /**
     * Called by the authorative client whenever a stroke has finished and its effects have been applied onto the pixelmap
     */
    static onStrokeEnd() {
        if(!NetSyncer.isMaster) { return; }
       
        //this.updateSceneFlags(); //lazy
    }
    static async updateSceneFlags(){
        //Apply the pixelmap buffer to the scene flags
        await setSetting("buffer", canvas.drawLayer.pixelmap.pixels);
        //Clients should now have onUpdateScene called
    }
    /**
     * 
     * @param {StrokePart[]} parts 
     */
    static sendStrokeUpdates(parts){
        if(!NetSyncer.isMaster){return;}
        //going to straightup just send the parts as they are
        game.socket.emit('module.betterdraw', {event: "strokeparts", parts: parts});
    }
    /**
     * Called from the socket on the "strokeparts" event. Recieves an array of StrokeParts
     * @param {StrokePart[]} parts 
     */
    static onStrokePartsRecieved(parts){
        if(NetSyncer.isMaster){return;}
        //Tell the pixelmap to draw according to these instructions
        //Todo: make a timestamp comparison, to make sure we arent drawing out-of-date instructions
        canvas.drawLayer.pixelmap.DrawStrokeParts(parts);
    }
}