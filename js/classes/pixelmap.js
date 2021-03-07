import { createThAWImage, resampleImage, ResamplingMode } from "thaw-image-processing.ts";
import { hexToColor, webToHex } from "../helpers";
import Color32 from "./color32";
import DrawLayer from "./drawlayer";
import { LayerSettings } from "./layerSettings";
import SmartTexture from "./smarttexture";
import { Stroke } from "./tools/stroke";
import { StrokePart } from "./tools/strokePart";

export default class PixelMap {

    constructor(width, height, options) {
        this.defaultColor = hexToColor(webToHex(LayerSettings.DefaultBackgroundColor())); //DEFAULT COLOR OF THE PIXELMAP
        this.texture = this._newTexture(width, height);
        this._reform(width, height, this.defaultColor);
        //Wont have any effect until ApplyPixels() is called
    }
    
    /**
     * Replaces the current pixel buffer with the one provided. Resizes the entire texture if needed.
     * Auto-applying pixels to texture is optional (default true).
     * @param {Uint8ClampedArray} buffer 
     * @param {number} bufferWidth 
     * @param {number} bufferHeight 
     * @param {boolean} applyPixels 
     */
    ReadFromBuffer(buffer, bufferWidth, bufferHeight, applyPixels=true) {
        //Simple check to make sure the buffer is the same size as stated
        if(buffer==undefined){console.error("buffer is undefined!");}
        if(buffer.length===NaN){console.error("Buffer does not have a length property, are you sure its really a Uint8ClampedArray?"); return;}
        if(buffer.length != (bufferWidth*bufferHeight*4)){console.error("Buffer is of the wrong size! Its size is " + buffer.length + ", and we expected one of size " + (bufferWidth*bufferHeight*4) + " (for our "+this.width+"x"+this.height +" texture)"); return;}
        //We will essentially replace our pixel buffer with theirs
        this.pixels = buffer; //assume its a uin8clamped array, rgba32 format
        if((this.width!==bufferWidth)||(this.height!==bufferHeight)) //See if this buffer is of a different size then our current one
        {
            this.width = bufferWidth; this.height = bufferHeight;
            //the texture needs to be resized
            this.texture.Resize(this.width, this.height);
        }
        if(applyPixels) { this.ApplyPixels(); }
    }
    /**
     * Reads the buffer and resizes the pixelmap to be of size toWidth x toHeight.
     * Useful in cases where you have a pixel buffer of a larger or smaller size then the intended output texture size, and you want to do some rescaling.
     * Auto-applying pixels to texture is optional (default true).
     * @param {Uint8ClampedArray} buffer 
     * @param {number} bufferWidth 
     * @param {number} bufferHeight 
     * @param {boolean} applyPixels 
     */
    ReadFromBuffer_Scaled(buffer, bufferWidth, bufferHeight, toWidth, toHeight, applyPixels = true)
    {
        //Simple check to make sure the buffer is the same size as stated
        if(buffer.length != (bufferWidth*bufferHeight*4)){console.error("buffer is of the wrong size!"); return;}
        //Create a new scaled down texture (our width/height), which used the buffer. Once the texture is made, we read our scaled buffer from it

        const srcImage = createThAWImage(bufferWidth, bufferHeight, 4, 4*bufferWidth, buffer);
        const dstImage = resampleImage(
            srcImage,
            toWidth,
            toHeight,
            ResamplingMode.NearestNeighbour //Bilinear or NearestNeighbour
        );
        this.ReadFromBuffer(dstImage.data, toWidth, toHeight, applyPixels);
    }
    /**
     * 
     * @param {number} width 
     * @param {number} height 
     * @param {Color32} color 
     * @param {boolean} applyPixels 
     */
    Reform(width, height, color, applyPixels=true)
    {
        if(width<1||height<1){
            console.error("Cannot reform pixelmap, width & height are out of range! Width: " + width + ", Height: " + height);
            return;
        }
        this._reform(width, height, color);
        if(applyPixels) { this.ApplyPixels(); }
    }
/**
     * 
     * @param {number} width 
     * @param {number} height 
     * @param {Color32} color 
     */
    _reform(width, height, color) {
        this.width = width; this.height = height;
        this.pixels = new Uint8ClampedArray(width*height*4);
        for(var i = 0; i < this.pixels.length; i+=4)
        {
            this.pixels[i] = color.r;
            this.pixels[i+1] = color.g;
            this.pixels[i+2] = color.b;
            this.pixels[i+3] = color.a;
        }
        if((this.width!=this.texture.width)||(this.height!=this.texture.height)) //Resize texture if needed
        {
            this.texture.Resize(this.width, this.height);
        }
        //Apply pixels should be called from elsewhere after this
    }
    /**
     * Returns a pixel from the buffer
     * @param {number} x 
     * @param {number} y 
     * @returns {Color32}
     */
    GetPixel(x, y) { return this._getPixel_i4(this._xy_to_i4(x,y)); }
    /**
     * Returns the pixels in a rectangle
     * @param {number} x 
     * @param {number} y 
     * @param {number} areaWidth 
     * @param {number} areaHeight 
     */
    GetPixelsRect(x, y, areaWidth, areaHeight) {

        var l = new Uint8ClampedArray[(w * h * 4)];
        for(i = 0; i < areaWidth; ++i)
        {
            for (j = 0; j < areaHeight; ++j)
            {
                let ix = (((j+y) * this.width) + (i+x)) * 4;
                let ix2 = ((j * w) + i) * 4;
                l[ix2] = this.pixels[ix];
                l[ix2+1] = this.pixels[ix+1];
                l[ix2+2] = this.pixels[ix+2];
                l[ix2+3] = this.pixels[ix+3];
            }
        }
        return l;
    }
    _setPixel(x, y, color){
        this._setPixel_i4(this._xy_to_i4(x,y), color);
    }
    _setPixel_i4(i4, color){
        this.pixels[i4] = color.r;
        this.pixels[i4 + 1] = color.g;
        this.pixels[i4 + 2] = color.b;
        this.pixels[i4 + 3] = color.a;
    }
    _getPixel_i4(i4) {
        return new Color32(this.pixels[i4], this.pixels[i4 + 1], this.pixels[i4 + 2], this.pixels[i4 + 3]);
    }
    _xy_to_i4(x,y){return ((y * this.width) + x) * 4;}
    /**
     * Draw a single pixel
     * @param {number} x 
     * @param {number} y 
     * @param {Color32} color 
     * @param {boolean} autoApply 
     */
    DrawPixel(x, y, color, autoApply=false) {
        this._setPixel(x,y,color);
        if(autoApply){ this.ApplyPixels();}
    }
     /**
     * Draw a rectangle
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h
     * @param {Color32} col 
     * @param {boolean} autoApply 
     */
    DrawRect(x, y, w, h, col, autoApply=false)
    {
        //console.log("Draw rect at " + x + "," + y + " : " + w + "," + h);
        if (x < 0 || y < 0 || ((w * h * 4) > this.pixels.Length)) {
            console.error("Rect is too big or out of bounds");
            console.error((w * h) + " pixels are needed to fill the rect, but we only have " + (this.pixels.Length / 4));
        }
        for (let i = 0; i < w; ++i)
        {
            for (let j = 0; j < h; ++j)
            {
                let gx = (i+x);
                let gy = (j+y);
                if(gx<0||gx>=this.width||gy<0||gy>=this.height) { continue; }
                let ix = ((gy * this.width) + gx) * 4;
                this.pixels[ix] = col.r;
                this.pixels[ix + 1] = col.g;
                this.pixels[ix + 2] = col.b;
                this.pixels[ix + 3] = col.a;
            }
        }
        if (autoApply) { console.log("Applying"); this.ApplyPixels(); }
    }
    /**
     * Draw an ellipse
     * @param {number} x 
     * @param {number} y 
     * @param {number} brushSize 
     * @param {Color32} color 
     * @param {boolean} autoApply 
     */
    DrawEllipse(x, y, brushSize, color, autoApply=false)
    {
        if(brushSize===undefined){console.error("BrushSize is undefined!");}
        const useAdditiveColors = false;
        if(brushSize <= 1) { this.DrawPixel(x, y, color, autoApply); /*return new Array(((this.width * y) + x)*4);*/ }

        var pixel_i4 = 0;
        let edits = []; //int array

        const radius = brushSize/2;
        const radiusSquared = radius*radius;
        let sx = x-radius;
        let sy = y-radius;
        for(let i = 0; i < (radius*2)+1; ++i) {
            let ex = sx + i; //point
            let dx = ex - x; //distance
            for(let j = 0; j < (radius*2)+1; ++j) {
                let ey = sy + j; //point
                let dy = ey - y; //distance
                if(ex<0||ex>=this.width||ey<0||ey>=this.height){continue;}
                let distanceSquared = Math.abs(dx * dx + dy * dy);
                if(distanceSquared<=radiusSquared) {

                    pixel_i4 = ((this.width * ey) + ex) * 4;
                    edits.push(pixel_i4);
                    this._setPixel_i4(pixel_i4, color);
                }
            }
        }

        if (autoApply) { this.ApplyPixels(); }
    }

