"use strict"


////////////////////////////// USEFUL VECTOR OPERATIONS

let dot = (a, b) => {
   let value = 0;
   for (let i = 0 ; i < a.length ; i++)
      value += a[i] * b[i];
   return value;
}

let subtract = (a,b) => {
   let c = [];
   for (let i = 0 ; i < a.length ; i++)
      c.push(a[i] - b[i]);
   return c;
}

let normalize = a => {
   let s = Math.sqrt(dot(a, a)), b = [];
   for (let i = 0 ; i < a.length ; i++)
      b.push(a[i] / s);
   return b;
}

let cross = (a, b) => [ a[1] * b[2] - a[2] * b[1],
                        a[2] * b[0] - a[0] * b[2],
                        a[0] * b[1] - a[1] * b[0] ];


////////////////////////////// MATRIX OPERATIONS


let cos = t => Math.cos(t);
let sin = t => Math.sin(t);
let identity = ()       => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
let rotateX = t         => [1,0,0,0, 0,cos(t),sin(t),0, 0,-sin(t),cos(t),0, 0,0,0,1];
let rotateY = t         => [cos(t),0,-sin(t),0, 0,1,0,0, sin(t),0,cos(t),0, 0,0,0,1];
let rotateZ = t         => [cos(t),sin(t),0,0, -sin(t),cos(t),0,0, 0,0,1,0, 0,0,0,1];
let scale = (x,y,z)     => [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
let translate = (x,y,z) => [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];

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

let transpose = m => [ m[0],m[4],m[ 8],m[12],
                       m[1],m[5],m[ 9],m[13],
                       m[2],m[6],m[10],m[14],
                       m[3],m[7],m[11],m[15] ];

let transform = (m, v) => [
   m[0] * v[0] + m[4] * v[1] + m[ 8] * v[2] + m[12] * v[3],
   m[1] * v[0] + m[5] * v[1] + m[ 9] * v[2] + m[13] * v[3],
   m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
   m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3]
];

//// SPECIAL MULTIPLICATION FOR HW

//Returns a 1x4 matrix
let multiply_1x4_by_4x4 = (a, b) => {
   let c = [];

   for (let n = 0; n < 4; n++){
    var column = b.slice(n*4, n*4+4);
    var entry = dot(a,column);
    c.push(entry);
   }
   return c;
}

////////////////////////////// MATRIX CLASS


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

//// Sphere 

let uvToSphere = (u,v) =>{
  var theta = 2 * Math.PI * u;
  var phi = Math.PI * v - Math.PI/2;

  var x = Math.cos(theta) * Math.cos(phi);
  var y = Math.sin(theta) * Math.cos(phi);
  var z = Math.sin(phi);
  return [x,y,z, x,y,z,u,v];
}

var sphereVertices = createMeshVertices(20,20,uvToSphere);

////////////////////////////// SUPPORT FOR SPLINES


let HermiteBasisMatrix = [
    2,-3, 0, 1,
   -2, 3, 0, 0,
    1,-2, 1, 0,
    1,-1, 0, 0
];

let BezierBasisMatrix = [
   -1,  3, -3,  1,
    3, -6,  3,  0,
   -3,  3,  0,  0,
    1,  0,  0,  0
];

let toCubicCurveCoefficients = (basisMatrix, M) => {
   let C = [];
   for (let i = 0 ; i < M.length ; i++)
      C.push(transform(basisMatrix, M[i]));
   return C;
}

let toCubicPatchCoefficients = (basisMatrix, M) => {
   let C = [];
   for (let i = 0 ; i < M.length ; i++)
      C.push(multiply(basisMatrix, multiply(M[i], transpose(basisMatrix))));
   return C;
}


////////////////////////////// SUPPORT FOR CREATING 3D SHAPES


const VERTEX_SIZE = 8;    // EACH VERTEX IS: [ x,y,z, nx,ny,nz, u,v ]


// FUNCTION createMeshVertices() REPEATEDLY CALLS uvToShape(u, v, args).
// EACH CALL ADDS ANOTHER VERTEX TO THE MESH, IN THE FORM: [x,y,z, nx,ny,nz, u,v]

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


