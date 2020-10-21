
var NAV = NAV || {
  REVISION : '0.0.1-DEV',
  THROTTLE_RATE: 10
};

/**
 * USE INTERNALLY. Resize an Image map when receive new dimension.
 *
 * @param old_state - Previous state
 * @param viewer - Viewer 2D
 * @param currentGrid - Current grid with information about width, height and position
 */
NAV.resizeMap = function(old_state, viewer, currentGrid) {
  // console.log("resize",old_state,viewer,currentGrid)
  
  var origin_width= currentGrid.width/currentGrid.scaleX;
  var origin_height =  currentGrid.height/currentGrid.scaleY;

  if(origin_width > viewer.scene.canvas.width){
    viewer.scene.canvas.width = origin_width
  }
  if(origin_height > viewer.scene.canvas.height){
    viewer.scene.canvas.height = origin_height
  }
  // viewer.scene.canvas.width = 1000
  // viewer.scene.canvas.height = 1000

  viewer.scene.canvas.style.backgroundColor="#eaeaea";
  if(!old_state){
    old_state = {
      width: currentGrid.width,
      height: currentGrid.height,
      x: currentGrid.pose.position.x,
      y: currentGrid.pose.position.y
    };
    viewer.scaleToDimensions(currentGrid.width, currentGrid.height);
    viewer.shift(currentGrid.pose.position.x, currentGrid.pose.position.y);
  }
  if (old_state.width !== currentGrid.width || old_state.height !== currentGrid.height) {
    viewer.scaleToDimensions(currentGrid.width, currentGrid.height);
    old_state.width = currentGrid.width;
    old_state.height = currentGrid.height;
  }
  if (old_state.x !== currentGrid.pose.position.x || old_state.y !== currentGrid.pose.position.y) {
    viewer.shift((currentGrid.pose.position.x - old_state.x)/1, (currentGrid.pose.position.y - old_state.y)/1);
    old_state.x = currentGrid.pose.position.x;
    old_state.y = currentGrid.pose.position.y;
  }
  return old_state;
};

/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A OccupancyGridClientNav uses an OccupancyGridClient to create a map for use with a Navigator.
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * tfClient (optional) - Read information from TF
 *   * topic (optional) - the map meta data topic to listen to
 *   * robot_pose (optional) - the robot topic or TF to listen position
 *   * image_map - the URL of the image to render
 *   * image (optional) - the route of the image if we want to use the NavigationImage instead the NavigationArrow
 *   * serverName (optional) - the action server name to use for navigation, like '/move_base'
 *   * actionName (optional) - the navigation action name, like 'move_base_msgs/MoveBaseAction'
 *   * rootObject (optional) - the root object to add the click listeners to and render robot markers to
 *   * withOrientation (optional) - if the Navigator should consider the robot orientation (default: false)
 *   * viewer - the main viewer to render to
 */
NAV.ImageMapClientNav = function(options) {
  var that = this;
  options = options || {};
  var ros = options.ros;
  var tfClient = options.tfClient || null;
  var topic = options.topic || '/map_metadata';
  var robot_pose = options.robot_pose || '/robot_pose';
  var image_map = options.image_map;
  var image = options.image || false;
  var serverName = options.serverName || '/move_base';
  var actionName = options.actionName || 'move_base_msgs/MoveBaseAction';
  var rootObject = options.rootObject || new createjs.Container();
  var viewer = options.viewer;
  var withOrientation = options.withOrientation || false;
  var old_state = null;

  // setup a client to get the map
  var client = new ROS2D.ImageMapClient({
    ros : ros,
    rootObject : rootObject,
    topic : topic,
    image : image_map
  });

  var navigator = new NAV.Navigator({
    ros: ros,
    tfClient: tfClient,
    serverName: serverName,
    actionName: actionName,
    robot_pose : robot_pose,
    rootObject: rootObject,
    withOrientation: withOrientation,
    image: image
  });

  client.on('change', function() {
    // scale the viewer to fit the map
    old_state = NAV.resizeMap(old_state, viewer, client.currentGrid);
  });
  return navigator
};

