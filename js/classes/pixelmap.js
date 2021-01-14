import { createThAWImage, resampleImage, ResamplingMode } from "thaw-image-processing.ts";
import Color32 from "./color32";
import SmartTexture from "./smarttexture";

export default class PixelMap {

    constructor(width, height, options) {
        this.defaultColor = new Color32(255,255,0,255);
        this.texture = this._newTexture(width, height);
        this._reform(width, height, this.defaultColor);
    }

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
            this.texture.resize(this.width, this.height);
        }
        //Set texture filtermode to point?
        //this.ApplyPixels();
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
        if(buffer.length != (bufferWidth*bufferHeight*4)){console.error("buffer is of the wrong size!"); return;}
        //We will essentially replace our pixel buffer with theirs
        this.pixels = buffer; //assume its a uin8clamped array, rgba32 format
        if((this.width!=bufferWidth)||(this.height!=bufferHeight)) //See if this buffer is of a different size then our current one
        {
            this.width = bufferWidth; this.height = bufferHeight;
            //the texture needs to be resized
            this.texture.resize(this.width, this.height);
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
        //const newBuffer = this.sample(buffer, {width:bufferWidth, height:bufferHeight}, this.width, this.height, PIXI.settings.SCALE_MODE.NEAREST);
        //this.ReadFromBuffer(newBuffer, this.width, this.height, applyPixels);

        //BytesPerLine might be wrong, no idea
        console.log("Resampling a "+bufferWidth+"x"+bufferHeight+" texture to a "+toWidth+"x"+toHeight+" texture");
        const srcImage = createThAWImage(bufferWidth, bufferHeight, 4, 4*bufferWidth, buffer);
        const dstImage = resampleImage(
            srcImage,
            toWidth,
            toHeight,
            ResamplingMode.NearestNeighbour //Bilinear or NearestNeighbour
        );
        this.ReadFromBuffer(dstImage.data, toWidth, toHeight, applyPixels);
    }
    Reform(width, height, color, applyPixels=true)
    {
        this._reform(width, height, color);
        if(applyPixels) { this.ApplyPixels(); }
    }


    GetPixel(x, y) {
        const i = ((y * width) + x) * 4;
        return new Color32(this.pixels[i], this.pixels[i + 1], this.pixels[i + 2], this.pixels[i + 3]);
    }
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
    DrawPixel(x, y, color, autoApply=false) {
        this._setPixel(x,y,color);
        if(autoApply){ this.ApplyPixels();}
    }
    DrawRect(x, y, w, h, col, autoApply=false)
    {
        //console.log("Draw rect at " + x + "," + y + " : " + w + "," + h);
        if (x < 0 || y < 0 || ((w * h * 4) > this.pixels.Length)) {
            console.error("Rect is too big or out of bounds");
            console.error((w * h).ToString() + " pixels are needed to fill the rect, but we only have " + (this.pixels.Length / 4));
        }
        for (let i = 0; i < w; ++i)
        {
            for (let j = 0; j < h; ++j)
            {
                let ix = (((j + y) * this.width) + (i + x)) * 4;
                this.pixels[ix] = col.r;
                this.pixels[ix + 1] = col.g;
                this.pixels[ix + 2] = col.b;
                this.pixels[ix + 3] = col.a;
            }
        }
        if (autoApply) { this.ApplyPixels(); }
    }
    DrawCircle(x, y, brushSize, color, autoApply=false)
    {
        if(brushSize===undefined){console.error("BrushSize is undefined!");}
        const useAdditiveColors = false;
        if(brushSize <= 1) { this.DrawPixel(x, y, color, autoApply); return new Array(((this.width * y) + x)*4); }
        //else if(brushSize< 1) { return new int[0]; }

        const brushSq = brushSize * brushSize;
        const brushX4 = brushSq << 2;
        const brushX1 = brushSize << 1;

        var pixel_i4 = 0;
        let edits = []; //int array

        for (let i = 0; i < brushX4; i++)
        {
            let tx = (i % brushX1) - brushSize;
            let ty = Math.floor(i / brushX1) - brushSize;

            if (tx * tx + ty * ty > brushSq) continue;
            if (x + tx < 0 || y + ty < 0 || x + tx >= this.width || y + ty >= this.height) continue; // temporary fix for corner painting

            pixel_i4 = (this.width * (y + ty) + x + tx) << 2;
            edits.push(pixel_i4);

            if (useAdditiveColors)
            {
                //if (!useLockArea || (useLockArea && lockMaskPixels[pixel] == 1))
                //{
                    //pixels[pixel] = ByteLerp(pixels[pixel], paintColor.r, alphaLerpVal);
                    //pixels[pixel + 1] = ByteLerp(pixels[pixel + 1], paintColor.g, alphaLerpVal);
                    //pixels[pixel + 2] = ByteLerp(pixels[pixel + 2], paintColor.b, alphaLerpVal);
                    //pixels[pixel + 3] = ByteLerp(pixels[pixel + 3], paintColor.a, alphaLerpVal);
                //}
            }
            else
            { // no additive, just paint my color
                //if (!useLockArea || (useLockArea && lockMaskPixels[pixel] == 1))
                //{
                this._setPixel_i4(pixel_i4, color);
                //}
            } // if additive
        } // for area

        if (autoApply) { this.ApplyPixels(); }
        return edits;
    }
    _setPixel(x, y, color){
        const i4 = ((y * this.width) + x) * 4;
        this._setPixel_i4(i4, color);
    }
    _setPixel_i4(i4, color){
        this.pixels[i4] = color.r;
        this.pixels[i4 + 1] = color.g;
        this.pixels[i4 + 2] = color.b;
        this.pixels[i4 + 3] = color.a;
    }
    ApplyPixels() {
        const gl = canvas.app;
        const tex = PIXI.Texture.fromBuffer(this.pixels, this.width, this.height);
        //console.log("tex: " + (tex!==undefined));
        const sprite = new PIXI.Sprite(tex);
        //console.log("sprite: " + (sprite!==undefined));

        //Great, we now have a sprite with the correct pixels
        //Now we need to apply this sprite onto the rendertexture somehow

        //gl.stage.addChild(sprite);
        var rt = this.texture;//canvas.drawLayer.maskTexture;
        gl.renderer.render(sprite, rt);
        sprite.destroy();
        tex.destroy();
    }
    recreateTexture(){
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
    RenderBrush(brush){
        this._brushToBuffer(brush);
        //canvas.app.renderer.render(brush, this.texture, false, null, false);
    }
    _brushToBuffer(brush)
    {
        //console.log(brush);
        //const pixelX = Math.round(brush.x/50);
        //const pixelY = Math.round(brush.y/50);
        //console.log({x:pixelX, y:pixelY});
        this.DrawPixel(brush.x, brush.y, brush.fill, true);
        //this.DrawRect(0,0,50,50, brush.fill, true);
    }

    sample(source, fromArea, newWidth, newHeight, scaleMode)
    {
        const rawTex = SmartTexture.Sample(source, newWidth, newHeight, scaleMode);
        return rawTex;
    }
}