    /**
     * 
     * @param {{type:string, color:Color32, cellBased:boolean, brushSize: number, x:number, y:number, width:number, height:number, xyCoords:{x:number, y:number}[]}[]} parts 
     * @param {boolean} autoApply 
     */
    DrawStrokeParts(parts, autoApply=true) {
        //todo: check against duplicate coordinates
        for(let i = 0; i < parts.length; ++i)
        {
            let p = parts[i];
            if(p.type=="circle") {
                if(p.cellBased) {
                    
                }
                else{
                    for(let j = 0; j < p.xyCoords.length; ++j) {
                        this.DrawEllipse(p.xyCoords[j].x, p.xyCoords[j].y, p.brushSize, p.color, false);
                    }
                }
            }
            else if(p.type=="grid") {
                const gridSize = LayerSettings.pixelsPerGrid;
                for(let j = 0; j < p.xyCoords.length; ++j){
                    let cellCoords = p.xyCoords[j];
                    //Convert to pixel coords
                    this.DrawRect(cellCoords.x * gridSize, cellCoords.y * gridSize, gridSize, gridSize,
                        p.color, false);
                }
            }
            else if(p.type=="rect"){
                if(p.cellBased){

                }
                else{
                    this.DrawRect(p.x, p.y, p.width, p.height, p.color, false);
                }
            }
        }
        //Apply the pixels (renders the texture to the sprite)
        if(parts.length>0 && autoApply) { this.ApplyPixels(); }
        //canvas.drawLayer.update();
    }
    /**
     * 
     * @param {Stroke[]} strokes 
     * @param {boolean} autoApply 
     */
    DrawStrokes(strokes, autoApply=true)
    {
        let parts = [];
        console.log(strokes);
        for(let i = 0; i < strokes.length; ++i)
        {
            var steps = strokes[i].GetSteps(false);
            if(steps.length>0){
                parts.push(new StrokePart(steps, strokes[i].brushSize, strokes[i].color, strokes[i].cellBased));
            }
        }
        this.DrawStrokeParts(parts, false);
        if(parts.length>0&&autoApply){this.ApplyPixels();}
    }
    