/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A OccupancyGridClientNav uses an OccupancyGridClient to create a map for use with a Navigator.
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * tfClient (optional) - Read information from TF
 *   * topic (optional) - the map topic to listen to
 *   * robot_pose (optional) - the robot topic or TF to listen position
 *   * rootObject (optional) - the root object to add this marker to
 *   * continuous (optional) - if the map should be continuously loaded (e.g., for SLAM)
 *   * serverName (optional) - the action server name to use for navigation, like '/move_base'
 *   * actionName (optional) - the navigation action name, like 'move_base_msgs/MoveBaseAction'
 *   * rootObject (optional) - the root object to add the click listeners to and render robot markers to
 *   * withOrientation (optional) - if the Navigator should consider the robot orientation (default: false)
 *   * image (optional) - the route of the image if we want to use the NavigationImage instead the NavigationArrow
 *   * viewer - the main viewer to render to
 */
NAV.OccupancyGridClientNav = function(options) {
  var that = this;
  options = options || {};
  var ros = options.ros;
  var tfClient = options.tfClient || null;
  var map_topic = options.topic || '/map';
  var robot_pose = options.robot_pose || '/robot_pose';
  var continuous = options.continuous;
  var serverName = options.serverName || '/move_base';
  var actionName = options.actionName || 'move_base_msgs/MoveBaseAction';
  var rootObject = options.rootObject || new createjs.Container();
  var viewer = options.viewer;
  var withOrientation = options.withOrientation || false;
  var image = options.image || false;
  var old_state = null;

  // setup a client to get the map
  var client = new ROS2D.OccupancyGridClient({
    ros : ros,
    rootObject : rootObject,
    continuous : continuous,
    topic : map_topic
  });

  var navigator = new NAV.Navigator({
    ros: ros,
    tfClient: tfClient,
    serverName: serverName,
    actionName: actionName,
    robot_pose : robot_pose,
    rootObject: rootObject,
    withOrientation: withOrientation,
    image: image
  });

  client.on('change', function() {
    // scale the viewer to fit the map
    old_state = NAV.resizeMap(old_state, viewer, client.currentGrid);
  });

};


///////////////////////////////////////////////////
// Navigatio
///////////////////////////////////////////////////
/**
 * @author Russell Toris - rctoris@wpi.edu
 * @author Lars Kunze - l.kunze@cs.bham.ac.uk
 * @author Raffaello Bonghi - raffaello.bonghi@officinerobotiche.it
 */

/**
 * A navigator can be used to add click-to-navigate options to an object. If
 * withOrientation is set to true, the user can also specify the orientation of
 * the robot by clicking at the goal position and pointing into the desired
 * direction (while holding the button pressed).
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * tfClient (optional) - the TF client
 *   * robot_pose (optional) - the robot topic or TF to listen position
 *   * serverName (optional) - the action server name to use for navigation, like '/move_base'
 *   * actionName (optional) - the navigation action name, like 'move_base_msgs/MoveBaseAction'
 *   * rootObject (optional) - the root object to add the click listeners to and render robot markers to
 *   * withOrientation (optional) - if the Navigator should consider the robot orientation (default: false)
 */
