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
    // 
    url:'ws://localhost:9090/'
    // url : 'ws://192.168.2.197:4090/'
    // url : 'ws://192.168.1.139:9090'
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
      serverName : '/pr2_move_base'
    });

    // keyboard W A S D control the robot
    controller = NAV.controller(ros,'/cmd_vel', 'controller_show_div')
    
    // show topics
    var showTopics = new SCAN.topicShowAll(ros,"show_all");
    
    // pointCloud Scan
    cloudScan = new SCAN.cloudScan({
      ros : ros,
      robotName : '/robot_pose',
      // scanName: '/scan',
      // scanType: 'sensor_msgs/LaserScan',
      scanName: '/move_base/global_costmap/obstacle_layer/clearing_endpoints',
      scanType: 'sensor_msgs/PointCloud',
      isPointedCloud: true
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
 