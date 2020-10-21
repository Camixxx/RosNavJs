
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