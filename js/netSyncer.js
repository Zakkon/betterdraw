import { setSetting, getSetting, getStrokes, getLayerSettings, setLayerSettings, setStrokes } from "./settings";
import { LayerSettings } from "./layer/layerSettings";
import LoadAction from "./loadAction";
import { Stroke } from "./syncing/stroke";
import { getDrawLayer, hexToColor, redrawScene, webToHex } from "./helpers";
import Color32 from "./color32";
var pixels = require('image-pixels');

export class NetSyncer {
//Assumes there is only one GM in the session, and that he is authorative when it comes to drawing
    /**
     * Returns true if the local client is the GM.
     */
    static get isMaster() { return game.user.isGM; }

    static ParseMessage(data){
        switch(data.event){
            case "onClientJoin": //A new client has just connected/reloaded their scene
              if(NetSyncer.isMaster) { NetSyncer.onClientJoin(); }
              break;
            case "strokeparts":
              NetSyncer.RpcStrokeUpdatesRecieved(data.parts);
              break;
            case "layerCreated": NetSyncer.RpcOnLayerCreated(data.sceneID); break;
            case "layerDestroyed": NetSyncer.RpcOnLayerDestroyed(data.sceneID); break;
            case "texturerefreshed": NetSyncer.onRecieveTexture(); break;
            case "undo": NetSyncer.RpcSendUndo();
            default: console.error("message event " + data.event + " is not recognized"); break;
          }
    }

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
        //Fetch layer info from sceneflags
        const settings = getLayerSettings();
        if(settings.active && settings.hasBuffer) {
          //The layer is active, and a buffer has been cached
          const buffer = getSetting("buffer");
          var bufferArray = LayerSettings.bufferToUint8ClampedArray(buffer);
          const pixelmap = canvas.drawLayer.pixelmap;
          console.log(pixelmap.width*pixelmap.height);
          pixelmap.ReadFromBuffer(bufferArray, pixelmap.width, pixelmap.height, true);
        }
        else if(!settings.active) {
            //Layer is not active. Do nothing.
         }
        else  {console.error("Layer did not have a buffer ready for us");}
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
        //Recieved notice from the GM that the source layer image has been refreshed. Fetching it from the server...
        var img = await NetSyncer.loadImageFile();
        let settings = await getLayerSettings();
        //Refresh our local version of the layersettings (is there even such a thing as that?) to include the buffer from the source layerimage
        let e = await LayerSettings.LoadFromBuffer(settings, img.buffer, img.width, img.height);
        //Perform a loadaction, to refresh the layer object texture, and make sure everthing is ready to go
        let task = new LoadAction();
        task.Perform(e);
    }
    static async loadImageFile() {
        var {data, width, height} = await pixels('/betterdraw/uploaded/image.png');
        //console.log(data);
        return {buffer: data, width: width, height: height};
    }

    /**
     * Called by the authorative client whenever a stroke has finished and its effects have been applied onto the pixelmap
     */
    static onStrokeEnd() {
        if(!NetSyncer.isMaster) { return; }
       
        //this.updateSceneFlags(); //lazy
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

    static CmdSendUndo(){
        if(!NetSyncer.isMaster){return;}
        this.UndoLast(); //Call it here on my local end
        game.socket.emit('module.betterdraw', {event: "undo"});
    }
    static RpcSendUndo(){
        if(NetSyncer.isMaster){return;}
        this.UndoLast();
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
    static CmdSendRedo(){
        if(!NetSyncer.isMaster){return;}
        game.socket.emit('module.betterdraw', {event: "redo"});
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

    static CmdOnLayerCreated() {
        if(!NetSyncer.isMaster){return;}
        let sceneID = canvas.scene.id;
        game.socket.emit('module.betterdraw', {event: "layerCreated", sceneID: sceneID});
    }
    static RpcOnLayerCreated(sceneID){
        if(NetSyncer.isMaster){return;}
        //Only redraw if i am on the same scene as the one that just had its layer created
        console.log("Recieved onlayercreated");
        let mySceneID = (canvas? (canvas.scene? canvas.scene.id : undefined) : undefined);
        if(mySceneID==undefined || mySceneID==sceneID) { redrawScene();}
    }
    static CmdOnLayerDestroyed() {
        if(!NetSyncer.isMaster){return;}
        let sceneID = canvas.scene.id;
        game.socket.emit('module.betterdraw', {event: "layerDestroyed", sceneID: sceneID});
    }
    static RpcOnLayerDestroyed(sceneID){
        if(NetSyncer.isMaster) { return; }
        //Only redraw if i am on the same scene as the one that just had its layer destroyed
        console.log("Recieved onlayerdestroyed");
        let mySceneID = (canvas? (canvas.scene? canvas.scene.id : undefined) : undefined);
        if(mySceneID==undefined || mySceneID==sceneID) { redrawScene();}
    }
}