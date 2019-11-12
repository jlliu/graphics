"use strict"


var objStr = document.getElementById('test.obj').innerHTML;
var mesh = new OBJ.Mesh(objStr);

var objStar = document.getElementById('star.obj').innerHTML;
var star_mesh = new OBJ.Mesh(objStar);

console.log(mesh);



var createObjectVertices = function(meshObj){
  var a = [];

  console.log( meshObj.indices.length);

  for (var i = 0; i < meshObj.indices.length; i++){

    const NUM_COMPONENTS_FOR_VERTS = 3;
    var elementIdx = meshObj.indices[i]; // e.g. 38

    var thisIndex = meshObj.indices[i];

    var x = meshObj.vertices[(elementIdx * NUM_COMPONENTS_FOR_VERTS) + 0]
    var y = meshObj.vertices[(elementIdx * NUM_COMPONENTS_FOR_VERTS) + 1]
    var z = meshObj.vertices[(elementIdx * NUM_COMPONENTS_FOR_VERTS) + 2]

    a.push(x);
    a.push(y);
    a.push(z);

    var n_x = meshObj.vertexNormals[(elementIdx * NUM_COMPONENTS_FOR_VERTS) + 0]
    var n_y = meshObj.vertexNormals[(elementIdx * NUM_COMPONENTS_FOR_VERTS) + 1]
    var n_z = meshObj.vertexNormals[(elementIdx * NUM_COMPONENTS_FOR_VERTS) + 2]

    a.push(n_x);
    a.push(n_y);
    a.push(n_z);

    var u = meshObj.vertices[(elementIdx * 2) + 0]
    var v = meshObj.vertices[(elementIdx * 2) + 1]

    a.push(u);
    a.push(v);


  }


  console.log(a.length)
  return a;

}

let treeVertices = createObjectVertices(mesh);

let starVertices = createObjectVertices(star_mesh);


////////////////////////////// MATRIX SUPPORT