    /**
     * Applies the texture buffer (including any recent changes) to the rendered texture in the scene
     */
    ApplyPixels() {
        const gl = canvas.app;
        const tex = PIXI.Texture.fromBuffer(this.pixels, this.width, this.height);
        const sprite = new PIXI.Sprite(tex);

        //Great, we now have a sprite with the correct pixels
        //Now we need to apply this sprite onto the rendertexture somehow

        var rt = this.texture;//canvas.drawLayer.maskTexture;
        gl.renderer.render(sprite, rt);
        sprite.destroy();
        tex.destroy();
    }
    /**
     * Does a health check on the base texture, and tries to recreate it if its missing
     */
    checkHealth(){
        let needsTextureRepair = false;
        if(this.texture==null||this.tex==undefined){needsTextureRepair=true;}
        else if(this.texture.baseTexture==null||this.texture.baseTexture==undefined){needsTextureRepair=true;}

        if(needsTextureRepair){
            console.error("Pixelmap.texture seems to have been destroyed! Replacing...");
            this.RecreateTexture();
            this.ApplyPixels();
        }
    }
    RecreateTexture(){
        this.texture = this._newTexture(this.width, this.height);
    }
    /**
     * 
     * @param {number} width 
     * @param {number} height 
     * @param {PIXI.SCALE_MODES} scaleMode 
     */
    _newTexture(width, height, scaleMode=PIXI.SCALE_MODES.NEAREST){
        return SmartTexture.create(width, height, scaleMode); //Format should be RGBA32, i think
    }

    _sample(source, fromArea, newWidth, newHeight, scaleMode)
    {
        const rawTex = SmartTexture.Sample(source, newWidth, newHeight, scaleMode);
        return rawTex;
    }
}