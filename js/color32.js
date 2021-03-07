import { hexToColor, webToHex } from "./helpers";

export default class Color32 {

    //r: number
    //g: number
    //b: number
    //a: number
    
    constructor(red,green,blue,alpha=255)
    {
        this.r = this.clamp(red);
        this.g = this.clamp(green);
        this.b = this.clamp(blue);
        this.a = this.clamp(alpha);
    }
    clamp(value){
        if(value<0){return 0;}
        if(value>255){return 255;}
        return value;
    }
    /** 0x000000 string format to Color32 */
    static fromHex(hex) { return hexToColor(hex); }
    /** #FFFFFF format to Color32 */
    static fromWeb(web)
    {
        if(web===undefined){console.error("color is undefined!");}
        return hexToColor(webToHex(web));
    }
}
