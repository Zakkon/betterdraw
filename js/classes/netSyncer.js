import { setSetting, getSetting } from "../settings";
import { savePNG } from "../classes/serializiation/saveload.js";
import { LayerSettings } from "./layerSettings";
import LoadAction from "./loadAction";
import { StrokePart } from "./tools/strokePart";
import { Stroke } from "./tools/stroke";
var pixels = require('image-pixels');

export class NetSyncer {
//Assumes there is only one GM in the session, and that he is authorative when it comes to drawing
    static get isMaster() { return game.user.isGM; }
    /**
     * Called from the isMaster hook in Foundry
     */
    static onReady() {
        if(!NetSyncer.isMaster)
        {
            console.log("Telling GM that I just joined...");
            game.socket.emit('module.betterdraw', {event: "onClientJoin"});
        }
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
    static async onClientJoin() {
        if(!NetSyncer.isMaster) { return; }
        /* console.log("Recieving texture request from client. Saving texture to file...");
        //Save the pixelmap to an image file, then send a message to the clients telling them to read from the image file
        let buffer = canvas.drawLayer.pixelmap.texture.encodeToPNG();
        await savePNG(buffer, "image.png", "betterdraw/uploaded");
        console.log("Sending texturerefreshed event...");
        game.socket.emit('module.betterdraw', {event: "texturerefreshed", imgname: "image.png"}); */

        //Send all past strokes to client
    }
    static async onRecieveTexture(){
        if(NetSyncer.isMaster) { return; }
        console.log("Recieved notice that image file has been refreshed. Loading image file...");
        var a = await NetSyncer.loadImageFile();
        let settings = getSetting("drawlayerinfo");
        let e = await LayerSettings.LoadFromBuffer(settings, a.buffer);
        let task = new LoadAction();
        task.Perform(e);
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

    static async loadImageFile() {
        var {data, width, height} = await pixels('/betterdraw/uploaded/image.png');
        //console.log(data);
        return {buffer: data, width: width, height: height};
    }
    /**
     * 
     * @param {Stroke[]} stroke 
     */
    static LogPastStrokes(strokes)
    {
        if(!NetSyncer.isMaster){return;}
        let strokeHistory = getSetting("strokes"); //Array of Strokes
        if(!strokeHistory) { strokeHistory = []; } //Create new array if none exists

        let a = [];
        for(let i = 0; i < strokeHistory.length; ++i)
        {a.push(strokeHistory[i]);}
        for(let i = 0; i < strokes.length; ++i)
        {
            const encoded = this._encodeStroke(strokes[i]);
            a.push(encoded);
        }

        setSetting("strokes", a);
    }
    /**
     * 
     * @param {Stroke} stroke 
     */
    static _encodeStroke(stroke){
        //assume circle for now
        let o = {};
        o.brushSize = stroke.brushSize;
        o.color = stroke.color;
        o.xyCoords = stroke.xyCoords;
        o.cellBased = stroke.cellBased;
        return o;
    }
    static _decodeStroke(data){
        let s = new Stroke(data.brushSize, data.color, data.cellBased);
        s.xyCoords = data.xyCoords;
        return s;
    }
    /**
     * 
     * @param {any[]} sceneFlagStrokeHistory 
     */
    static DecodeStrokes(sceneFlagStrokeHistory){
        let a = [];
        for(let i = 0; i < sceneFlagStrokeHistory.length; ++i){
            a.push(this._decodeStroke(sceneFlagStrokeHistory[i]));       
        }
        return a;
    }
}