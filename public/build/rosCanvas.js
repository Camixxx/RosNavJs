
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
  
  origin_width= currentGrid.width/currentGrid.scaleX;
  origin_height =  currentGrid.height/currentGrid.scaleY;

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


export default NAV;

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

export default RosCanvas;


var SCAN = SCAN || {
  REVISION : '0.0.1-DEV',
  THROTTLE_RATE: 10
};

/*
点云扫描生成
*/

SCAN.cloudScan =  function(options){
  var that = this;
  options = options || {};
  var ros = options.ros;
  var name = options.scanName;
  var robot = options.robotName;
  

  this.rootObject = options.rootObject || new createjs.Container();

  // Cloud INIT & Callback
  this.poindCloud = new RosCanvas.PointCloud({
    pointCallBack:function(){}});;

  // viewer.scene.addChild(this.poindCloud);


  var robotListener = new ROSLIB.Topic({
    ros: ros,
    name: robot,
    messageType: 'geometry_msgs/Pose',
    throttle_rate: NAV.THROTTLE_RATE
  });

  robotListener.subscribe((pos) =>{
    // console.log("robot",pos)
    this.poindCloud.updateRobotPos(pos);
  });

  var cloudListener = new ROSLIB.Topic({
    ros: ros,
    name: name,
    messageType: 'sensor_msgs/LaserScan',
    throttle_rate: NAV.THROTTLE_RATE
  });

  cloudListener.subscribe((msg) =>{
    // console.log("scan")
    this.poindCloud.scanTransform(msg);
    this.poindCloud.updateAllPoints();
    
  });


}



/*
打印所有信息到表格中
*/
SCAN.topicShowAll = function(ros,dom){
  
  
  this.ros = ros;
  this.topicList=[];
  this.topicValueList = {};
  // var robot_pose = '/robot_pose';
  // var serverName = '/move_base';
  var parent_dom_id = dom
  var parent_dom = document.querySelector("#"+parent_dom_id);
  parent_dom.innerHTML = parent_dom.innerHTML+`
  <table class='table'>
  <thead>
    <tr class='head'><th>#</th><td>name</td><td>type</td><td class='tb_value'>value</td></tr>
  </thead>
  <thead id='Topics'>
  </thead>
</table>`;
  var that = this;

  /* Util for beautify the result data.
   */
  function removeHeader(params) {
    var _str = ""
    if('header' in params){
      for(key in params){
        if(key!='header'){
          var _v = JSON.stringify(params[key])
          if(!(params[key] instanceof Object)){
            _str = _str +key+":"+_v +"<br>"; 
          }else{
            _str = _str+ "<details><summary>"+key+":"+_v.slice(0,100)+"...</summary>"+
            "<p>"+_v+"</p></details>";
          }
        }
      }
    }else{
      if(!(params instanceof Object)){
            _str = _str + "value:"+JSON.stringify(params) +"<br>"; 
      }else{
        _str = _str+ "<details><summary>value:"+JSON.stringify(params).slice(0,100)+"</summary>"+
        "<p>"+JSON.stringify(params)+"</p></details>";
      }
      
    }
    return _str;
  }


  var updateValue = function(name, idx, value){

    var topic_td = document.querySelector("#_"+ idx);
    
    topic_td.innerHTML = value;

  }

  this.initDataInterface = function(topicsRes){
    var topicsValue = that.topicValueList;
    var topic_ol = document.querySelector("#Topics");
    var html_str = ""
    for(var i=0;i<topicsRes.topics.length;i=i+1){
      let val = "";
      if(topicsValue){
        val = topicsValue[topicsRes.topics[i]];
      }
      html_str =html_str + "<tr><td><input type='checkbox'></td><td><input value='"+topicsRes.topics[i]+
        "'></td><td><input value='"+topicsRes.types[i]+"'></td><td id='_"+i+"' class='topic_value'>"+val+"</td></tr>";
    }
    topic_ol.innerHTML =html_str;
  };


  this.subcribeAll= function(topicsRes){
    for(var i=0;i<topicsRes.topics.length;i=i+1){
      var Listener = new ROSLIB.Topic({
        ros: ros,
        name: topicsRes.topics[i],
        messageType: topicsRes.types[i],
        throttle_rate: SCAN.THROTTLE_RATE * 20
      });
      Listener.idx = i;
      
      that.topicList.push(Listener);
      that.topicValueList[Listener.name] = "Loading...";
      Listener.subscribe(function(value) {
        var data = ""
        if(value){
          data = removeHeader(value);
        }
        that.topicValueList[this.name] = data;
        updateValue(this.name, this.idx, data)
      });
    }
  };


  this.update = function(){
    that.ros.getTopics(function(res){
      that.initDataInterface(res);
      that.subcribeAll(res);
      }, function(err){
        console.log("[getTopics] ERROR:",err);
      });

  }

}

