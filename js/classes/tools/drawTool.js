export default class DrawTool {


    constructor(name) {
        this.name = name;
    }

    onPointerDown(p, e){
        
    }
    onPointerMove(p, e){

    }
    onPointerUp(p, e){
        
    }
    renderBrush(data, save = true) {
      canvas.drawLayer.pixelmap.RenderBrush(data);
      return;
        const brush = this.brush(data);
        this.composite(brush);
        brush.destroy();
        //if (save) this.historyBuffer.push(data);
    }
    brush(data) {
        // Get new graphic & begin filling
        const alpha = typeof data.alpha === "undefined" ? 1 : data.alpha;
        const visible = typeof data.visible === "undefined" ? true : data.visible;
        const brush = new PIXI.Graphics();
        brush.beginFill(data.fill);
        // Draw the shape depending on type of brush
        switch (data.shape) {
          case "ellipse":
            brush.drawEllipse(0, 0, data.width, data.height);
            break;
          case "rect":
            brush.drawRect(0, 0, data.width, data.height);
            break;
          case "roundedrect":
            brush.drawRoundedRect(0, 0, data.width, data.height, 10);
            break;
          case "poly":
            brush.drawPolygon(data.vertices);
            break;
          default:
            break;
        }
        // End fill and set the basic props
        brush.endFill();
        brush.alpha = alpha;
        brush.visible = visible;
        brush.x = data.x;
        brush.y = data.y;
        brush.zIndex = data.zIndex;

        //custom variable, debug
        brush.col = data.fill;
        return brush;
    }
    composite(brush) { //PIXI.CanvasRenderer.render
        //canvas.app.renderer.render(brush, canvas.drawLayer.pixelmap.texture, false, null, false);
        canvas.drawLayer.pixelmap.RenderBrush(brush);
      }
}