NAV.Navigator = function(options) {
  var that = this;
  options = options || {};
  var ros = options.ros;
  var tfClient = options.tfClient || null;
  var robot_pose = options.robot_pose || '/robot_pose';
  var serverName = options.serverName || '/move_base';
  var actionName = options.actionName || 'move_base_msgs/MoveBaseAction';
  var withOrientation = options.withOrientation || false;
  var use_image = options.image;
  this.rootObject = options.rootObject || new createjs.Container();
  
  this.goalMarker = null;

 
  // setup the actionlib client
  var actionClient = new ROSLIB.ActionClient({
    ros : ros,
    actionName : actionName,
    serverName : serverName
  });
    
  
  // PATH INIT
  this.planPath = this.planPath||null;
  var pathListener = new ROSLIB.Topic({
    ros: ros,
    name: '/move_base/NavfnROS/plan',
    messageType: 'nav_msgs/Path',
    throttle_rate: NAV.THROTTLE_RATE
  });
   // that.rootObject.addChild(that.planPath);
  
  // this.rootObject.addChild(this.planPath);
  var updatePath = function(plan){
    if(!that.planPath){
      that.planPath =  new ROS2D.PathShape({path:plan,strokeSize:0.03,strokeColor:createjs.Graphics.getRGB(94, 82, 125, 0.7)})
      that.rootObject.addChild(that.planPath);
    }else{
      that.rootObject.removeChild(that.planPath);
      that.planPath.setPath(plan);
      that.rootObject.addChild(that.planPath);
    }
  }
  pathListener.subscribe(function(plan) {
    if(plan.poses && plan.poses.length>5){
      updatePath(plan)
    }
  });


  /**
   * Send a goal to the navigation stack with the given pose.
   *
   * @param pose - the goal pose
   */
  function sendGoal(pose) {
    // create a goal
    var goal = new ROSLIB.Goal({
      actionClient : actionClient,
      goalMessage : {
        target_pose : {
          header : {
            frame_id : 'map'
          },
          pose : pose
        }
      }
    });
    goal.send();
    
    that.currentGoal = goal;

    // create a marker for the goal
    if (that.goalMarker === null) {
      console.log('init goal')
      if (use_image && ROS2D.hasOwnProperty('ImageNavigator')) {
        that.goalMarker = new ROS2D.ImageNavigator({
          size: 2.5,
          image: use_image,
          alpha: 0.7,
          pulse: true
        });
      } else {
        that.goalMarker = new RosCanvas.goalPoint({size: 8,pulse: true});
      }
      // that.rootObject.addChild(that.goalMarker);
    }
    that.rootObject.addChild(that.goalMarker);
    that.goalMarker.x = pose.position.x;
    that.goalMarker.y = -pose.position.y;
    that.goalMarker.rotation = stage.rosQuaternionToGlobalTheta(pose.orientation);
    that.goalMarker.scaleX = 1.0 / stage.scaleX;
    that.goalMarker.scaleY = 1.0 / stage.scaleY;

    goal.on('result', function() {
      // TODO
      if(that.planPath){
       that.rootObject.removeChild(that.planPath)
      }

      // that.rootObject.removeChild(that.goalMarker);
      // that.goalMarker = null
    });
  }
  
  /**
   * Cancel the currently active goal.
   */
  this.cancelGoal = function () {
    if (typeof that.currentGoal !== 'undefined') {
      that.currentGoal.cancel();
    }
  };

  // get a handle to the stage
  var stage;
  if (that.rootObject instanceof createjs.Stage) {
    stage = that.rootObject;
  } else {
    stage = that.rootObject.getStage();
  }

  // marker for the robot
  var robotMarker = null;
  if (use_image && ROS2D.hasOwnProperty('ImageNavigator')) {
    robotMarker = new ROS2D.ImageNavigator({
      size: 2.0,
      image: use_image,
      pulse: true
    });
  } else {
    robotMarker = new ROS2D.NavigationArrow({
      size : 20,
      strokeSize : 0.1,
      fillColor :"#583c8a",
      pulse : true
    });
  }

  // wait for a pose to come in first
  robotMarker.visible = false;
  this.rootObject.addChild(robotMarker);
  var initScaleSet = false;

  var updateRobotPosition = function(pose, orientation) {
    // update the robots position on the map
    robotMarker.x = pose.x;
    robotMarker.y = -pose.y;
    if (!initScaleSet) {
      robotMarker.scaleX = 1.0 / stage.scaleX;
      robotMarker.scaleY = 1.0 / stage.scaleY;
      initScaleSet = true;
    }
    // change the angle
    robotMarker.rotation = stage.rosQuaternionToGlobalTheta(orientation);
    // Set visible
    robotMarker.visible = true;
  };

  if(tfClient !== null) {
    tfClient.subscribe(robot_pose, function(tf) {
      // console.log("subscribe robot_pose tf:", tf)
      updateRobotPosition(tf.translation,tf.rotation);
    });
  } else {
    // setup a listener for the robot pose
    var poseListener = new ROSLIB.Topic({
      ros: ros,
      name: robot_pose,
      messageType: 'geometry_msgs/Pose',
      throttle_rate: NAV.THROTTLE_RATE
    });
    poseListener.subscribe(function(pose) {
      updateRobotPosition(pose.position,pose.orientation);
    });
  }

  
  if (withOrientation === false){
    // setup a double click listener (no orientation)
    this.rootObject.addEventListener('dblclick', function(event) {
      // convert to ROS coordinates
     if(that.planPath){
      that.rootObject.removeChild(that.planPath)
     }

      var coords = stage.globalToRos(event.stageX, event.stageY);
      var pose = new ROSLIB.Pose({
        position : new ROSLIB.Vector3(coords)
      });
      // send the goal
      sendGoal(pose);
    });
  } else { // withOrientation === true
    // setup a click-and-point listener (with orientation)
    var position = null;
    var positionVec3 = null;
    var thetaRadians = 0;
    var thetaDegrees = 0;
    var orientationMarker = null;
    var mouseDown = false;
    var xDelta = 0;
    var yDelta = 0;

    var mouseEventHandler = function(event, mouseState) {

      if (mouseState === 'down'){
        // get position when mouse button is pressed down
        position = stage.globalToRos(event.stageX, event.stageY);
        positionVec3 = new ROSLIB.Vector3(position);
        mouseDown = true;
      }
      else if (mouseState === 'move'){
        // remove obsolete orientation marker
        that.rootObject.removeChild(orientationMarker);

        if ( mouseDown === true) {
          // if mouse button is held down:
          // - get current mouse position
          // - calulate direction between stored <position> and current position
          // - place orientation marker
          var currentPos = stage.globalToRos(event.stageX, event.stageY);
          var currentPosVec3 = new ROSLIB.Vector3(currentPos);

          if (use_image && ROS2D.hasOwnProperty('ImageNavigator')) {
            orientationMarker = new ROS2D.ImageNavigator({
              size: 2.5,
              image: use_image,
              alpha: 0.7,
              pulse: false
            });
          } else {
            orientationMarker = new ROS2D.NavigationArrow({
              size : 25,
              strokeSize : 1,
              fillColor : createjs.Graphics.getRGB(0, 255, 0, 0.66),
              pulse : false
            });
          }

          xDelta =  currentPosVec3.x - positionVec3.x;
          yDelta =  currentPosVec3.y - positionVec3.y;

          thetaRadians  = Math.atan2(xDelta,yDelta);

          thetaDegrees = thetaRadians * (180.0 / Math.PI);

          if (thetaDegrees >= 0 && thetaDegrees <= 180) {
            thetaDegrees += 270;
          } else {
            thetaDegrees -= 90;
          }

          orientationMarker.x =  positionVec3.x;
          orientationMarker.y = -positionVec3.y;
          orientationMarker.rotation = thetaDegrees;
          orientationMarker.scaleX = 1.0 / stage.scaleX;
          orientationMarker.scaleY = 1.0 / stage.scaleY;

          that.rootObject.addChild(orientationMarker);
        }
      } else if (mouseDown) { // mouseState === 'up'
        // if mouse button is released
        // - get current mouse position (goalPos)
        // - calulate direction between stored <position> and goal position
        // - set pose with orientation
        // - send goal
        mouseDown = false;

        var goalPos = stage.globalToRos(event.stageX, event.stageY);

        var goalPosVec3 = new ROSLIB.Vector3(goalPos);

        xDelta =  goalPosVec3.x - positionVec3.x;
        yDelta =  goalPosVec3.y - positionVec3.y;

        thetaRadians  = Math.atan2(xDelta,yDelta);

        if (thetaRadians >= 0 && thetaRadians <= Math.PI) {
          thetaRadians += (3 * Math.PI / 2);
        } else {
          thetaRadians -= (Math.PI/2);
        }

        var qz =  Math.sin(-thetaRadians/2.0);
        var qw =  Math.cos(-thetaRadians/2.0);

        var orientation = new ROSLIB.Quaternion({x:0, y:0, z:qz, w:qw});

        var pose = new ROSLIB.Pose({
          position :    positionVec3,
          orientation : orientation
        });
        // send the goal
        sendGoal(pose);
      }
    };

    this.rootObject.addEventListener('stagemousedown', function(event) {
      mouseEventHandler(event,'down');
    });

    this.rootObject.addEventListener('stagemousemove', function(event) {
      mouseEventHandler(event,'move');
    });

    this.rootObject.addEventListener('stagemouseup', function(event) {
      mouseEventHandler(event,'up');
    });
  }
};



