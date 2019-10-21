"use strict"


const VERTEX_SIZE = 6; // EACH VERTEX CONSISTS OF: x,y,z, ny,ny,nz


 //////////////////////////////////////////////////////////////////
//                                                                //
//  FOR HOMEWORK, YOU CAN ALSO TRY DEFINING DIFFERENT SHAPES,     //
//  BY CREATING OTHER VERTEX ARRAYS IN ADDITION TO cubeVertices.  //
//                                                                //
 //////////////////////////////////////////////////////////////////
function normalize(vec){
    var magnitude = 0;
    for (var i=0; i< vec.length; i++){
      magnitude += vec[i]**2;
    }
    magnitude = Math.sqrt(magnitude);
    return vec.map(x => x/magnitude);
    
}

let createCubeVertices = () => {
   let v = [];
   let addVertex = a => {
      for (let i = 0 ; i < a.length ; i++)
         v.push(a[i]);
   }

   // EACH SQUARE CONSISTS OF TWO TRIANGLES.

   let addSquare = (a,b,c,d) => {
      addVertex(c);
      addVertex(b);
      addVertex(a);

      addVertex(b);
      addVertex(c);
      addVertex(d);
   }

   // VERTEX DATA FOR TWO OPPOSING SQUARE FACES. EACH VERTEX CONSISTS OF: x,y,z, nx,ny,nz

   let P = [[-1,-1,-1, 0,0,-1],[ 1,-1,-1, 0,0,-1],[-1, 1,-1, 0,0,-1],[ 1, 1,-1, 0,0,-1],
            [-1,-1, 1, 0,0, 1],[ 1,-1, 1, 0,0, 1],[-1, 1, 1, 0,0, 1],[ 1, 1, 1, 0,0, 1]];

   // LOOP THROUGH x,y,z. EACH TIME ADD TWO OPPOSING FACES, THEN PERMUTE COORDINATES.

   for (let n = 0 ; n < 3 ; n++) {
      addSquare(P[0],P[1],P[2],P[3]);
      addSquare(P[4],P[5],P[6],P[7]);
      for (let i = 0 ; i < P.length ; i++)
         P[i] = [P[i][1],P[i][2],P[i][0], P[i][4],P[i][5],P[i][3]];
   }

   return v;
}

let cubeVertices = createCubeVertices();

