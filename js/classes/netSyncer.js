import { setSetting } from "../settings";

export class NetSyncer {
//Assumes there is only one GM in the session, and that he is authorative when it comes to drawing
    static get isMaster() { return game.user.isGM; }
    /**
     * Called from the isMaster hook in Foundry
     */
    static onReady() {
        
    }
    /**
     * Called from the updateScene hook in Foundry
     */
    static onUpdateScene() {
        //The GM has the authorative version of the texture already, no need to fetch it from sceneflags
        console.log("sceneUpdate");
        if(NetSyncer.isMaster) { return; }
        NetSyncer.refreshLayerTexture();
    }
    static async refreshLayerTexture() {
        //Fetch layer info from sceneflags
        const settings = getSetting("drawlayerinfo");
        console.log(settings);
        if(settings.active && settings.hasBuffer) {
          //The layer is active, and a buffer has been cached
          let buffer = getSetting("buffer");
          //Load the layer on our client
          let e = await LayerSettings.LoadFromBuffer(settings, buffer);
          let task = new LoadAction();
          task.Perform(e);
        }
        else if(!settings.active) { console.log("Layer was not active"); }
        else {console.error("Layer did not have a buffer ready for us");}
    }
    /**
     * Called from the socket whenever a client in the session has loaded/reloaded their scene
     */
    static onClientJoin() {
        if(!NetSyncer.isMaster) { return; }
    }
    /**
     * Called by the authorative client whenever a stroke has finished and its effects have been applied onto the pixelmap
     */
    static onStrokeEnd() {
        console.log("onStrokeEnd");
        if(!NetSyncer.isMaster) { return; }
        //Apply the pixelmap buffer to the scene flags
        setSetting("buffer", canvas.drawLayer.pixelmap.pixels);
        //Clients should now have onUpdateScene called
    }
}