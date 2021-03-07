const encode = require('image-encode');

export default class SmartTexture extends PIXI.RenderTexture {

    /**
     * Encodes the data currently stored in the texture buffer into a PNG buffer
     * @return {Buffer}
     */
    EncodeToPNG() {
        let bytes = [];
        let buffer;
        try{
            bytes = Array.from(this._getRawTextureData());
            console.log("Got the raw texture data!");
            var a = encode([bytes], [this.width, this.height], 'png'); //there seems to be a max file size limit here, 7000x7000 is apparently too big. might need to do it async
            console.log("texture has been encoded");
            buffer = Buffer.from(a);
        }
        catch(e){
            console.log("FAILED TO GET RAW TEXTURE DATA!");
            console.log(e);
        }
        return buffer;
    }
    _getRawTextureData() { //target = rendertexture, hopefully
        return this._readPixels(0,0,this.width, this.height);
    }
    _readPixels(x, y, width, height) { //renderer = canvas.app
        const { renderer } = canvas.app; //lets just set this here, for now
        let resolution;
        let renderTexture = this;
        if (renderTexture) {
            resolution = renderTexture.baseTexture.resolution;
            renderer.renderTexture.bind(renderTexture);
        }
        else{
            console.error("Failed to collect renderTexture in readPixels");
        }
        const pixels = new Uint8Array(width*height*4);
        // read pixels to the array
        const { gl } = renderer;
        //Do we mult width & height with resolution aswell?
        gl.readPixels(x * resolution, y * resolution, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
    }
    _getPixel(byteArray, x, y, width, bytesPerPixel=4){
        const i = ((width*y)+x) * bytesPerPixel;
        return [byteArray[i], byteArray[i+1], byteArray[i+2], byteArray[+3]];
    }
    Resize(width, height){super.resize(width, height, true);}
    /**
     * 
     * @param {number} width 
     * @param {number} height 
     * @param {PIXI.SCALE_MODES} scaleMode 
     * @param {number} resolution 
     */
    static create(width, height, scaleMode=1, resolution=1)
    {
       /* eslint-disable prefer-rest-params */
       const options = {
            width: width,
            height: height,
            scaleMode: scaleMode,
            resolution: resolution,
        };
        /* eslint-enable prefer-rest-params */
        //var brt = new PIXI.BaseRenderTexture(300,300, PIXI.SCALE_MODES.NEAREST, 1);
        return new SmartTexture(new PIXI.BaseRenderTexture(options));
    }

    static LoadRawTextureData(buffer, width, height, apply=true){ //Buffer must eba UInt8Array
        const tex = PIXI.Texture.fromBuffer(buffer,width,height);
        const sprite = new PIXI.Sprite(tex);
        //Great, we now have a sprite with the correct pixels
        //Now we need to apply this sprite onto the rendertexture
        var rt = canvas.drawLayer.maskTexture;
        const gl = canvas.app;
        gl.renderer.render(sprite, rt);
    }
    /**
     * 
     * @param {Uint8ClampedArray} buffer 
     * @param {number} bufferWidth 
     * @param {number} bufferHeight 
     * @param {PIXI.settings.SCALE_MODE} scaleMode 
     */
    static Sample(buffer, bufferWidth, bufferHeight, scaleMode) //PIXI.settings.SCALE_MODE or LINEAR
    {
        //Create a fresh texture from the buffer. Will have the same size as the buffer.
        const options = { scaleMode: scaleMode };
        const tex = PIXI.Texture.fromBuffer(buffer, bufferWidth, bufferHeight, options);
        console.log("Tex: ");
        console.log(tex);
        //Read the pixels from that new texture
        const sampled = this.readPixelsFromTexture(tex, scaleMode, bufferWidth, bufferHeight,0,0);
        return sampled;
    }
    static readPixelsFromTexture(inputTexture, scaleMode, targetW, targetH, x = 0, y = 0) {
        const { renderer } = canvas.app;
        let resolution = 1;
        let renderTexture;
        //If inputted texture is not a renderTexture, we need to create a rendertexture around it
        let generated = false;
        if (inputTexture instanceof PIXI.RenderTexture) { renderTexture = inputTexture; }
        else {
            //If inputTexture is not a Sprite, we need to create a Sprite around the input texture first
            //DEBUG: Assume its not a sprite for now
            let sprite = new PIXI.Sprite(inputTexture);
            renderTexture = renderer.generateTexture(/*inputTexture*/sprite, scaleMode); //Returns a RenderTexture
            generated = true;
        }

        if (renderTexture) {
          resolution = renderTexture.baseTexture.resolution;
          renderer.renderTexture.bind(renderTexture);
        }
        const pixel = new Uint8Array(targetW*targetH*4);
        // read pixels to the array
        const { gl } = renderer;
        console.log("DisplayObject: "); console.log(renderTexture);
        gl.readPixels(x * resolution, y * resolution, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        if (generated) { renderTexture.destroy(true); }
        return pixel;
      }
    static get_gl(){return canvas.app; }
}