
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


// export default NAV;