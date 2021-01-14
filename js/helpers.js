import Color32 from "./classes/color32";

/**
 * Converts web colors to base 16
 * @param n {Hex}               Web format color, f.x. #FF0000
 * @return {Hex}                Base 16 format color, f.x. 0xFF0000
 */
export function webToHex(n) {
  return n.replace('#', '0x');
}

/**
 * Converts a base16 color into a web color
 * @param n {Hex}               Base 16 Color, f.x. 0xFF0000
 * @return {Hex}                Web format color, f.x. #FF0000
 */
export function hexToWeb(n) {
  return (`${n}`).replace('0x', '#');
}

/**
 * Converts a hexadecimal color to an integer percentage
 * @param n {Hex}               Base 16 Color, f.x. 0x000000
 * @return {Integer}             f.x 0
 */
export function hexToPercent(n) {
  return Math.ceil(n / 0xFFFFFF * 100);
}

/**
 * Wants a string in a 0x00000 format
 * Returns a Color32 in RGB format (no alpha channel unless present in the hex)
 * @param {string} hex 
 */
export function hexToColor(hex) { //Wants a color in a 0x000000 format
  var chunks = [];
  var tmp,i;
  hex = hex.substr(2); // remove the pound 
  if ( hex.length === 3){
      tmp = hex.split("");
      for(i=0;i<3;i++){
          chunks.push(parseInt(tmp[i]+""+tmp[i],16));
      }
  }else if (hex.length === 6){
      tmp = hex.match(/.{2}/g);
      for(i=0;i<3;i++){
          chunks.push(parseInt(tmp[i],16));
      }
  }else {
      throw new Error("'"+hex+"' is not a valid hex format");
  }
  var c = new Color32(chunks[0], chunks[1], chunks[2]);
  if(chunks.length>3){c.a = chunks[3];}
  return c;
}

/**
 * Converts an integer percent (0-100) to a hexadecimal greyscale color
 * @param n {Number}            0-100 numeric input
 * @return {Hex}                Base 16 format color, f.x. 0xFFFFFF
 */
export function percentToHex(n) {
  let c = Math.ceil(n * 2.55).toString(16);
  if (c.length === 1) c = `0${c}`;
  c = `0x${c}${c}${c}`;
  return c;
}

/**
 * Converts an object containing coordinate pair arrays into a single array of points for PIXI
 * @param hex {Object}  An object containing a set of [x,y] pairs
 */
export function hexObjsToArr(hex) {
  const a = [];
  hex.forEach((point) => {
    a.push(point.x);
    a.push(point.y);
  });
  // Append first point to end of array to complete the shape
  a.push(hex[0].x);
  a.push(hex[0].y);
  return a;
}

/**
 * Dumps a render of a given pixi container or texture to a new tab
 */
export function pixiDump(tgt = null) {
  canvas.app.render();
  const data = canvas.app.renderer.extract.base64(tgt);
  const win = window.open();
  win.document.write(`<img src='${data}'/>`);
}

/**
 * Prints formatted console msg if string, otherwise dumps object
 * @param data {String | Object} Output to be dumped
 * @param force {Boolean}        Log output even if CONFIG.debug.simplefog = false
 */
export function simplefogLog(data, force = false) {
  if (CONFIG.debug.simplefog || force) {
    // eslint-disable-next-line no-console
    if (typeof data === 'string') console.log(`Simplefog | ${data}`);
    // eslint-disable-next-line no-console
    else console.log('Simplefog |', data);
  }
}

/**
 * Gets a single pixel of texture data from GPU
 * @param target {Object} PIXI Object to read from
 * @param x {Integer}     X Position to read
 * @param y {Integer}     Y Position to read
 */
export function readPixel(target, x = 0, y = 0) {
  const { renderer } = canvas.app;
  let resolution;
  let renderTexture;
  let generated = false;
  if (target instanceof PIXI.RenderTexture) {
    renderTexture = target;
  }
  else {
    renderTexture = renderer.generateTexture(target);
    generated = true;
  }
  if (renderTexture) {
    resolution = renderTexture.baseTexture.resolution;
    renderer.renderTexture.bind(renderTexture);
  }
  const pixel = new Uint8Array(4);
  // read pixels to the array
  const { gl } = renderer;
  gl.readPixels(x * resolution, y * resolution, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  if (generated) {
    renderTexture.destroy(true);
  }
  return pixel;
}

/**
 * 
 * @param {number} pixelsPerGrid 
 * @param {number} textureWidth 
 * @param {number} textureHeight 
 * @param {number} sceneWidth 
 * @param {number} sceneHeight 
 */
export function calcGridImportSize(pixelsPerGrid, textureWidth, textureHeight){
  //The only unit we count for here is 'pixel'. All incoming parameters are measured by that unit.
  //The above parameters describe a *desired* bunch of settings, its out job to solve problems
  let texSize = {w:textureWidth, h:textureHeight};
  if(pixelsPerGrid<50) //Foundry doesnt allow for grid sizes < 50px
  {
    //if ppg = 1, s = 50
    //if ppg is 2, s = 25
    let s = 50/pixelsPerGrid;
    pixelsPerGrid = 50;
    texSize.w = Math.ceil(texSize.w * s);
    texSize.h = Math.ceil(texSize.h * s);
  }
  const sceneWidthInGrids = Math.ceil(texSize.w / pixelsPerGrid);
  const sceneHeightInGrids = Math.ceil(texSize.h / pixelsPerGrid);

  //todo: max grid size
  //or if gridsize > tex size

  return {pixelsPerGrid: pixelsPerGrid, texSize: texSize, sceneWidthInGrids:sceneWidthInGrids, sceneHeightInGrids: sceneHeightInGrids };
}