let cos = t => Math.cos(t);
let sin = t => Math.sin(t);
let identity = ()       => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
let rotateX = t         => [1,0,0,0, 0,cos(t),sin(t),0, 0,-sin(t),cos(t),0, 0,0,0,1];
let rotateY = t         => [cos(t),0,-sin(t),0, 0,1,0,0, sin(t),0,cos(t),0, 0,0,0,1];
let rotateZ = t         => [cos(t),sin(t),0,0, -sin(t),cos(t),0,0, 0,0,1,0, 0,0,0,1];
let scale = (x,y,z)     => [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
let translate = (x,y,z) => [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
let multiply = (a, b)   => {
   let c = [];
   for (let n = 0 ; n < 16 ; n++)
      c.push( a[n&3     ] * b[    n&12] +
              a[n&3 |  4] * b[1 | n&12] +
              a[n&3 |  8] * b[2 | n&12] +
              a[n&3 | 12] * b[3 | n&12] );
   return c;
}

let Matrix = function() {
   let topIndex = 0,
       stack = [ identity() ],
       getVal = () => stack[topIndex],
       setVal = m => stack[topIndex] = m;

   this.identity  = ()      => setVal(identity());
   this.restore   = ()      => --topIndex;
   this.rotateX   = t       => setVal(multiply(getVal(), rotateX(t)));
   this.rotateY   = t       => setVal(multiply(getVal(), rotateY(t)));
   this.rotateZ   = t       => setVal(multiply(getVal(), rotateZ(t)));
   this.save      = ()      => stack[++topIndex] = stack[topIndex-1].slice();
   this.scale     = (x,y,z) => setVal(multiply(getVal(), scale(x,y,z)));
   this.translate = (x,y,z) => setVal(multiply(getVal(), translate(x,y,z)));
   this.value     = ()      => getVal();
}

////////////////////////////// SUPPORT FOR CUBE

const VERTEX_SIZE = 8;

let createCubeVertices = () => {
   let V = [], P = [ -1,-1, 1, 0,0, 1, 0,0,   1, 1, 1, 0,0, 1, 1,1,  -1, 1, 1, 0,1, 1, 0,1,
                      1, 1, 1, 0,0, 1, 1,1,  -1,-1, 1, 0,0, 1, 0,0,   1,-1, 1, 0,0, 1, 1,0,
                      1, 1,-1, 0,0,-1, 0,0,  -1,-1,-1, 0,0,-1, 1,1,  -1, 1,-1, 0,0,-1, 1,0,
                     -1,-1,-1, 0,0,-1, 1,1,   1, 1,-1, 0,0,-1, 0,0,   1,-1,-1, 0,0,-1, 0,1 ];
   for (let n = 0 ; n < 3 ; n++)
      for (let i = 0 ; i < P.length ; i += 8) {
         let p0 = [P[i],P[i+1],P[i+2]], p1 = [P[i+3],P[i+4],P[i+5]], uv = [P[i+6],P[i+7]];
	 V = V.concat(p0).concat(p1).concat(uv);
	 for (let j = 0 ; j < 3 ; j++) {
	    P[i   + j] = p0[(j+1) % 3];
	    P[i+3 + j] = p1[(j+1) % 3];
         }
      }
   return V;
}

let cubeVertices = createCubeVertices();

//////// SUPPORT FOR MESH VERTICES SHAPES

function normalize(vec){
    var magnitude = 0;
    for (var i=0; i< vec.length; i++){
      magnitude += vec[i]**2;
    }
    magnitude = Math.sqrt(magnitude);
    return vec.map(x => x/magnitude);
    
}

function createMeshVertices(M, N, uvToShape, arg) {
  let v = [];
  let addVertex = a => {
    // console.log("adding: " +a.length+" vertices");
    for (let i = 0 ; i < a.length ; i++)
        v.push(a[i]);
   }
  //Start with v= 0 , u = 1
  var vValue = 0.;
  var uValue = 1.;
  var unitHeight= 1/(N-1);
  var unitWidth = 1/(M-1);
  var direction;

  // Loop through ROWS
  for (var i=0; i < (N-1); i++){
    vValue = i / (N - 1);
    if (i % 2 == 0){
      direction = "left";
    } else{
      direction = "right";
    }
    //Loop through COLUMNS
    for (var j=0; j < (M-1); j++){
      //If we are at the beginning of the row strip & DONT REPEAT THE LAST ONE
      if (j == 0 && i == 0){
        var firstPoint = uvToShape(uValue,vValue,arg);

        addVertex(firstPoint);
      }
      if (direction == "left"){
         uValue = 1. - (j/ (M-1));
         var point2 = uvToShape(uValue,vValue+unitHeight, arg);
         var point3 = uvToShape(uValue-unitWidth,vValue, arg);
         var lastPoint = uvToShape(uValue - unitWidth, vValue + unitHeight, arg);
  
      }
      else if (direction == "right"){
        uValue =  (j/ (M-1));
        var point2 = uvToShape(uValue,vValue+unitHeight,arg);
        var point3 = uvToShape(uValue+unitWidth,vValue,arg);
        var lastPoint = uvToShape(uValue + unitWidth, vValue + unitHeight, arg);

      }
      addVertex(point2);
      addVertex(point3);
      // If we are at the end of the row strip, include lastPoint
      if ((j == (M-2))){
        addVertex(lastPoint);

      }
    }
  }
  return v;

}

//// Sphere 

let uvToSphere = (u,v) =>{
  var theta = 2 * Math.PI * u;
  var phi = Math.PI * v - Math.PI/2;

  var x = Math.cos(theta) * Math.cos(phi);
  var y = Math.sin(theta) * Math.cos(phi);
  var z = Math.sin(phi);
  return [x,y,z, x,y,z,u,v];
}

var sphereVertices = createMeshVertices(200,200,uvToSphere);



//// Sphere 

let uvToInverseSphere = (u,v) =>{
  var theta = 2 * Math.PI * u;
  var phi = Math.PI * v - Math.PI/2;

  var x = Math.cos(theta) * Math.cos(phi);
  var y = Math.sin(theta) * Math.cos(phi);
  var z = Math.sin(phi);
  return [x,y,z,-x,-y,-z,u,v];
}

var inverseSphereVertices = createMeshVertices(20,20,uvToInverseSphere);

//// torus 

let uvToTorus = (u,v) =>{
  var theta = 2 * Math.PI * u;
  var phi = 2 * Math.PI * v;

  var r = .6; //just define inner tube here

  var x = Math.cos(theta) * (1 + r * Math.cos(phi));
  var y = Math.sin(theta) * (1 + r * Math.cos(phi));
  var z = r * Math.sin(phi);

  var n_x = Math.cos(theta) * Math.cos(phi);
  var n_y = Math.sin(theta) * Math.cos(phi);
  var n_z = Math.sin(phi);

  return [x,y,z,n_x,n_y,n_z,u,v];
}
var torusVertices =  createMeshVertices(50,20,uvToTorus);

///Tube


let uvToTube = (u,v) =>{
  var theta = 2 * Math.PI * u;

  var x = Math.cos(theta);
  var y = Math.sin(theta);
  var z = 2*v -1;


  return [x,y,z,x,y,0,u,v];
}

var tubeVertices =  createMeshVertices(10,10,uvToTube);

////Cylinder 
var tubeVertices =  createMeshVertices(10,10,uvToTube);

let uvToCylinder = (u,v) =>{
  var c = Math.cos(2*Math.PI*u);
  var s = Math.sin(2*Math.PI*u);
  var z = Math.max(-1,Math.min(1,10*v - 5));

  switch (Math.floor(5.001*v)){
    case 0: case 5: return [ 0,0,z, 0,0,z,u,v]; //center of back/front end cap
    case 1: case 4: return [ c,s,z , 0,0,z,u,v]; //perimeter of back/front end cap
    case 2: case 3: return [ c,s,z, c,s,0,u,v];

  }

}


var cylinderVertices =  createMeshVertices(50,6,uvToCylinder);



////////////////////////////// SCENE SPECIFIC CODE

async function setup(state) {
    hotReloadFile(getPath('week8.js'));

    const images = await imgutil.loadImagesPromise([
       getPath("textures/brick.png"),
       getPath("textures/star-bg.png"),
        getPath("textures/sky-bg.png"),
    ]);

    let libSources = await MREditor.loadAndRegisterShaderLibrariesForLiveEditing(gl, "libs", [
        { key : "pnoise"    , path : "shaders/noise.glsl"     , foldDefault : true },
        { key : "sharedlib1", path : "shaders/sharedlib1.glsl", foldDefault : true },      
    ]);
    if (! libSources)
        throw new Error("Could not load shader library");

    // load vertex and fragment shaders from the server, register with the editor
    let shaderSource = await MREditor.loadAndRegisterShaderForLiveEditing(
        gl,
        "mainShader",
        { 
            onNeedsCompilation : (args, libMap, userData) => {
                const stages = [args.vertex, args.fragment];
                const output = [args.vertex, args.fragment];
                const implicitNoiseInclude = true;
                if (implicitNoiseInclude) {
                    let libCode = MREditor.libMap.get('pnoise');
                    for (let i = 0; i < 2; i++) {
                        const stageCode = stages[i];
                        const hdrEndIdx = stageCode.indexOf(';');
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        output[i] = hdr + '\n#line 2 1\n' + 
                                    '#include<pnoise>\n#line ' + (hdr.split('\n').length + 1) + ' 0' + 
                                    stageCode.substring(hdrEndIdx + 1);
                    }
                }
                MREditor.preprocessAndCreateShaderProgramFromStringsAndHandleErrors(
                    output[0],
                    output[1],
                    libMap
                );
            },
            onAfterCompilation : (program) => {
                gl.useProgram(state.program = program);
                state.uColorLoc    = gl.getUniformLocation(program, 'uColor');
                state.uCursorLoc   = gl.getUniformLocation(program, 'uCursor');
                state.uModelLoc    = gl.getUniformLocation(program, 'uModel');
                state.uProjLoc     = gl.getUniformLocation(program, 'uProj');
                state.uTexIndexLoc = gl.getUniformLocation(program, 'uTexIndex');
                state.uTimeLoc     = gl.getUniformLocation(program, 'uTime');
                state.uViewLoc     = gl.getUniformLocation(program, 'uView');
		state.uTexLoc = [];
		for (let n = 0 ; n < 8 ; n++) {
		   state.uTexLoc[n] = gl.getUniformLocation(program, 'uTex' + n);
                   gl.uniform1i(state.uTexLoc[n], n);
		}
            } 
        },
        {
            paths : {
                vertex   : "shaders/vertex.vert.glsl",
                fragment : "shaders/fragment.frag.glsl"
            },
            foldDefault : {
                vertex   : true,
                fragment : false
            }
        }
    );
    if (! shaderSource)
        throw new Error("Could not load shader");

    state.cursor = ScreenCursor.trackCursor(MR.getCanvas());

    state.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);

    let bpe = Float32Array.BYTES_PER_ELEMENT;

    let aPos = gl.getAttribLocation(state.program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 0);

    let aNor = gl.getAttribLocation(state.program, 'aNor');
    gl.enableVertexAttribArray(aNor);
    gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 3);

    let aUV  = gl.getAttribLocation(state.program, 'aUV');
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV , 2, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 6);

    for (let i = 0 ; i < images.length ; i++) {
        gl.activeTexture (gl.TEXTURE0 + i);
        gl.bindTexture   (gl.TEXTURE_2D, gl.createTexture());
        gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D    (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
}

let noise = new ImprovedNoise();
let m = new Matrix();
let turnAngle = 0, cursorPrev = [0,0,0];

function onStartFrame(t, state) {
    if (! state.tStart)
        state.tStart = t;
    state.time = (t - state.tStart) / 1000;

    let cursorValue = () => {
       let p = state.cursor.position(), canvas = MR.getCanvas();
       return [ p[0] / canvas.clientWidth * 2 - 1, 1 - p[1] / canvas.clientHeight * 2, p[2] ];
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let cursorXYZ = cursorValue();
    if (cursorXYZ[2] && cursorPrev[2])
        turnAngle += 2 * (cursorXYZ[0] - cursorPrev[0]);
    cursorPrev = cursorXYZ;

    gl.uniform3fv(state.uCursorLoc     , cursorXYZ);
    gl.uniform1f (state.uTimeLoc       , state.time);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
}



function onDraw(t, projMat, viewMat, state, eyeIdx) {
    gl.uniformMatrix4fv(state.uViewLoc, false, new Float32Array(viewMat));
    gl.uniformMatrix4fv(state.uProjLoc, false, new Float32Array(projMat));

    let drawShape = (color, type, vertices, texture) => {
       gl.uniform3fv(state.uColorLoc, color);
       gl.uniformMatrix4fv(state.uModelLoc, false, m.value());
       gl.uniform1i(state.uTexIndexLoc, texture === undefined ? -1 : texture);
       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW);
       gl.drawArrays(type, 0, vertices.length / VERTEX_SIZE);
    }

    m.identity();

    m.save();
      m.rotateY(turnAngle);

      m.save();
         m.translate(0,-2,0);
         m.scale(12,.01,12);
         m.rotateX(Math.PI/2);
         drawShape([1,1,1], gl.TRIANGLE_STRIP, cylinderVertices, 1);
      m.restore();

      var starDisplacements = [[-2,5,1],[-1,4,2],[-2.5,3,2],[2,2,-2]];

      for (let z = -3 ; z <= 5 ; z += 2)
      for (let x = -3 ; x <= 5 ; x += 5) {
         m.save();
            let motion = Math.max(Math.abs(x),Math.abs(z)) / 3 - 1 +
  	          noise.noise(x, 0, 100 * z + state.time / 2) / 5;
            m.translate(x, -1, z);
            m.scale(.3,.3,.3);

            drawShape([.8,.9,.9], gl.TRIANGLES, treeVertices);
           
              //Draw random stars
                  m.rotateY(state.time*.1);
                  for (var i =0;i<4;i++){
                     m.save();
                    var d = starDisplacements[i];
                     m.translate(d[0],d[1],d[2]);
                    m.scale(.2,.2,.2);
                    m.rotateX(Math.PI/2);
                    m.rotateZ(state.time-i);
                    drawShape([1,1,0], gl.TRIANGLES, starVertices);
                      m.restore();
                  }
                 
          

         m.restore();
      }



   m.translate(0,0,0);
   m.scale(-12,-12,-12);
    drawShape([1,1,1], gl.TRIANGLE_STRIP, sphereVertices,2);

    m.restore();



   // m.translate(0,0,-200);
   // m.scale(100,100,0);
   //  drawShape([1,1,1], gl.TRIANGLES, cubeVertices,2);



}

function onEndFrame(t, state) {}

export default function main() {
    const def = {
        name         : 'week8',
        setup        : setup,
        onStartFrame : onStartFrame,
        onEndFrame   : onEndFrame,
        onDraw       : onDraw,
    };

    return def;
}