let createMeshVertices = (M,N,callback) =>{
  let v = [];
  let addVertex = a => {
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
        var firstPoint = callback(uValue,vValue);
        addVertex(firstPoint);
      }
      if (direction == "left"){
         uValue = 1. - (j/ (M-1));
         var point2 = callback(uValue,vValue+unitHeight);
         var point3 = callback(uValue-unitWidth,vValue);
         var lastPoint = callback(uValue - unitWidth, vValue + unitHeight);
      }
      else if (direction == "right"){
        uValue =  (j/ (M-1));
        var point2 = callback(uValue,vValue+unitHeight);
        var point3 = callback(uValue+unitWidth,vValue);
        var lastPoint = callback(uValue + unitWidth, vValue + unitHeight);
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

let uvToSphere = (u,v) =>{
  var theta = 2 * Math.PI * u;
  var phi = Math.PI * v - Math.PI/2;

  var x = Math.cos(theta) * Math.cos(phi);
  var y = Math.sin(theta) * Math.cos(phi);
  var z = Math.sin(phi);
  return [x,y,z, x,y,z];
}

var sphereVertices = createMeshVertices(20,20,uvToSphere);
console.log(sphereVertices);


for (var i = 0; i < 19; i++){
  var ver = sphereVertices;
  console.log(ver.slice(i*6,i*6+6));
}

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

  return [x,y,z,n_x,n_y,n_z];
}

let uvToTorusSkinny = (u,v) =>{
  var theta = 2 * Math.PI * u;
  var phi = 2 * Math.PI * v;

  var r = .05; //just define inner tube here

  var x = Math.cos(theta) * (1 + r * Math.cos(phi));
  var y = Math.sin(theta) * (1 + r * Math.cos(phi));
  var z = r * Math.sin(phi);

  var n_x = Math.cos(theta) * Math.cos(phi);
  var n_y = Math.sin(theta) * Math.cos(phi);
  var n_z = Math.sin(phi);

  return [x,y,z,n_x,n_y,n_z];
}


var torusVertices =  createMeshVertices(50,20,uvToTorus);

var torusSkinnyVertices =  createMeshVertices(50,20,uvToTorusSkinny);

let uvToTube = (u,v) =>{
  var theta = 2 * Math.PI * u;

  var x = Math.cos(theta);
  var y = Math.sin(theta);
  var z = 2*v -1;


  return [x,y,z,x,y,0];
}

var tubeVertices =  createMeshVertices(10,10,uvToTube);

let uvToCylinder = (u,v) =>{
  var c = Math.cos(2*Math.PI*u);
  var s = Math.sin(2*Math.PI*u);
  var z = Math.max(-1,Math.min(1,10*v - 5));

  switch (Math.floor(5.001*v)){
    case 0: case 5: return [ 0,0,z, 0,0,z]; //center of back/front end cap
    case 1: case 4: return [ c,s,z , 0,0,z]; //perimeter of back/front end cap
    case 2: case 3: return [ c,s,z, c,s,0];

  }

}


var cylinderVertices =  createMeshVertices(50,6,uvToCylinder);


async function setup(state) {
    hotReloadFile(getPath('week6.js'));

    state.m = new Matrix();

    let libSources = await MREditor.loadAndRegisterShaderLibrariesForLiveEditing(gl, "libs", [
        { 
            key : "pnoise", path : "shaders/noise.glsl", foldDefault : true
        },
        {
            key : "sharedlib1", path : "shaders/sharedlib1.glsl", foldDefault : true
        },      
    ]);

    if (!libSources) {
        throw new Error("Could not load shader library");
    }

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
                    let libCode = MREditor.libMap.get("pnoise");

                    for (let i = 0; i < 2; i += 1) {
                        const stageCode = stages[i];
                        const hdrEndIdx = stageCode.indexOf(';');
                        
                        /*
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        output[i] = hdr + "\n#line 1 1\n" + 
                                    libCode + "\n#line " + (hdr.split('\n').length) + " 0\n" + 
                                    stageCode.substring(hdrEndIdx + 1);
                        console.log(output[i]);
                        */
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        
                        output[i] = hdr + "\n#line 2 1\n" + 
                                    "#include<pnoise>\n#line " + (hdr.split('\n').length + 1) + " 0" + 
                            stageCode.substring(hdrEndIdx + 1);

                        //console.log(output[i]);
                    }
                }

                MREditor.preprocessAndCreateShaderProgramFromStringsAndHandleErrors(
                    output[0],
                    output[1],
                    libMap
                );
            },
            onAfterCompilation : (program) => {
                state.program = program;

                gl.useProgram(program);

                state.uColorLoc        = gl.getUniformLocation(program, 'uColor');
                state.uCursorLoc       = gl.getUniformLocation(program, 'uCursor');
                state.uModelLoc        = gl.getUniformLocation(program, 'uModel');
                state.uProjLoc         = gl.getUniformLocation(program, 'uProj');
                state.uTimeLoc         = gl.getUniformLocation(program, 'uTime');
                state.uViewLoc         = gl.getUniformLocation(program, 'uView');



                //Location of light elements
                state.uLightsLoc = [];

                var NL = 4;

                for (var i=0; i<NL; i++){
                    state.uLightsLoc[i] = {};
                    state.uLightsLoc[i].direction        = gl.getUniformLocation(program, 'uLights['+i+'].dir');
                    state.uLightsLoc[i].col        = gl.getUniformLocation(program, 'uLights['+i+'].col');
                }

                //Location of Materials
                state.uMaterialsLoc = [];

                state.uMaterialsLoc = {};
                state.uMaterialsLoc.diffuse        = gl.getUniformLocation(program, 'uMaterial.diffuse');
                state.uMaterialsLoc.ambient        = gl.getUniformLocation(program, 'uMaterial.ambient');
                state.uMaterialsLoc.specular        = gl.getUniformLocation(program, 'uMaterial.specular');
                state.uMaterialsLoc.power        = gl.getUniformLocation(program, 'uMaterial.power');
                state.uMaterialsLoc.reflect        = gl.getUniformLocation(program, 'uMaterial.reflect');
                state.uMaterialsLoc.transparent        = gl.getUniformLocation(program, 'uMaterial.transparent');
                state.uMaterialsLoc.indexOfRefraction        = gl.getUniformLocation(program, 'uMaterial.indexOfRefraction');

                //Special variable for fish texture
                state.uFishTextureLoc = gl.getUniformLocation(program, 'uFishTexture');
                
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

    state.cursor = ScreenCursor.trackCursor(MR.getCanvas());

    if (!shaderSource) {
        throw new Error("Could not load shader");
    }

    // Create a square as a triangle strip consisting of two triangles
    state.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);

 ///////////////////////////////////////////////////////////
