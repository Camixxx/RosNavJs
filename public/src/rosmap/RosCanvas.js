
var RosCanvas = RosCanvas || {
  REVISION : '0.0.1'
};

// convert the given global Stage coordinates to ROS coordinates
createjs.Stage.prototype.globalToRos = function(x, y) {
  var rosX = (x - this.x) / this.scaleX;
  var rosY = (this.y - y) / this.scaleY;
  return new ROSLIB.Vector3({
    x : rosX,
    y : rosY
  });
};

// convert the given ROS coordinates to global Stage coordinates
createjs.Stage.prototype.rosToGlobal = function(pos) {
  var x = pos.x * this.scaleX + this.x;
  var y = pos.y * this.scaleY + this.y;
  return {
    x : x,
    y : y
  };
};

// convert a ROS quaternion to theta in degrees
createjs.Stage.prototype.rosQuaternionToGlobalTheta = function(orientation) {
  // See https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Rotation_matrices
  // here we use [x y z] = R * [1 0 0]
  var q0 = orientation.w;
  var q1 = orientation.x;
  var q2 = orientation.y;
  var q3 = orientation.z;
  // Canvas rotation is clock wise and in degrees
  return -Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3)) * 180.0 / Math.PI;
};

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


/**
 * A shape to draw Point Cloud msg
 *
 * @constructor
 * @param options - object with following keys:
 *   * pointSize (optional) - the size of the outline
 *   * pointColor (optional) - the createjs color for the stroke
 *   * fillColor (optional) - the createjs color for the arrow
 *   * pointCallBack (optional) - the callBack funtion
 */
RosCanvas.PointCloud= function(options) {
  //	var that = this;
    options = options || {};
    this.pointSize = options.pointSize || 0.005;
    this.pointColor = options.pointColor || createjs.Graphics.getRGB(255, 0, 0, 0.66);
    this.fillColor = options.pointColor || createjs.Graphics.getRGB(0, 255, 0, 0.33);
    this.pointCallBack = options.pointCallBack;
    this.robot_pose = null;
    // Array of point shapes
    this.points = [];
    this.points_pos = [];
    this.points_size = 640;
    this.pointContainer = new createjs.Container();
  
    createjs.Container.call(this);
    this.addChild(this.pointContainer);
    
    for(var i=0; i<this.points_size;i++){
      this.points_pos.push({x:0,y:0});
      this.pointContainer.addChild(this.createPointShape({x:0,y:0}));
    }
  
  };
  
  /**
   * Internal use only
   */
  RosCanvas.PointCloud.prototype.createPointShape = function(pos) {
    var point = new createjs.Shape();
    point.graphics.beginFill(this.pointColor);
    point.graphics.drawCircle(0, 0, this.pointSize);
    point.x = pos.x;
    point.y = pos.y;
    // var that = this;
    // point.addEventListener('mousedown', function(event) {
    // 	if (that.pointCallBack !== null && typeof that.pointCallBack !== 'undefined') {
    // 		that.pointCallBack('mousedown', event, that.pointContainer.getChildIndex(event.target));
    // 	}
    // });
    // this.pointContainer.addChild(point);
    return point
  };
  
  /**
   * Moves a point of the right palce
   *
   * @param obj either an index (integer) or a point shape of the polygon
   * @param newPos target position of type ROSLIB.Vector3
   */
  RosCanvas.PointCloud.prototype.movePoint = function(obj, newPos) {
    var index;
    var point;
    if (obj instanceof createjs.Shape) {
      index = this.pointContainer.getChildIndex(obj);
      point = obj;
    }
    else {
      index = obj;
      point = this.pointContainer.getChildAt(index);
    }
  
    point.x = newPos.x;
    point.y = -newPos.y;
  
  };
  
  /**
   * Transform the position of the point cloud
   *
   * @param msg Topic messages
   */
  RosCanvas.PointCloud.prototype.scanTransform = function(msg) {
    var start_angle = msg.angle_min;
    var delta_x = 0;
    var delta_y = 0;
    var delta_angle = 0;
    if(this.robot_pose){
      delta_x = this.robot_pose.position.x ;
      delta_y = this.robot_pose.position.y ;
      delta_angle = this.robot_pose.orientation.w;
    }
    
    for(var i=0; i<msg.ranges.length;i++){
      var a = delta_angle +start_angle;
      var pos = { x: msg.ranges[i]*Math.cos(a)+delta_x,
            y: msg.ranges[i]*Math.sin(a)+delta_y};
      this.points_pos[i] = pos;
      this.movePoint(i, pos);
      start_angle = start_angle + msg.angle_increment;
    }
  
  };
  RosCanvas.PointCloud.prototype.scanPointCloud = function(msg){
    if(msg.points){
      for(var i=0; i<msg.points.length;i++){
        var pos = { x: msg.points[i].x,
              y: msg.points[i].y};
        this.movePoint(i, pos);
        this.points_pos[i] = pos;
      }
    }
  };
  /**
   * Adds a point to the Container
   */
  RosCanvas.PointCloud.prototype.updateAllPoints = function() {
    // this.robot_pose = robot_pose;
    this.addChild(this.pointContainer);
  };
  
  /**
   * Adds a point to the Container
   */
  RosCanvas.PointCloud.prototype.hideAllPoints = function() {
    // this.robot_pose = robot_pose;
    this.removeChild(this.pointContainer);
  };
  
  /**
   * Adds a point to the polygon
   *
   * @param robot_pose info of robot pose
   */
  RosCanvas.PointCloud.prototype.updateRobotPos = function(robot_pose) {
    this.robot_pose = robot_pose;
  };
  
  RosCanvas.PointCloud.prototype.__proto__ = createjs.Container.prototype;


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
export default RosCanvas;