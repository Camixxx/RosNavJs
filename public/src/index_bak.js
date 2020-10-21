 /**
   * Setup all visualization elements when the page is loaded. 
   */
  var ros;
  var viewer;
  var nav;
  var topicList=[];
  var topicValueList = {};
  var THROTTLE_RATE = 50;
  
  var subcribeAll= function(topicsRes){
    for(var i=0;i<topicsRes.topics.length;i=i+1){
      var Listener = new ROSLIB.Topic({
        ros: ros,
        name: topicsRes.topics[i],
        messageType: topicsRes.types[i],
        throttle_rate: THROTTLE_RATE
      });
      Listener.idx = i;
      
      topicList.push(Listener);
      topicValueList[Listener.name] = "Loading...";
      Listener.subscribe(function(value) {
        var data = ""
        if(value){
          data = removeHeader(value);
        }
        topicValueList[this.name] = data
        updateValue(this.name, this.idx, data)
      });
    }
  }

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

  var initDataInterface = function(topicsRes,topicsValue){
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
  }


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
    var nav = NAV.OccupancyGridClientNav({
      ros : ros,
      rootObject : viewer.scene,
      viewer : viewer,
      serverName : '/move_base'
    });

    var controller = NAV.controller(ros)

    ros.on('error', function(error) {
      document.querySelector('#rosStatus').className = ("error_state");
      document.querySelector('#rosStatus').innerText = "Error in the backend!";
      console.log(error);
    });
  
    // Find out exactly when we made a connection.
    ros.on('connection', function() {
      console.log('Connection made!');
      ros.getTopics(function(res){
          initDataInterface(res,topicValueList);
          subcribeAll(res);
        }, function(err){
          console.log("ERROR:",err);
        }
      )
      document.querySelector('#rosStatus').className = ("connected_state");
      document.querySelector('#rosStatus').innerText = " Connected.";
    });
  
    ros.on('close', function() {
      console.log('Connection closed.');
      document.querySelector('#rosStatus').className = ("");
      document.querySelector('#rosStatus').innerText = " Connection closed.";
    });

  }
 