//                                                         //
//  HINT: IF YOU WANT TO IMPLEMENT MORE THAN ONE SHAPE,    //
//  YOU MIGHT WANT TO CALL gl.bufferData()                 //
//  MULTIPLE TIMES IN onDraw() INSTEAD OF HERE,            //
//  USING OTHER ARRAY VALUES IN ADDITION TO cubeVertices.  //
//                                                         //
 ///////////////////////////////////////////////////////////

      let bpe = Float32Array.BYTES_PER_ELEMENT;

    let aPos = gl.getAttribLocation(state.program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 0);

    let aNor = gl.getAttribLocation(state.program, 'aNor');
    gl.enableVertexAttribArray(aNor);
    gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 3);
}


///////////////////////////////////////////////////////////////////////
//                                                                   //
//  MATRIX OPERATIONS                                                //
//                                                                   //
///////////////////////////////////////////////////////////////////////

let identity = ()       => [1.,0.,0.,0.,
                            0.,1.,0.,0,
                            0.,0.,1.,0.,
                            0.,0.,0.,1.];

let rotateX = t         => [1.,0.,0.,0.,
                            0.,Math.cos(t),Math.sin(t),0.,
                            0.,-Math.sin(t),Math.cos(t),0.,
                            0.,0.,0.,1.];

let rotateY = t         => [Math.cos(t),0.,-Math.sin(t),0.,
                            0.,1.,0.,0.,
                            Math.sin(t),0.,Math.cos(t),0.,
                            0.,0.,0.,1.];

let rotateZ = t         => [Math.cos(t),Math.sin(t),0.,0.,
                            -Math.sin(t),Math.cos(t),0.,0.,
                            0.,0.,1.,0.,
                            0.,0.,0.,1.];
let scale = (x,y,z)     => [x,0.,0.,0.,
                            0.,y,0.,0.,
                            0.,0.,z,0.,
                            0.,0.,0.,1.];

let translate = (x,y,z) => [1.,0.,0.,0.,
                            0.,1.,0.,0.,
                            0.,0.,1.,0.,
                            x,y,z,1.];

let inverse = src => {
  let dst = [], det = 0, cofactor = (c, r) => {
     let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
     return (c+r & 1 ? -1 : 1) * ( (s(1,1) * (s(2,2) * s(3,3) - s(3,2) * s(2,3)))
                                 - (s(2,1) * (s(1,2) * s(3,3) - s(3,2) * s(1,3)))
                                 + (s(3,1) * (s(1,2) * s(2,3) - s(2,2) * s(1,3))) );
  }
  for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
  for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
  for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
  return dst;
}

