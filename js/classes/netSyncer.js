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
    static async onRecieveTexture() {
        if(NetSyncer.isMaster) { return; }
        console.log("Recieved notice that image file has been refreshed. Loading image file...");
        var a = await NetSyncer.loadImageFile();
        let settings = getSetting("drawlayerinfo");

        let e = await LayerSettings.LoadFromBuffer(settings, a.buffer, a.width, a.height);
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
        let strokeHistory = getSetting("strokes"); //Existing array of Strokes
        if(!strokeHistory) { strokeHistory = []; } //Create new array if none exists

        let a = []; //New, merged array of Strokes
        for(let i = 0; i < strokeHistory.length; ++i) { a.push(strokeHistory[i]); }
        for(let i = 0; i < strokes.length; ++i)
        {
            //const encoded = this._encodeStroke(strokes[i]);
            a.push(strokes[i]);
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
        let s = new Stroke(data.type, data.brushSize, data.color, data.cellBased);
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
            //a.push(this._decodeStroke(sceneFlagStrokeHistory[i]));    
            a.push(sceneFlagStrokeHistory[i]);   
        }
        return a;
    }
    /**
     * Undo the last stroke
     */
    static async UndoLast() {
        let strokeHistory = getSetting("strokes"); //Existing array of Strokes
        if(!strokeHistory || strokeHistory.length<1) { console.log("stroke history null"); return; }

        //Tell our client to rollback to base texture, then draw all strokes except the last one
        //Get settings
        let settings = getSetting("drawlayerinfo");
        if(!settings){return;}
        console.log(strokeHistory);
        //settings should contain a reference to the base texture, we want the buffer from that
        if(settings.hasimg) {
            var {data, width, height} = await pixels('/betterdraw/uploaded/' + settings.imgname);
            //Then we tell the pixelmap to load from the buffer
            //warning: if base texture size and pixelmap size dont match, we might have a problem
            //could use readfrombuffer_scaled
            let buffer = Uint8ClampedArray.from(data);
            console.log("data:");
            //console.log(buffer[0]+", "+buffer[1]+", "+buffer[2]);
            console.log(buffer);
            canvas.drawLayer.pixelmap.ReadFromBuffer(buffer, width, height, false); //dont apply yet
        }
        //if we cant get ahold of the base texture (we should), then see if the settings has a backgroundcolor, and create a buffer from that
        else {
            console.log("no base texture found in settings, cannot undo"); return;
        }
        
        strokeHistory.splice(strokeHistory.length-1, 1); //Remove the latest stroke from the history
        //Draw the strokes onto the pixelmap
        canvas.drawLayer.pixelmap.DrawStrokeParts(strokeHistory, false);
        canvas.drawLayer.pixelmap.ApplyPixels();//and apply
    }
}