let uvToFlatPatch = (u,v,arg)=>{
  return [u,v,0,0,0,1,u,v];
}

let flatVertices = createMeshVertices(2,2,uvToFlatPatch);


// FOR uvCubicCurvesRibbon(), arg IS IN THE BELOW FORM:
//
// {
//    width: width,
//    data: [
//       [ [a0x,b0x,c0x,d0x], [a0y,b0y,c0y,d0y] [a0z,b0z,c0z,d0z] ], // CURVE 0
//       [ [a1x,b1x,c1x,d1x], [a1y,b1y,c1y,d1y] [a1z,b1z,c1z,d1z] ], // CURVE 1
//       ...                                                         // ...
//    ]
// }


let uvToCubicCurvesRibbon = (u, v, arg) => {
    let width = arg.width;
    let data = arg.data;
    let number_of_curves = data.length;

    let curveNumber = Math.floor(number_of_curves * u);

    //Take care of edge cases where u < 0 and u == length of curve list
    if (curveNumber < 0){
      curveNumber = 0;
    }
    else if (curveNumber == number_of_curves){
      curveNumber = number_of_curves-1;
    }
    let thisCurve = data[curveNumber];

    // t is the parametric position within the curve

    let t = number_of_curves * u - curveNumber;

    let t_vector = [t**3, t**2, t, 1];

    let x_coeffs = thisCurve[0];
    let y_coeffs = thisCurve[1];
    let z_coeffs = thisCurve[2];

    let x_t = dot(x_coeffs,t_vector);
    let y_t = dot(y_coeffs,t_vector);
    let z_t = dot(z_coeffs,t_vector);

    //Now do it for next u+0.001

    let curveNumber_next = Math.floor(number_of_curves * (u+.001));

    if (curveNumber_next < 0){
      curveNumber_next = 0;
    }
    else if (curveNumber_next == number_of_curves){
      curveNumber_next = number_of_curves-1;
    }

    let thisCurve_next = data[curveNumber_next];
    let t_next = number_of_curves * (u+0.001) - curveNumber_next;

    let t_vector_next = [t_next**3, t_next**2, t_next, 1];

    let x_coeffs_next = thisCurve_next[0];
    let y_coeffs_next = thisCurve_next[1];

    let x_t_next = dot(x_coeffs_next, t_vector_next);
    let y_t_next = dot(y_coeffs_next, t_vector_next);

    //Now calculate dx,dy and how much x and y will vary
    let dx = x_t_next - x_t;
    let dy = y_t_next - y_t;

    let x_offset = (v-.5) * 2 * (-dy);
    let y_offset =  (v-.5) * 2 * (dx);

    let direction_vector = normalize([x_offset,y_offset]);

    let x = x_t + direction_vector[0]*width;
    let y = y_t + direction_vector[1]*width;

    return [x,  y, z_t,  0,0,1,  u,v];

}


// For uvToCubicPatch, arg consists of bicubic coefficents in the form:
//
// [
//    [x0,x1, ... x15],  // Bicubic coefficients in x
//    [y0,y1, ... y15],  // Bicubic coefficients in y
//    [z0,z1, ... z15]   // Bicubic coefficients in z
// ]


let uvToCubicPatch = (u, v, arg) => {
    let evaluate = (u_input,v_input) =>{
      let U  = [ u_input**3 , u_input**2 , u_input , 1 ];
      let V = [ v_input**3 , v_input**2 , v_input , 1 ];

      let x0 = multiply_1x4_by_4x4(U,arg[0])
      let y0 =  multiply_1x4_by_4x4(U,arg[1])
      let z0 = multiply_1x4_by_4x4(U,arg[2])
      
      let x = dot(x0,V);
      let y = dot(y0,V);
      let z  = dot(z0,V);

      return [x,y,z];
    }
    let point = evaluate(u,v);
    let pu_point = evaluate(u+.001,v);
    let pv_point = evaluate(u,v+.001);

    let diff_vec_pu = subtract(pu_point,point);
    let diff_vec_pv = subtract(pv_point,point);

    //Calculate surface normal
    let n = normalize(cross(diff_vec_pu, diff_vec_pv));
    return [point[0],point[1],point[2], n[0],n[1],n[2], u,v];


}


