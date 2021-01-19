import { colorToHex, hexToWeb } from "../../helpers";
import { setUserSetting } from "../../settings";
import BrushControls from "../BrushControls";

export default class EyedropperTool {


    constructor(name) {
        this.name = name;
    }

    onPointerDown(p, pixelPos, e){
        //Sample
        let pm = canvas.drawLayer.pixelmap;
        let pi = pm.GetPixel(pixelPos.x, pixelPos.y);
        console.log("Picked color: ");
        console.log(pi);
        let hex = colorToHex(pi);
        let web = hexToWeb(hex);
        setUserSetting('brushColor', web);
        BrushControls.singleton.refreshColor(web);
    }
    onPointerMove(p, pixelPos, e){

    }
    onPointerUp(p, pixelPos, e){
        
    }
}