export default SCAN;
 /**
   * Setup all visualization elements when the page is loaded. 
   */
  var ros;
  var viewer;
  var nav;
  var controller; 

  var cloudScan;

  // Connect to ROS.

  ros = new ROSLIB.Ros({
    url : 'ws://192.168.1.139:9090'
  });
  

  function init() {
    // Create the main viewer.
    viewer = new ROS2D.Viewer({
      divID : 'nav',
      width : 600,
      height : 600
    });

    //Setup the nav client.
    nav = NAV.OccupancyGridClientNav({
      ros : ros,
      rootObject : viewer.scene,
      viewer : viewer,
      serverName : '/move_base'
    });

    // keyboard W A S D control the robot
    controller = NAV.controller(ros)
    // show topics
    var showTopics = new SCAN.topicShowAll(ros,"show_all");
    // pointCloud Scan
    cloudScan = new SCAN.cloudScan({
      ros : ros,
      robotName : '/robot_pose',
      scanName: '/scan'  
    })
    
    
    ros.on('error', function(error) {
      document.querySelector('#rosStatus').className = ("error_state");
      document.querySelector('#rosStatus').innerText = "Error in the backend!";
      console.log("[Rosbridge connect] ERROR:",error);
    });
  
    // Find out exactly when we made a connection.
    ros.on('connection', function() {
      console.log('Connection made!');
      showTopics.update();
      viewer.scene.addChild(cloudScan.poindCloud);
      document.querySelector('#rosStatus').className = ("connected_state");
      document.querySelector('#rosStatus').innerText = " Connected.";
    });
  
    ros.on('close', function() {
      console.log('Connection closed.');
      document.querySelector('#rosStatus').className = ("");
      document.querySelector('#rosStatus').innerText = " Connection closed.";
    });

  }
 
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
    max_value = this._min + this._step_incr * (step - 1)
    return value * max_value
  }
}


