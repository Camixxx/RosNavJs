
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
  var type = options.scanType;
  var robot = options.robotName;
  var isPointedCloud = options.isPointedCloud

  this.rootObject = options.rootObject || new createjs.Container();

  // Cloud INIT & Callback
  this.poindCloud = new RosCanvas.PointCloud({
    pointCallBack:function(){}});;

  // viewer.scene.addChild(this.poindCloud);


  var robotListener = new ROSLIB.Topic({
    ros: ros,
    name: robot,
    messageType: 'geometry_msgs/Pose',
    throttle_rate: SCAN.THROTTLE_RATE
  });

  robotListener.subscribe((pos) =>{
    // console.log("robot",pos)
    this.poindCloud.updateRobotPos(pos);
  });

  var cloudListener = new ROSLIB.Topic({
    ros: ros,
    name: name,
    messageType: type,
    throttle_rate: SCAN.THROTTLE_RATE
  });

  cloudListener.subscribe((msg) =>{
    // console.log("scan")
    if(!isPointedCloud){
      this.poindCloud.scanTransform(msg);
    }else{
      this.poindCloud.scanPointCloud(msg);
    }
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
      for(var key in params){
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