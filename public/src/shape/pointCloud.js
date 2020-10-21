
/**
 * A shape to draw a Point Cloud msg
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
  
  