NAV.controller = function(ros, showStatus){
  this.ros = ros;
  num_steps = 4;
  angular_min = 0.7;
  angular_max = 1.2;
  this.showStatus = showStatus || null;
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
    name : '/cmd_vel',  //'/cmd_vel_mux/input/teleop'
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
  
  // 触发
  document.onkeydown = (event) => {
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if (e && e.keyCode in keyCodeMap) {  
      // test[keyCodeMap[e.keyCode]]();
      publish(movement_bindings[keyCodeMap[e.keyCode]])
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

}

// NAV.controller.prototype.listen = (e => function(document.onkeydown.apply(NAV.controller, e){
//   var e = e || window.event || arguments.callee.caller.arguments[0];
// })
// .apply()
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
  // this.rootObject.addChild(this.planPath);
  var updatePath = function(plan){
      that.rootObject.removeChild(that.planPath);
      that.planPath =  new ROS2D.PathShape({path:plan,strokeSize:0.03,strokeColor:createjs.Graphics.getRGB(94, 82, 125, 0.7)})
      that.rootObject.addChild(that.planPath);
  }
  pathListener.subscribe(function(plan) {
    updatePath(plan)
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
      // if(that.planPath){
      //  that.rootObject.removeChild(that.planPath)
      // }
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


// GOAL POINT

/**
 * A navigation arrow is a directed triangle that can be used to display orientation.
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
  var size = options.size || 5 ;
  var strokeSize = options.strokeSize || 0.1;
  var strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
  var fillColor = options.fillColor || createjs.Graphics.getRGB(255, 0, 0, 0.66);
  var gradientFillColor = options.gradientFillColor || ["#ee0979","#ff6a00"]
  var pulse = options.pulse;

  // draw the goal
  var graphics = new createjs.Graphics();

  graphics.setStrokeStyle(strokeSize);
  graphics.beginRadialGradientFill(gradientFillColor, [0, 0.2], 0, 0, 0, 0, 0, 50)
  // ( ["#dc5f5d","#6186a3"], [0, 1], 100, 100, 0, 100, 100, size)
  // graphics.beginStroke(strokeColor);       
  graphics.drawCircle(0, 0,size)        
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
};
RosCanvas.goalPoint.prototype.__proto__ = createjs.Shape.prototype;

/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A navigation arrow is a directed triangle that can be used to display orientation.
 *
 * @constructor
 * @param options - object with following keys:
 *   * size (optional) - the size of the marker
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 *   * fillColor (optional) - the createjs color for the fill
 *   * pulse (optional) - if the marker should "pulse" over time
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
ROS2D.NavigationArrow.prototype.__proto__ = createjs.Shape.prototype;


/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * A shape to draw a nav_msgs/Path msg
 *
 * @constructor
 * @param options - object with following keys:
 *   * path (optional) - the initial path to draw
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 */
RosCanvas.PathShape = function(options) {
	options = options || {};
	var path = options.path;
	this.strokeSize = options.strokeSize || 3;
	this.strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
	
	// draw the line
	this.graphics = new createjs.Graphics();
	
	if (path !== null && typeof path !== 'undefined') {
		this.graphics.setStrokeStyle(this.strokeSize);
		this.graphics.beginStroke(this.strokeColor);
		this.graphics.moveTo(path.poses[0].pose.position.x / this.scaleX, path.poses[0].pose.position.y / -this.scaleY);
		for (var i=1; i<path.poses.length; ++i) {
			this.graphics.lineTo(path.poses[i].pose.position.x / this.scaleX, path.poses[i].pose.position.y / -this.scaleY);
		}
		this.graphics.endStroke();
	}
	
	// create the shape
	createjs.Shape.call(this, this.graphics);
};

/**
 * Set the path to draw
 *
 * @param path of type nav_msgs/Path
 */
RosCanvas.PathShape.prototype.setPath = function(path) {
	this.graphics.clear();
	if (path !== null && typeof path !== 'undefined') {
		this.graphics.setStrokeStyle(this.strokeSize);
		this.graphics.beginStroke(this.strokeColor);
		this.graphics.moveTo(path.poses[0].pose.position.x / this.scaleX, path.poses[0].pose.position.y / -this.scaleY);
		for (var i=1; i<path.poses.length; ++i) {
			this.graphics.lineTo(path.poses[i].pose.position.x / this.scaleX, path.poses[i].pose.position.y / -this.scaleY);
		}
		this.graphics.endStroke();
	}
};

RosCanvas.PathShape.prototype.__proto__ = createjs.Shape.prototype;

/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * A polygon that can be edited by an end user
 *
 * @constructor
 * @param options - object with following keys:
 *   * pose (optional) - the first pose of the trace
 *   * lineSize (optional) - the width of the lines
 *   * lineColor (optional) - the createjs color of the lines
 *   * pointSize (optional) - the size of the points
 *   * pointColor (optional) - the createjs color of the points
 *   * fillColor (optional) - the createjs color to fill the polygon
 *   * pointCallBack (optional) - callback function for mouse interaction with a point
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
 * Moves a point of the polygon
 *
 * @param obj either an index (integer) or a point shape of the polygon
 * @param position of type ROSLIB.Vector3
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
 * Adds a point to the polygon
 *y
 * @param position of type ROSLIB.Vector3
 * @param robot_pose of type pose
 */
RosCanvas.PointCloud.prototype.scanTransform = function(msg) {
	var start_angle = msg.angle_min;
	var delta_x = 0;
	var delta_y = 0;
	var delta_angle = 0;
	if(this.robot_pose){
		delta_x = this.robot_pose.position.x ;
		delta_y = this.robot_pose.position.y ;
		delta_angle = this.robot_pose.orientation.z;
	}
	

	for(var i=0; i<msg.ranges.length;i++){

		var a = start_angle - delta_angle;
		var pos = { x: msg.ranges[i]*Math.cos(a)+delta_x,
					y: msg.ranges[i]*Math.sin(a)+delta_y};
		console.log(pos)
		this.points_pos[i] = pos;
		this.movePoint(i, pos);
		start_angle = start_angle + msg.angle_increment;
	}

};

/**
 * Adds a point to the polygon
 *
 * @param position of type ROSLIB.Vector3
 * @param robot_pose of type pose
 */
RosCanvas.PointCloud.prototype.updateAllPoints = function() {
	// this.robot_pose = robot_pose;
	this.addChild(this.pointContainer);
};

/**
 * Adds a point to the polygon
 *
 * @param position of type ROSLIB.Vector3
 * @param robot_pose of type pose
 */
RosCanvas.PointCloud.prototype.hideAllPoints = function() {
	// this.robot_pose = robot_pose;
	this.removeChild(this.pointContainer);
};

/**
 * Adds a point to the polygon
 *
 * @param robot_pose of type pose
 */
RosCanvas.PointCloud.prototype.updateRobotPos = function(robot_pose) {
	this.robot_pose = robot_pose;
};




RosCanvas.PointCloud.prototype.__proto__ = createjs.Container.prototype;

/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * A polygon that can be edited by an end user
 *
 * @constructor
 * @param options - object with following keys:
 *   * pose (optional) - the first pose of the trace
 *   * lineSize (optional) - the width of the lines
 *   * lineColor (optional) - the createjs color of the lines
 *   * pointSize (optional) - the size of the points
 *   * pointColor (optional) - the createjs color of the points
 *   * fillColor (optional) - the createjs color to fill the polygon
 *   * lineCallBack (optional) - callback function for mouse interaction with a line
 *   * pointCallBack (optional) - callback function for mouse interaction with a point
 */
RosCanvas.PolygonMarker = function(options) {
//	var that = this;
	options = options || {};
	this.lineSize = options.lineSize || 3;
	this.lineColor = options.lineColor || createjs.Graphics.getRGB(0, 0, 255, 0.66);
	this.pointSize = options.pointSize || 10;
	this.pointColor = options.pointColor || createjs.Graphics.getRGB(255, 0, 0, 0.66);
	this.fillColor = options.pointColor || createjs.Graphics.getRGB(0, 255, 0, 0.33);
	this.lineCallBack = options.lineCallBack;
	this.pointCallBack = options.pointCallBack;
	
	// Array of point shapes
//	this.points = [];
	this.pointContainer = new createjs.Container();
	
	// Array of line shapes
//	this.lines = [];
	this.lineContainer = new createjs.Container();
	
	this.fillShape = new createjs.Shape();
	
	// Container with all the lines and points
	createjs.Container.call(this);
	
	this.addChild(this.fillShape);
	this.addChild(this.lineContainer);
	this.addChild(this.pointContainer);
};

/**
 * Internal use only
 */
RosCanvas.PolygonMarker.prototype.createLineShape = function(startPoint, endPoint) {
	var line = new createjs.Shape();
//	line.graphics.setStrokeStyle(this.strokeSize);
//	line.graphics.beginStroke(this.strokeColor);
//	line.graphics.moveTo(startPoint.x, startPoint.y);
//	line.graphics.lineTo(endPoint.x, endPoint.y);
	this.editLineShape(line, startPoint, endPoint);
	
	var that = this;
	line.addEventListener('mousedown', function(event) {
		if (that.lineCallBack !== null && typeof that.lineCallBack !== 'undefined') {
			that.lineCallBack('mousedown', event, that.lineContainer.getChildIndex(event.target));
		}
	});
	
	return line;
};

/**
 * Internal use only
 */
RosCanvas.PolygonMarker.prototype.editLineShape = function(line, startPoint, endPoint) {
	line.graphics.clear();
	line.graphics.setStrokeStyle(this.lineSize);
	line.graphics.beginStroke(this.lineColor);
	line.graphics.moveTo(startPoint.x, startPoint.y);
	line.graphics.lineTo(endPoint.x, endPoint.y);
};

/**
 * Internal use only
 */
RosCanvas.PolygonMarker.prototype.createPointShape = function(pos) {
	var point = new createjs.Shape();
	point.graphics.beginFill(this.pointColor);
	point.graphics.drawCircle(0, 0, this.pointSize);
	point.x = pos.x;
	point.y = -pos.y;
	
	var that = this;
	point.addEventListener('mousedown', function(event) {
		if (that.pointCallBack !== null && typeof that.pointCallBack !== 'undefined') {
			that.pointCallBack('mousedown', event, that.pointContainer.getChildIndex(event.target));
		}
	});
	
	return point;
};

/**
 * Adds a point to the polygon
 *
 * @param position of type ROSLIB.Vector3
 */
RosCanvas.PolygonMarker.prototype.addPoint = function(pos) {
	var point = this.createPointShape(pos);
	this.pointContainer.addChild(point);
	var numPoints = this.pointContainer.getNumChildren();
	
	// 0 points -> 1 point, 0 lines
	// 1 point  -> 2 points, lines: add line between previous and new point, add line between new point and first point
	// 2 points -> 3 points, 3 lines: change last line, add line between new point and first point
	// 3 points -> 4 points, 4 lines: change last line, add line between new point and first point
	// etc
	
	if (numPoints < 2) {
		// Now 1 point
	}
	else if (numPoints < 3) {
		// Now 2 points: add line between previous and new point
		var line = this.createLineShape(this.pointContainer.getChildAt(numPoints-2), point);
		this.lineContainer.addChild(line);
	}
	if (numPoints > 2) {
		// Now 3 or more points: change last line
		this.editLineShape(this.lineContainer.getChildAt(numPoints-2), this.pointContainer.getChildAt(numPoints-2), point);
	}
	if (numPoints > 1) {
		// Now 2 or more points: add line between new point and first point
		var lineEnd = this.createLineShape(point, this.pointContainer.getChildAt(0));
		this.lineContainer.addChild(lineEnd);
	}
	
	this.drawFill();
};

/**
 * Removes a point from the polygon
 *
 * @param obj either an index (integer) or a point shape of the polygon
 */
RosCanvas.PolygonMarker.prototype.remPoint = function(obj) {
	var index;
//	var point;
	if (obj instanceof createjs.Shape) {
		index = this.pointContainer.getChildIndex(obj);
//		point = obj;
	}
	else {
		index = obj;
//		point = this.pointContainer.getChildAt(index);
	}
	
	// 0 points -> 0 points, 0 lines
	// 1 point  -> 0 points, 0 lines
	// 2 points -> 1 point,  0 lines: remove all lines
	// 3 points -> 2 points, 2 lines: change line before point to remove, remove line after point to remove
	// 4 points -> 3 points, 3 lines: change line before point to remove, remove line after point to remove
	// etc
	
	var numPoints = this.pointContainer.getNumChildren();
	
	if (numPoints < 2) {
		
	}
	else if (numPoints < 3) {
		// 2 points: remove all lines
		this.lineContainer.removeAllChildren();
	}
	else {
		// 3 or more points: change line before point to remove, remove line after point to remove
		this.editLineShape(
			this.lineContainer.getChildAt((index-1+numPoints)%numPoints),
			this.pointContainer.getChildAt((index-1+numPoints)%numPoints),
			this.pointContainer.getChildAt((index+1)%numPoints)
		);
		this.lineContainer.removeChildAt(index);
	}
	this.pointContainer.removeChildAt(index);
//	this.points.splice(index, 1);
	
	this.drawFill();
};

/**
 * Moves a point of the polygon
 *
 * @param obj either an index (integer) or a point shape of the polygon
 * @param position of type ROSLIB.Vector3
 */
RosCanvas.PolygonMarker.prototype.movePoint = function(obj, newPos) {
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
	
	var numPoints = this.pointContainer.getNumChildren();
	if (numPoints > 1) {
		// line before moved point
		var line1 = this.lineContainer.getChildAt((index-1+numPoints)%numPoints);
		this.editLineShape(line1, this.pointContainer.getChildAt((index-1+numPoints)%numPoints), point);
		
		// line after moved point
		var line2 = this.lineContainer.getChildAt(index);
		this.editLineShape(line2, point, this.pointContainer.getChildAt((index+1)%numPoints));
	}
	
	this.drawFill();
};

/**
 * Splits a line of the polygon: inserts a point at the center of the line
 *
 * @param obj either an index (integer) or a line shape of the polygon
 */
RosCanvas.PolygonMarker.prototype.splitLine = function(obj) {
	var index;
	var line;
	if (obj instanceof createjs.Shape) {
		index = this.lineContainer.getChildIndex(obj);
		line = obj;
	}
	else {
		index = obj;
		line = this.lineContainer.getChildAt(index);
	}
	var numPoints = this.pointContainer.getNumChildren();
	var xs = this.pointContainer.getChildAt(index).x;
	var ys = this.pointContainer.getChildAt(index).y;
	var xe = this.pointContainer.getChildAt((index+1)%numPoints).x;
	var ye = this.pointContainer.getChildAt((index+1)%numPoints).y;
	var xh = (xs+xe)/2.0;
	var yh = (ys+ye)/2.0;
	var pos = new ROSLIB.Vector3({ x:xh, y:-yh });
	
	// Add a point in the center of the line to split
	var point = this.createPointShape(pos);
	this.pointContainer.addChildAt(point, index+1);
	++numPoints;
	
	// Add a line between the new point and the end of the line to split
	var lineNew = this.createLineShape(point, this.pointContainer.getChildAt((index+2)%numPoints));
	this.lineContainer.addChildAt(lineNew, index+1);

	// Set the endpoint of the line to split to the new point
	this.editLineShape(line, this.pointContainer.getChildAt(index), point);
	
	this.drawFill();
};

/**
 * Internal use only
 */
RosCanvas.PolygonMarker.prototype.drawFill = function() {
	var numPoints = this.pointContainer.getNumChildren();
	if (numPoints > 2) {
		var g = this.fillShape.graphics;
		g.clear();
		g.setStrokeStyle(0);
		g.moveTo(this.pointContainer.getChildAt(0).x, this.pointContainer.getChildAt(0).y);
		g.beginStroke();
		g.beginFill(this.fillColor);
		for (var i=1; i<numPoints; ++i) {
			g.lineTo(this.pointContainer.getChildAt(i).x, this.pointContainer.getChildAt(i).y);
		}
		g.closePath();
		g.endFill();
		g.endStroke();
	}
	else {
		this.fillShape.graphics.clear();
	}
};


RosCanvas.PolygonMarker.prototype.__proto__ = createjs.Container.prototype;