////////////////////////////// SCENE SPECIFIC CODE


async function setup(state) {
    hotReloadFile(getPath('week7.js'));

    const images = await imgutil.loadImagesPromise([
       getPath("textures/water1.png"),
       getPath("textures/sky.png"),
       getPath("textures/water2.png"),
    ]);


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
                state.uTex0Loc         = gl.getUniformLocation(program, 'uTex0');
                state.uTex1Loc         = gl.getUniformLocation(program, 'uTex1');
                state.uTex2Loc         = gl.getUniformLocation(program, 'uTex2');
                state.uTexIndexLoc     = gl.getUniformLocation(program, 'uTexIndex');
                state.uTimeLoc         = gl.getUniformLocation(program, 'uTime');
                state.uViewLoc         = gl.getUniformLocation(program, 'uView');

                gl.uniform1i(state.uTex0Loc, 0);
                gl.uniform1i(state.uTex1Loc, 1);
                gl.uniform1i(state.uTex2Loc, 2);
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

    state.turnAngle = -.4;
    state.cursor = ScreenCursor.trackCursor(MR.getCanvas());

    if (!shaderSource) {
        throw new Error("Could not load shader");
    }

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
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
}

let m = new Matrix();
let cursorPrevX, cursorPrevZ;

// NOTE: t is the elapsed time since system start in ms, but
// each world could have different rules about time elapsed and whether the time
// is reset after returning to the world
function onStartFrame(t, state) {

    let tStart = t;
    if (!state.tStart) {
        state.tStart = t;
        state.time = t;
    }

    let cursor = state.cursor;

    let cursorValue = () => {
       let p = cursor.position(), canvas = MR.getCanvas();
       return [ p[0] / canvas.clientWidth * 2 - 1, 1 - p[1] / canvas.clientHeight * 2, p[2] ];
    }

    tStart = state.tStart;

    state.time = (t - tStart) / 1000;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // VARY TURN ANGLE AS USER DRAGS CURSOR LEFT OR RIGHT.

    let cursorXYZ = cursorValue();
    if (cursorXYZ[2] && cursorPrevZ)
        state.turnAngle += 2 * (cursorXYZ[0] - cursorPrevX);
    cursorPrevX = cursorXYZ[0];
    cursorPrevZ = cursorXYZ[2];

    gl.uniform3fv(state.uCursorLoc     , cursorXYZ);
    gl.uniform1f (state.uTimeLoc       , state.time);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);  // CULL FACES THAT ARE VISIBLY CLOCKWISE.
}

