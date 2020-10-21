
/**
 * A shape to draw a NavigationArrow Position msg
 *
 * @constructor
 * @param options - object with following keys:
 *   * size (optional) - the size of the target
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 *   * fillColor (optional) - the createjs color for the arrow
 */
RosCanvas.NavigationArrow = function(options) {
  var that = this;
  options = options || {};
  var size = options.size || 10;
  var strokeSize = options.strokeSize || 3;
  var strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
  var fillColor = options.fillColor || createjs.Graphics.getRGB(255, 0, 0);
  var pulse = options.pulse;

  // draw the arrow
  var graphics = new createjs.Graphics();
  // line width
  graphics.setStrokeStyle(strokeSize);
  graphics.moveTo(-size / 2.0, -size / 2.0);
  graphics.beginStroke(strokeColor);
  graphics.beginFill(fillColor);
  graphics.lineTo(size, 0);
  graphics.lineTo(-size / 2.0, size / 2.0);
  graphics.lineTo(0, 0);
  graphics.lineTo(-size / 2.0, -size / 2.0);
  graphics.closePath();
  graphics.endFill();
  graphics.endStroke();

  // create the shape
  createjs.Shape.call(this, graphics);
  
  // check if we are pulsing
  if (pulse) {
    // have the model "pulse"
    var growCount = 0;
    var growing = true;
    createjs.Ticker.addEventListener('tick', function() {
      if (growing) {
        that.scaleX *= 1.035;
        that.scaleY *= 1.035;
        growing = (++growCount < 10);
      } else {
        that.scaleX /= 1.035;
        that.scaleY /= 1.035;
        growing = (--growCount < 0);
      }
    });
  }
};
RosCanvas.NavigationArrow.prototype.__proto__ = createjs.Shape.prototype;
