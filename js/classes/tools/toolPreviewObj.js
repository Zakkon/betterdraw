import { runInThisContext } from "vm";

export default class ToolPreviewObj extends PIXI.Graphics {
    constructor(brushType){
        
        super();
        this.name = brushType;
        const previewAlpha =  0.4;
        const defaultColor = 0xFFFFFF;

        
        if(brushType=="ellipse"){
            this.shape = "ellipse";
            this._ellipse(defaultColor, 0,0, 100,100);
            this.zIndex = 10;
            this.visible = true;
            this.alpha = previewAlpha;
        }
        else if(brushType=="grid") {
          this._rect(defaultColor, 0,0, 100,100);
          this.zIndex = 10;
          this.visible = true;
          this.alpha = previewAlpha;
        }
    }
    _ellipse (fill, x,y, width,height) {
        this.beginFill(fill);
        this.drawEllipse(0,0,width,height);
        this.endFill();
        this.x = x;
        this.y = y;
    }
    _rect (fill, x,y, width,height) {
      this.beginFill(fill);
      this.drawRect(0,0,width,height);
      this.endFill();
      this.x = x;
      this.y = y;
  }

    brush(data) {
        // Get new graphic & begin filling
        const alpha = typeof data.alpha === "undefined" ? 1 : data.alpha;
        const visible = typeof data.visible === "undefined" ? true : data.visible;
        const brush = new PIXI.Graphics();
        brush.beginFill(data.fill);
        // Draw the shape depending on type of brush
        switch (data.shape) {
          case this.BRUSH_TYPES.ELLIPSE:
            brush.drawEllipse(0, 0, data.width, data.height);
            break;
          case this.BRUSH_TYPES.BOX:
            brush.drawRect(0, 0, data.width, data.height);
            break;
          case this.BRUSH_TYPES.ROUNDED_RECT:
            brush.drawRoundedRect(0, 0, data.width, data.height, 10);
            break;
          case this.BRUSH_TYPES.POLYGON:
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
        return brush;
    }

    setActive(active){
        this.visible = active;
    }
    destroy() {
      if(this===null||this===undefined||this.r===undefined){return;}
      super.destroy(true);
    }
}