let multiply = (a, b) => {
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

function onStartFrame(t, state) {

    state.color = [1,.5,.2];


    // uTime IS TIME IN SECONDS SINCE START TIME.

    if (!state.tStart)
        state.tStart = t;
    state.time = (t - state.tStart) / 1000;

    gl.uniform1f (state.uTimeLoc  , state.time);


    // uCursor WILL GO FROM -1 TO +1 IN xy, WITH z = 0 FOR MOUSE UP, 1 FOR MOUSE DOWN.

    let cursorValue = () => {
       let p = state.cursor.position(), canvas = MR.getCanvas();
       return [ p[0] / canvas.clientWidth * 2 - 1, 1 - p[1] / canvas.clientHeight * 2, p[2] ];
    }

    gl.uniform3fv(state.uCursorLoc, cursorValue());


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
}

var lightNumber = 0;

function setLight(state,sourcePoint, color){

    gl.uniform3fv(state.uLightsLoc[lightNumber].direction,normalize(sourcePoint));
    gl.uniform3fv(state.uLightsLoc[lightNumber].col, color);
    lightNumber++;
};


function Material(ambient,diffuse,specular,power,reflect,transparent,indexOfRefraction){
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.specular = specular;
    this.power = power;
    this.reflect = reflect;
    this.transparent = transparent;
    this.indexOfRefraction = indexOfRefraction;
}


var salmon = new Material([.9,.15,.04],[.1,.001,.01],[0.0,0.1,0.03],.6,[0.0,0.2,0.2],[0.,0.,0.],1.2);

var tuna = new Material([1.,.0,.05],[.0,.01,.0],[0.0,0.1,0.15],2.,[0.3,0.3,0.3],[0.,0.,0.],1.2);

var egg = new Material([.8,.65,.05],[.0,.01,.0],[0.,0.1,0.1],2.,[0.3,0.3,0.3],[0.,0.,0.],1.2);

var seaweed = new Material([.001,.002,.001],[.0,.1,.0],[0.0,0.01,0.01],2.,[0.0,0.0,0.0],[0.,0.,0.],1.2);

var eel = new Material([.2,.05,.0],[.0,.00,.0],[0.2,0.2,0.05],2.,[0.0,0.0,0.0],[0.,0.,0.],1.2);

var cucumber = new  Material([.3,.8,.1],[.0,.00,.0],[0.1,0.1,0.05],2.,[0.0,0.0,0.0],[0.,0.,0.],1.2);

var white = new Material([.8,.8,.8],[.1,.1,.1],[0.1,0.1,0.1],10.,[0.0,0.0,0.0],[0.,0.,0.],1.2);

var plate = new Material([.9,.2,.9],[.0,.0,.0],[0.1,0.1,0.1],.4,[0.1,0.1,0.1],[0.,0.,0.],1.2);


var blue = new Material([.3,.1,.9],[.0,.1,.1],[0.1,0.1,0.1],10.,[0.0,0.0,0.0],[0.,0.,0.],1.2);

function setMaterial(state, material){
    gl.uniform3fv(state.uMaterialsLoc.ambient , material.ambient);
    gl.uniform3fv(state.uMaterialsLoc.diffuse , material.diffuse);
    gl.uniform3fv(state.uMaterialsLoc.specular, material.specular);
    gl.uniform1f(state.uMaterialsLoc.power   , material.power);
    gl.uniform3fv(state.uMaterialsLoc.reflect   , material.reflect);
    gl.uniform3fv(state.uMaterialsLoc.transparent   ,material.transparent);
    gl.uniform1f(state.uMaterialsLoc.indexOfRefraction   ,material.indexOfRefraction);  
}


let createIkuraPlacements = ()=>{
  var ikuraPlacements = [];
  for (var i=0;i < 60; i++){
    ikuraPlacements.push([Math.random()*5.5,Math.random()*1,Math.random()*14]);
  }
 return ikuraPlacements;
}

var ikuraPlacements = createIkuraPlacements();

function onDraw(t, projMat, viewMat, state, eyeIdx) {
    lightNumber = 0;

    //makeShape takes state, transformation Matrix M and material Material
    function drawShape(Material,type,vertices){
        setMaterial(state, Material);
        gl.uniformMatrix4fv(state.uModelLoc, false, m.value() );
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.drawArrays(type, 0, vertices.length / VERTEX_SIZE);
    }

    let m = state.m;

    gl.uniformMatrix4fv(state.uViewLoc, false, new Float32Array(viewMat));
    gl.uniformMatrix4fv(state.uProjLoc, false, new Float32Array(projMat));



    var t = state.time;
    // console.log(t);
    t = t*10000;
    t = t*.0001;
    lightNumber = 0;


    /*Set lights (state, source Point, color)*/
   
    setLight(state,[-5.,-3.,-4.],[.5,0.,0.5]);

    setLight(state,[4.,0.,1.],[0.9,.3,.3]);

    gl.uniform1f(state.uFishTextureLoc,0);

    var theta = Math.PI/4; 

    let makeRectangularSushi = (fishType,fishTexture,hasSeaweed) =>{
        m.save();
           //Make Base
          m.scale(.6,.4,1.);

          drawShape(white, gl.TRIANGLES, cubeVertices);
        m.restore();          
        m.translate(0,.6,0);
        m.save();
          m.scale(.6,.2,1.);
          if (fishTexture){
             gl.uniform1f(state.uFishTextureLoc,1);
           } else {
            gl.uniform1f(state.uFishTextureLoc,0);
           }
          drawShape(fishType, gl.TRIANGLES, cubeVertices);
          gl.uniform1f(state.uFishTextureLoc,0);
        m.restore();
        m.save();
        if (hasSeaweed){
          console.log("drawing seaweed");
          m.scale(.65,.65,.4);
          m.translate(0,-.6,0);
          drawShape(seaweed, gl.TRIANGLES, cubeVertices);
        }
        m.restore();
    }

    let makeIkura = () =>{
      m.save();
       //Make Base
        m.scale(.6,.5,1.);
        m.rotateX(Math.PI/2);
        drawShape(seaweed, gl.TRIANGLE_STRIP,cylinderVertices)
      m.restore();

      m.save();
        m.scale(.3,.8,.6);
        m.translate(0,.3,0);
        m.rotateX(theta*2);
        drawShape(white, gl.TRIANGLE_STRIP,torusVertices)
      m.restore();

      m.translate(-.3,.6,-.6);
      for (var i = 0; i < ikuraPlacements.length; i++){
       
        m.save();
         //Make Roe
          m.scale(.1,.1,.1);
          var translate = ikuraPlacements[i];
          m.translate(translate[0],translate[1],translate[2]);
          drawShape(salmon, gl.TRIANGLE_STRIP,sphereVertices)
         m.restore();

      }

    }

    let makeRoll = () =>{
      m.save();
       //Make rice
        m.scale(.6,.4,.6);
        m.rotateX(Math.PI/2);
        drawShape(white, gl.TRIANGLE_STRIP,cylinderVertices)
      m.restore();  

      m.save();
       //Make seaweed
        m.scale(.62,.38,.62)
        m.translate(-.01,-.01,-.01);
        m.rotateX(Math.PI/2);
        drawShape(seaweed, gl.TRIANGLE_STRIP,cylinderVertices)
      m.restore(); 

      m.save();
       //Make inner ingredient
        m.scale(.25,.42,.25)
        m.translate(-.05,0.,-.05);
        m.rotateX(Math.PI/2);
        drawShape(salmon, gl.TRIANGLE_STRIP,cylinderVertices)
      m.restore();   

      m.save();
       //Make inner ingredient
       m.translate(.2,0.,.2);
        m.scale(.15,.421,.15)
        
        m.rotateX(Math.PI/2);
        drawShape(cucumber, gl.TRIANGLES,cubeVertices)
      m.restore();        
    }

    //Draw background
    m.save();
      m.identity();
      m.translate(0,0,-10);
      m.scale(20.,20.,20.);
      gl.uniform1f(state.uFishTextureLoc,0);
      drawShape(blue, gl.TRIANGLES, cubeVertices);
    m.restore();


    
    m.save();
      //Define angle for all the sushis
      m.identity();
      m.rotateX(theta/3*2);
      m.rotateY(theta);
      m.translate(3,-2.5,-3*t*.5);



      //Createa 80 sushis
      for(var i=0; i < 12; i++){

        
        m.save();
          m.translate(0.,0.,4*i);
          //create plates

          m.save();
            m.translate(0,-.8,0);
             m.scale(1.6,.05,1.6);
            m.rotateX(theta*2);
            drawShape(plate, gl.TRIANGLE_STRIP, cylinderVertices);
          m.restore();
          m.save();
             m.translate(0,-.7,0);
             m.scale(1.6,2.,1.6);
            m.rotateX(theta*2);
            drawShape(plate, gl.TRIANGLE_STRIP, torusSkinnyVertices);
          m.restore();

         
          m.rotateY(t);
          if (i % 6 == 0){
             makeRectangularSushi(salmon,true,false);
          }
          if (i % 6 == 1){
              makeIkura();
          }  
          if (i % 6 == 2){
              makeRoll();
          } 
          if (i % 6 == 3){
             makeRectangularSushi(egg,false,true);
          }
          if (i % 6 == 4){
              makeRectangularSushi(tuna,true,false);
          }  
          if (i % 6 == 5){
              makeRectangularSushi(eel,false,true);
          }  
        m.restore();
      }

    m.restore();
   

   
}

function onEndFrame(t, state) {
}

export default function main() {
    const def = {
        name         : 'week6',
        setup        : setup,
        onStartFrame : onStartFrame,
        onEndFrame   : onEndFrame,
        onDraw       : onDraw,
    };

    return def;
}
