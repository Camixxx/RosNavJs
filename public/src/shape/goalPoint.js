
/**
 * Circle fill with color for the navigatior.
 *
 * @constructor
 * @param options - object with following keys:
 *   * size (optional) - the size of the marker
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 *   * fillColor (optional) - the createjs color for the fill
 *   * pulse (optional) - if the marker should "pulse" over time
 */
RosCanvas.goalPoint = function(options) {
  var that = this;
  options = options || {};
  var size = options.size || 0.5 ;
  var strokeSize = options.strokeSize || 0.1;
  // var strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
  // var fillColor = options.fillColor || createjs.Graphics.getRGB(255, 0, 0, 0.66);
  var strokeColor = options.strokeColor || null;
  var fillColor =  options.fillColor || null;
  var gradientFillColor = options.gradientFillColor || ["#ee0979","#ff6a00"]
  var pulse = options.pulse;

  // draw the goal
  var graphics = new createjs.Graphics();
  if(fillColor){
    graphics.beginFill(fillColor);
  }
  else{
    graphics.beginRadialGradientFill(gradientFillColor, [0, 0.2], 0, 0, 0, 0, 0, 50)
  }
  if(strokeColor){
    graphics.setStrokeStyle(strokeSize);
    graphics.beginStroke(strokeColor);  
  }
       
  graphics.drawCircle(0, 0, size)        
  graphics.endFill();
  graphics.endStroke();
  // 
  // create the shape
  createjs.Shape.call(this, graphics);
  
  // check if we are pulsing
  if (pulse) {
    // have the model "pulse"
    var growCount = 0;
    var growing = true;
    createjs.Ticker.addEventListener('tick', function() {
      if (growing) {
        that.scaleX *= 1.02;
        that.scaleY *= 1.02;
        growing = (++growCount < 10);
      } else {
        that.scaleX /= 1.02;
        that.scaleY /= 1.02;
        growing = (--growCount < 0);
      }
    });
  }

  this.hide = ()=>{
    
  }
};
RosCanvas.goalPoint.prototype.__proto__ = createjs.Shape.prototype;