function onDraw(t, projMat, viewMat, state, eyeIdx) {

    gl.uniformMatrix4fv(state.uViewLoc, false, new Float32Array(viewMat));
    gl.uniformMatrix4fv(state.uProjLoc, false, new Float32Array(projMat));

    let drawShape = (color, type, vertices, texture) => {
       gl.uniform3fv(state.uColorLoc, color );
       gl.uniformMatrix4fv(state.uModelLoc, false, m.value() );
       gl.uniform1i(state.uTexIndexLoc, texture === undefined ? -1 : texture);
       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW);
       gl.drawArrays(type, 0, vertices.length / VERTEX_SIZE);
    }

    m.identity();
    m.save();
    m.translate(0,0,-4);
    m.rotateY(state.turnAngle);
    m.translate(0,0,4);

    let by = .3;

    let S = .3 * Math.sin(state.time);



        let st = 1 // 3 * state.time;
    let s0 = .7 * Math.sin(st * state.time);
    let s1 = .7 * Math.sin(st + 1 * state.time);
    let s2 = .7 * Math.sin(st + 2 * state.time);
    let s3 = .7 * Math.sin(st + 3 * state.time);


    let hermiteCurveVertices = createMeshVertices(48, 2, uvToCubicCurvesRibbon,
       {
          width: .01,
	  data: [
	     toCubicCurveCoefficients(HermiteBasisMatrix, [
                [ 0, 0,-3, 3], // P0.x P1.x R0.x R1.x
                [-1, 0, 0, 0], // P0.y P1.y R0.y R1.y
                [ 0,.4, 0, 0]  // P0.z P1.z R0.z R1.z
             ]),
	     toCubicCurveCoefficients(HermiteBasisMatrix, [
                [ 0, .5,  3,  3], // P0.x P1.x R0.x R1.x
                [ 0,  1,  0,  0], // P0.y P1.y R0.y R1.y
                [.5,  0,  0,  0]  // P0.z P1.z R0.z R1.z
             ])
          ]
       }
    );

    let bezierCurveVertices = createMeshVertices(32, 2, uvToCubicCurvesRibbon,
       {
          width: 0.06,
	  data: [
             toCubicCurveCoefficients(BezierBasisMatrix, [
                [ -1, -.6, -.3,  0], // A.x B.x C.x D.x
                [  0,  by, -by,  0], // A.y B.y C.y D.y
                [-.3,  .3,   0,-.1]  // A.z B.z C.z D.z
             ]),
             toCubicCurveCoefficients(BezierBasisMatrix, [
                [  0, .3, .6,  1],    // A.x B.x C.x D.x
                [  0, by,  0,  1],    // A.y B.y C.y D.y
                [-.1,-.1,-.3,-.6]     // A.z B.z C.z D.z
             ])
          ]
       }
    );


    let bezierPatchVertices = createMeshVertices(32, 32, uvToCubicPatch,
       toCubicPatchCoefficients(BezierBasisMatrix, [
          [
	         -1,-1/3, 1/3, 1,
            -1,-1/3, 1/3, 1,
            -1,-1/3, 1/3, 1,
            -1,-1/3, 1/3, 1
	  ],
          [
	    -1  ,-1  ,-1  ,-1,
            -1/3,-1/3,-1/3,-1/3,
             1/3, 1/3, 1/3, 1/3,
             1  , 1  , 1  , 1
	  ]
    ,
          [
	           0,   s3,   s0,  0,
            s0,   s1,   s2, s3,
            s0,   s1,   s2, s3,
             0,   s0,   s3,  0
	  ]
       ])
    );


    let flatPatch = createMeshVertices(32, 32, uvToCubicPatch,
       toCubicPatchCoefficients(BezierBasisMatrix, [
          identity(),
          identity()
    ,
         identity()
       ])
    );

   
    var rainbow_colors = [
      [1,.2,.5],
      [1,.5,.2],
      [1,1,0],
      [.2,1,0],
      [0,1,1],
      [.5,0,1]
    ];
    for (var i = 0; i < 6; i++){
      m.save();
      m.translate(.4+i*.03*s2,.6+i*.03*s3,-9+i*.2);
      m.scale(3,4,3)
      m.rotateZ(Math.PI)
      console.log(rainbow_colors[i]);
      drawShape(rainbow_colors[i], gl.TRIANGLE_STRIP, hermiteCurveVertices);
      m.restore();
    }
   

  
    m.save();
    m.translate(0,1.7+.2*s1,-8);
    m.scale(.6,.6,.6);
    drawShape([1.,1.,1.], gl.TRIANGLE_STRIP, sphereVertices);
    m.restore();


    m.save();
    m.translate(0,-1.2,-4);
    m.scale(2.6,1.8,2.);
    m.rotateX(-Math.PI/3)
    drawShape([1,1,1], gl.TRIANGLE_STRIP, bezierPatchVertices, 2);
    m.restore();


    m.restore();
    
    m.save();
    m.translate(-7,-6,-13);
    m.scale(13.,13.,10.);
    drawShape([1,1,1], gl.TRIANGLE_STRIP, flatVertices, 1);
    m.restore();





}

function onEndFrame(t, state) {
}

export default function main() {
    const def = {
        name         : 'week7',
        setup        : setup,
        onStartFrame : onStartFrame,
        onEndFrame   : onEndFrame,
        onDraw       : onDraw,
    };

    return def;
}