// Util for twist
NAV.Velocity = function(min_velocity,max_velocity,num_steps){
  this._min = min_velocity
  this._max = max_velocity
  this._num_steps = num_steps
    if(this._num_steps > 1){
      this._step_incr = (max_velocity - min_velocity) / (this._num_steps - 1)
    }else{
      this._step_incr = 0
    }

    // assert min_velocity > 0 and max_velocity > 0 and num_steps > 0
    this._min = min_velocity
    this._max = max_velocity
    this._num_steps = num_steps
    if(this._num_steps > 1) {
        this._step_incr = (max_velocity - min_velocity) / (this._num_steps - 1)
    }else{
        //# If num_steps is one, we always use the minimum velocity.
        this._step_incr = 0
    }
  this.call = function(value, step){
    // Takes a value in the range [0, 1] and the step and returns the
    // velocity (usually m/s or rad/s).
    if ( step == 0){
        return 0
    }
    //assert step > 0 and step <= this._num_steps
    var max_value = this._min + this._step_incr * (step - 1)
    return value * max_value
  }
}


NAV.controller = function(ros, name, showStatus){
  this.ros = ros;
  var num_steps = 4;
  var angular_min = 0.7;
  var angular_max = 1.2;
  this.name = name || '/cmd_vel';
  this.showStatus = showStatus || false;
  var kflag = false;
  var keyCodeMap = {
    37 : "Left",
    38 : "Up",
    39 : "Right",
    40 : "Down", 
    65 : "Left",
    68 : "Right",
    87 : "Up",
    83 : "Down",
    97 : "Left",
    102 : "Right",
    119 : "Up",
    115 : "Down"
  }
  var cmdVel = new ROSLIB.Topic({ 
    ros : ros, 
    name : name,  //'/cmd_vel_mux/input/teleop'
    messageType : 'geometry_msgs/Twist' 
  });
  var movement_bindings = {
    "Up": [0.2, 0],
    "Left":  [0, 0.2],
    "Right": [0, -0.2],
    "Down": [-0.2, 0],
    "Stop": [0, 0]
  }
  var twist= new ROSLIB.Message({ 
    linear : {  x : 0, y : 0,  z : 0 }, 
    angular : {  x : 0, y : 0, z : 0  } 
  })

  this._rotation =  new NAV.Velocity(angular_min, angular_max, num_steps);
 
  var get_twist = (linear, angular) => {
    twist.linear.x = twist.linear.x + linear
    twist.angular.z = this._rotation.call(Math.sign(angular), Math.abs(angular))
    return twist
  }
  
  var publish = function(move){
    // console.log(get_twist(move[0], move[1]))
    cmdVel.publish(get_twist(move[0], move[1]))
  };

  // var that = this;
  var show_div;
  if(showStatus){
    // var show_div = document.querySelector("controller_show_div");
    // show_div.innerHTML=`
    // <style>#controller_show_div button{}; focus_btn{ background:#666;font:#eaeaea;}</style>
    // <button id="Left_btn">←</button><button id="Up_btn">↑</button><button id="Right_btn">→</button><button id="Down_btn">↓</button>
    // `;
  }
  // 触发
  document.onkeydown = (event) => {
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if (e && e.keyCode in keyCodeMap) {  
      // test[keyCodeMap[e.keyCode]]();
      publish(movement_bindings[keyCodeMap[e.keyCode]]);
      // if(showStatus){
      //   document.querySelector("#"+keyCodeMap[e.keyCode]+"_btn").className = "focus_btn";
      // }
      console.log("Controller Move:",keyCodeMap[e.keyCode])
    }
  };

  // 长按
  // document.addEventListener('keypress', function(e){
  //   var e = e || window.event || arguments.callee.caller.arguments[0];
  //   if( kflag ){
  //     // if (e.keyCode in keyCodeMap) {  
  //     //   publish[keyCodeMap[e.keyCode]]();
  //     // }  
  //     e.preventDefault();
  //   }else{
  //       kflag = true;
  //   }
  // }, false);
  // document.addEventListener('keyup', function(e){
  //     kflag = false;
  //     publish[['Stop']]()
  // }, false);


};

// NAV.controller.prototype.listen = (e => function(document.onkeydown.apply(NAV.controller, e){
//   var e = e || window.event || arguments.callee.caller.arguments[0];
// })
// .apply()

export default NAV;