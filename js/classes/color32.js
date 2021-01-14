import { hexToColor, webToHex } from "../../simplefog/helpers";

export default class Color32 {

    //r;g;b;a;
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
    static fromHex(hex)
    {
        return hexToColor(hex);
    }
    static fromWeb(web)
    {
        return hexToColor(webToHex(web));
    }
}
