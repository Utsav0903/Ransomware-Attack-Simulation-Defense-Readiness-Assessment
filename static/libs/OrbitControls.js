
(function(global){
'use strict';
if(!global.THREE){console.error('THREE must load first');return;}
var THREE=global.THREE;
var STATE={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_DOLLY_PAN:5};
function OrbitControls(object,domElement){
  this.object=object;this.domElement=domElement||document;
  this.enabled=true;this.target=new THREE.Vector3();
  this.minDistance=0;this.maxDistance=Infinity;
  this.minZoom=0;this.maxZoom=Infinity;
  this.minPolarAngle=0;this.maxPolarAngle=Math.PI;
  this.minAzimuthAngle=-Infinity;this.maxAzimuthAngle=Infinity;
  this.enableDamping=false;this.dampingFactor=0.05;
  this.enableZoom=true;this.zoomSpeed=1.0;
  this.enableRotate=true;this.rotateSpeed=1.0;
  this.enablePan=true;this.panSpeed=1.0;
  this.screenSpacePanning=true;
  this.autoRotate=false;this.autoRotateSpeed=2.0;
  var scope=this,state=STATE.NONE,EPS=0.000001;
  var spherical=new THREE.Spherical(),sphericalDelta=new THREE.Spherical();
  var scale=1,panOffset=new THREE.Vector3(),zoomChanged=false;
  var rotateStart=new THREE.Vector2(),rotateEnd=new THREE.Vector2(),rotateDelta=new THREE.Vector2();
  var panStart=new THREE.Vector2(),panEnd=new THREE.Vector2(),panDelta=new THREE.Vector2();
  var dollyStart=new THREE.Vector2(),dollyEnd=new THREE.Vector2(),dollyDelta=new THREE.Vector2();
  function getAutoAngle(){return 2*Math.PI/60/60*scope.autoRotateSpeed;}
  function getZoomScale(){return Math.pow(0.95,scope.zoomSpeed);}
  function rotateLeft(a){sphericalDelta.theta-=a;}
  function rotateUp(a){sphericalDelta.phi-=a;}
  var panLeftV=new THREE.Vector3();
  function panLeft(d,m){panLeftV.setFromMatrixColumn(m,0);panLeftV.multiplyScalar(-d);panOffset.add(panLeftV);}
  var panUpV=new THREE.Vector3();
  function panUp(d,m){
    if(scope.screenSpacePanning)panUpV.setFromMatrixColumn(m,1);
    else{panUpV.setFromMatrixColumn(m,0);panUpV.crossVectors(scope.object.up,panUpV);}
    panUpV.multiplyScalar(d);panOffset.add(panUpV);
  }
  function pan(dx,dy){
    var el=scope.domElement;
    if(scope.object.isPerspectiveCamera){
      var pos=scope.object.position,offset=pos.clone().sub(scope.target);
      var td=offset.length()*Math.tan(scope.object.fov/2*Math.PI/180);
      panLeft(2*dx*td/el.clientHeight,scope.object.matrix);
      panUp(2*dy*td/el.clientHeight,scope.object.matrix);
    }
  }
  function dollyIn(s){if(scope.object.isPerspectiveCamera)scale/=s;}
  function dollyOut(s){if(scope.object.isPerspectiveCamera)scale*=s;}
  var offset=new THREE.Vector3();
  var quat=new THREE.Quaternion().setFromUnitVectors(object.up,new THREE.Vector3(0,1,0));
  var quatInverse=quat.clone().conjugate();
  var lastPos=new THREE.Vector3(),lastQuat=new THREE.Quaternion();
  this.update=function(){
    var pos=scope.object.position;
    offset.copy(pos).sub(scope.target);
    offset.applyQuaternion(quat);
    spherical.setFromVector3(offset);
    if(scope.autoRotate&&state===STATE.NONE)rotateLeft(getAutoAngle());
    if(scope.enableDamping){
      spherical.theta+=sphericalDelta.theta*scope.dampingFactor;
      spherical.phi+=sphericalDelta.phi*scope.dampingFactor;
    }else{spherical.theta+=sphericalDelta.theta;spherical.phi+=sphericalDelta.phi;}
    var min=scope.minAzimuthAngle,max=scope.maxAzimuthAngle;
    if(isFinite(min)&&isFinite(max)){
      if(min<-Math.PI)min+=2*Math.PI;else if(min>Math.PI)min-=2*Math.PI;
      if(max<-Math.PI)max+=2*Math.PI;else if(max>Math.PI)max-=2*Math.PI;
      if(min<=max)spherical.theta=Math.max(min,Math.min(max,spherical.theta));
    }
    spherical.phi=Math.max(scope.minPolarAngle,Math.min(scope.maxPolarAngle,spherical.phi));
    spherical.makeSafe();spherical.radius*=scale;
    spherical.radius=Math.max(scope.minDistance,Math.min(scope.maxDistance,spherical.radius));
    if(scope.enableDamping)scope.target.addScaledVector(panOffset,scope.dampingFactor);
    else scope.target.add(panOffset);
    offset.setFromSpherical(spherical);offset.applyQuaternion(quatInverse);
    pos.copy(scope.target).add(offset);
    scope.object.lookAt(scope.target);
    if(scope.enableDamping){
      sphericalDelta.theta*=(1-scope.dampingFactor);sphericalDelta.phi*=(1-scope.dampingFactor);
      panOffset.multiplyScalar(1-scope.dampingFactor);
    }else{sphericalDelta.set(0,0,0);panOffset.set(0,0,0);}
    scale=1;
    if(zoomChanged||lastPos.distanceToSquared(scope.object.position)>EPS||8*(1-lastQuat.dot(scope.object.quaternion))>EPS){
      lastPos.copy(scope.object.position);lastQuat.copy(scope.object.quaternion);zoomChanged=false;return true;
    }
    return false;
  };
  this.dispose=function(){
    scope.domElement.removeEventListener('contextmenu',onContextMenu);
    scope.domElement.removeEventListener('mousedown',onMouseDown);
    scope.domElement.removeEventListener('wheel',onMouseWheel);
    scope.domElement.removeEventListener('touchstart',onTouchStart);
    scope.domElement.removeEventListener('touchend',onTouchEnd);
    scope.domElement.removeEventListener('touchmove',onTouchMove);
    document.removeEventListener('mousemove',onMouseMove);
    document.removeEventListener('mouseup',onMouseUp);
  };
  function onMouseDown(e){
    if(!scope.enabled)return;e.preventDefault();
    if(e.button===0){if(!scope.enableRotate)return;rotateStart.set(e.clientX,e.clientY);state=STATE.ROTATE;}
    else if(e.button===1){if(!scope.enableZoom)return;dollyStart.set(e.clientX,e.clientY);state=STATE.DOLLY;}
    else if(e.button===2){if(!scope.enablePan)return;panStart.set(e.clientX,e.clientY);state=STATE.PAN;}
    if(state!==STATE.NONE){document.addEventListener('mousemove',onMouseMove);document.addEventListener('mouseup',onMouseUp);}
  }
  function onMouseMove(e){
    if(!scope.enabled)return;e.preventDefault();
    if(state===STATE.ROTATE){
      if(!scope.enableRotate)return;
      rotateEnd.set(e.clientX,e.clientY);rotateDelta.subVectors(rotateEnd,rotateStart).multiplyScalar(scope.rotateSpeed);
      var el=scope.domElement;
      rotateLeft(2*Math.PI*rotateDelta.x/el.clientHeight);rotateUp(2*Math.PI*rotateDelta.y/el.clientHeight);
      rotateStart.copy(rotateEnd);
    }else if(state===STATE.DOLLY){
      if(!scope.enableZoom)return;
      dollyEnd.set(e.clientX,e.clientY);dollyDelta.subVectors(dollyEnd,dollyStart);
      if(dollyDelta.y>0)dollyIn(getZoomScale());else if(dollyDelta.y<0)dollyOut(getZoomScale());
      dollyStart.copy(dollyEnd);
    }else if(state===STATE.PAN){
      if(!scope.enablePan)return;
      panEnd.set(e.clientX,e.clientY);panDelta.subVectors(panEnd,panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x,panDelta.y);panStart.copy(panEnd);
    }
  }
  function onMouseUp(){document.removeEventListener('mousemove',onMouseMove);document.removeEventListener('mouseup',onMouseUp);state=STATE.NONE;}
  function onMouseWheel(e){
    if(!scope.enabled||!scope.enableZoom||(state!==STATE.NONE&&state!==STATE.ROTATE))return;
    e.preventDefault();e.stopPropagation();
    if(e.deltaY<0)dollyOut(getZoomScale());else if(e.deltaY>0)dollyIn(getZoomScale());
  }
  function onTouchStart(e){
    if(!scope.enabled)return;e.preventDefault();
    if(e.touches.length===1){if(!scope.enableRotate)return;rotateStart.set(e.touches[0].pageX,e.touches[0].pageY);state=STATE.TOUCH_ROTATE;}
    else if(e.touches.length===2){var dx=e.touches[0].pageX-e.touches[1].pageX,dy=e.touches[0].pageY-e.touches[1].pageY;dollyStart.set(Math.sqrt(dx*dx+dy*dy),0);state=STATE.TOUCH_DOLLY_PAN;}
  }
  function onTouchMove(e){
    if(!scope.enabled)return;e.preventDefault();
    if(state===STATE.TOUCH_ROTATE){
      if(!scope.enableRotate)return;
      rotateEnd.set(e.touches[0].pageX,e.touches[0].pageY);rotateDelta.subVectors(rotateEnd,rotateStart).multiplyScalar(scope.rotateSpeed);
      var el=scope.domElement;rotateLeft(2*Math.PI*rotateDelta.x/el.clientHeight);rotateUp(2*Math.PI*rotateDelta.y/el.clientHeight);rotateStart.copy(rotateEnd);
    }else if(state===STATE.TOUCH_DOLLY_PAN&&e.touches.length===2){
      var dx=e.touches[0].pageX-e.touches[1].pageX,dy=e.touches[0].pageY-e.touches[1].pageY;
      dollyEnd.set(Math.sqrt(dx*dx+dy*dy),0);dollyDelta.subVectors(dollyEnd,dollyStart);
      if(dollyDelta.x>0)dollyOut(getZoomScale());else if(dollyDelta.x<0)dollyIn(getZoomScale());
      dollyStart.copy(dollyEnd);
    }
  }
  function onTouchEnd(){state=STATE.NONE;}
  function onContextMenu(e){if(!scope.enabled)return;e.preventDefault();}
  scope.domElement.addEventListener('contextmenu',onContextMenu);
  scope.domElement.addEventListener('mousedown',onMouseDown);
  scope.domElement.addEventListener('wheel',onMouseWheel,{passive:false});
  scope.domElement.addEventListener('touchstart',onTouchStart,{passive:false});
  scope.domElement.addEventListener('touchend',onTouchEnd);
  scope.domElement.addEventListener('touchmove',onTouchMove,{passive:false});
  this.update();
}
OrbitControls.prototype=Object.create(THREE.EventDispatcher.prototype);
OrbitControls.prototype.constructor=OrbitControls;
THREE.OrbitControls=OrbitControls;
})(typeof window!=='undefined'?window:this);
