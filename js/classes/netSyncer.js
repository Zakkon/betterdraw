import { isMaster } from "cluster";
import { ENETUNREACH } from "constants";
import { setSetting } from "../settings";

export class NetSyncer {
//Assumes there is only one GM in the session, and that he is authorative when it comes to drawing
    static get isMaster() { return game.user.isGM; }
    static onReady() {
        
    }
    static onUpdateScene() {
        //The GM has the authorative version of the texture already, no need to fetch it from sceneflags
        if(NetSyncer.isMaster) { return; }
        this.refreshLayerTexture();
    }
    static refreshLayerTexture() {
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

    static onClientJoin() {
        if(!NetSyncer.isMaster) { return; }
    }
    /**
     * Called by the authorative client whenever a stroke has finished and its effects have been applied onto the pixelmap
     */
    static onStrokeEnd() {
        if(!NetSyncer.isMaster) { return; }
        //Apply the pixelmap buffer to the scene flags
        setSetting("buffer", canvas.drawLayer.pixelmap.pixels);
        //Clients should now have onUpdateScene called
    }
}