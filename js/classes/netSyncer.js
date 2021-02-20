import { setSetting, getSetting, getStrokes, getLayerSettings, setLayerSettings, setStrokes } from "../settings";
import { savePNG } from "../classes/serializiation/saveload.js";
import { LayerSettings } from "./layerSettings";
import LoadAction from "./loadAction";
import { Stroke } from "./tools/stroke";
import { getDrawLayer, hexToColor, webToHex } from "../helpers";
import Color32 from "./color32";
var pixels = require('image-pixels');

export class NetSyncer {
//Assumes there is only one GM in the session, and that he is authorative when it comes to drawing
    /**
     * Returns true if the local client is the GM.
     */
    static get isMaster() { return game.user.isGM; }

    /**
     * Called from the onReady hook in Foundry
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
        //A client (not the GM) has hotjoined the session
        //GM does not need to do anything here, since the client will handle texture syncing themselves
        //Client will load texture from server
        //And then load strokes from scene flags, and apply them
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
    
    
    static CmdSendRedo(){
        if(!NetSyncer.isMaster){return;}
        game.socket.emit('module.betterdraw', {event: "redo"});
    }

    /**
    * 
    * @param {{type:string, color:Color32, brushSize:number cellBased:boolean, xyCoords:{x:number, y:number}[], x:number, y:number, width:number, height:number }[]} parts 
    */
    static CmdSendStrokeUpdates(parts){
        if(!NetSyncer.isMaster){return;}
        //going to straightup just send the parts as they are
        game.socket.emit('module.betterdraw', {event: "strokeparts", parts: parts});
    }
     /**
    * 
    * @param {{type:string, color:Color32, brushSize:number cellBased:boolean, xyCoords:{x:number, y:number}[], x:number, y:number, width:number, height:number }[]} parts 
    */
    static RpcStrokeUpdatesRecieved(parts){
        if(NetSyncer.isMaster){return;}
        //Tell the pixelmap to draw according to these instructions
        //Todo: make a timestamp comparison, to make sure we arent drawing out-of-date instructions
        let layer = getDrawLayer();
        layer.pixelmap.DrawStrokeParts(parts);
    }

    static async loadImageFile() {
        var {data, width, height} = await pixels('/betterdraw/uploaded/image.png');
        //console.log(data);
        return {buffer: data, width: width, height: height};
    }
    /**
    * Logs strokes to history, so they can be used in the Undo process later
    * @param {Stroke[]} strokes
    */
    static LogPastStrokes(strokes)
    {
        if(!NetSyncer.isMaster){return;}
        let strokeHistory = getStrokes(); //Existing array of Strokes
        if(!strokeHistory) { strokeHistory = []; } //Create new array if none exists
       

        let a = []; //New, merged array of Strokes
        for(let i = 0; i < strokeHistory.length; ++i) { a.push(strokeHistory[i]); }
        for(let i = 0; i < strokes.length; ++i)
        {
            //const encoded = this._encodeStroke(strokes[i]);
            a.push(strokes[i]);
        }

        setStrokes(a);
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

    static CmdSendUndo(){
        if(!NetSyncer.isMaster){return;}
        game.socket.emit('module.betterdraw', {event: "undo"});
    }
    /**
     * Undo the last stroke
     */
    static async UndoLast() {
        let strokeHistory = getStrokes(); //Existing array of Strokes
        if(!strokeHistory || strokeHistory.length<1) { return; } //Stroke histoy needs to exist
        //Tell our client to rollback to base texture, then draw all strokes except the last one
        //Get settings
        let settings = await getLayerSettings();
        if(!settings) { return; } //Need layersettings to continue
        let layer = getDrawLayer();
        //Settings should contain a reference to the base texture, we want the buffer from that
        if(settings.hasImageFile) {
            var {data, width, height} = await pixels('/betterdraw/uploaded/' + settings.imageFilename);
            //Then we tell the pixelmap to load from the buffer
            //warning: if base texture size and pixelmap size dont match, we might have a problem
            //could use readfrombuffer_scaled
            let buffer = Uint8ClampedArray.from(data);
            layer.pixelmap.ReadFromBuffer(buffer, width, height, false); //dont apply pixels yet
        }
        //if we cant get ahold of the base texture (we should), then see if the settings has a backgroundcolor, and create a buffer from that
        else {
            //Fill the entire texture with the background color
            layer.pixelmap.DrawRect(0,0, layer.pixelmap.width, layer.pixelmap.height, hexToColor(webToHex(settings.backgroundColor)), false); //Dont apply yet
        }
        
        strokeHistory.splice(strokeHistory.length-1, 1); //Remove the latest stroke from the history
        //Draw the strokes onto the pixelmap
        layer.pixelmap.DrawStrokeParts(strokeHistory, false);
        layer.pixelmap.ApplyPixels(); //and apply
    }

    /**
     * 
     * @param {boolean} visible 
     */
    static async CmdSetVisible(visible){
        if(!NetSyncer.isMaster){return;}
        //Change on my end first
        const l = getDrawLayer(); l.SetVisible(visible);
        //Save it in the layer settings
        let settings = getLayerSettings();
        if(settings!=null && (settings.isHidden == undefined || settings.isHidden == visible))
        {
            settings.isHidden = !visible;
            console.log("Saving visibility setting...");
            await setLayerSettings(settings);
        }
        game.socket.emit('module.betterdraw', {event: "setvis", value: visible});
    }
    static RpcSetVisible(visible){
        if(NetSyncer.isMaster){return;}
        const l = getDrawLayer(); l.SetVisible(visible);
    }
}