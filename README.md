# RosNavJs
ROSLIB EXAMPLE

## Topic names

    'turtlebot':{
        serverName:'/move_base',
        cmdName:'/cmd_vel_mux/input/teleop',
        planName:'/move_base/NavfnROS/plan',

    },'pr2':{
        serverName:'/pr2_move_base',
        cmdName:'/cmd_vel',
        planName:'/move_base/NavfnROS/plan',
    },

---

## Install Turtlebot and pr2

- ROS Melodic or Kinetic:

`sudo apt-get install ros-kinetic-turtlebot-sim* ....`

- Noetic

Build the source code.

Ref: 
1. [Build pr2 source](https://github.com/Camixxx/ROS-Noetic-pr2.git)
2. [How to build pr2 and turtlebot](https://blog.csdn.net/u013013023/article/details/108362417#comments_13527826)


### Run Turtlebot

change the noetic to your local ROS version, like kinetic or melodic

```bash
export TURTLEBOT_STAGE_WORLD_FILE="/opt/ros/noetic/share/turtlebot_stage/maps/stage/maze.world"
export TURTLEBOT_STAGE_MAP_FILE="/opt/ros/noetic/share/turtlebot_stage/maps/maze.yaml"
roslaunch turtlebot_stage turtlebot_in_stage.launch
```

`roslaunch rosbridge_server rosbridge_websocket.launch `

`rosrun robot_pose_publisher robot_pose_publisher`

![turtlebot](https://github.com/Camixxx/RosNavJs/blob/main/img/roslaunch1cmd.png?raw=true))](https://github.com/Camixxx/RosNavJs/blob/main/img/roslaunch1cmd.png?raw=true)

### Run PR2

`roslaunch pr2_tuckarm tuck_arms.launch`

发布机器人的姿势：`rosrun robot_pose_publisher robot_pose_publisher`

启动rosbridge 服务器：`roslaunch rosbridge_server rosbridge_websocket.launch`


---

## Example

open `public/example/demo.html`

Turtlebot:

<script src="../src/index.js"></script>

Pr2:

<script src="../src/index_pr2.js"></script>

![example](https://img-blog.csdnimg.cn/20200908154040341.png)


1. Double click to set the Goal.
2. Use WASD to control the robot.