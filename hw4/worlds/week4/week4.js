"use strict"

let cursor;


function normalize(vec){
    var magnitude = 0;
    for (var i=0; i< vec.length; i++){
      magnitude += vec[i]**2;
    }
    magnitude = Math.sqrt(magnitude);
    return vec.map(x => x/magnitude);
    
}

async function setup(state) {
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

                        console.log(output[i]);
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

                state.uCursorLoc       = gl.getUniformLocation(program, 'uCursor');
                state.uModelLoc        = gl.getUniformLocation(program, 'uModel');
                state.uProjLoc         = gl.getUniformLocation(program, 'uProj');
                state.uTimeLoc         = gl.getUniformLocation(program, 'uTime');
                state.uViewLoc         = gl.getUniformLocation(program, 'uView');



                var NS = 20;
                var NL = 4;

                state.uNSLoc = gl.getUniformLocation(program,NS);
                state.uNSLoc = gl.getUniformLocation(program,NL);

                //Location of light elements
                state.uLightsLoc = [];

                for (var i=0; i<NL; i++){
                    state.uLightsLoc[i] = {};
                    state.uLightsLoc[i].direction        = gl.getUniformLocation(program, 'uLights['+i+'].dir');
                    state.uLightsLoc[i].col        = gl.getUniformLocation(program, 'uLights['+i+'].col');
                }
                


                 //Location of Materials
                state.uMaterialsLoc = [];

                for (var i=0; i<NS; i++){
                    state.uMaterialsLoc[i] = {};
                    state.uMaterialsLoc[i].diffuse        = gl.getUniformLocation(program, 'uMaterials['+i+'].diffuse');
                    state.uMaterialsLoc[i].ambient        = gl.getUniformLocation(program, 'uMaterials['+i+'].ambient');
                    state.uMaterialsLoc[i].specular        = gl.getUniformLocation(program, 'uMaterials['+i+'].specular');
                    state.uMaterialsLoc[i].power        = gl.getUniformLocation(program, 'uMaterials['+i+'].power');
                    state.uMaterialsLoc[i].reflect        = gl.getUniformLocation(program, 'uMaterials['+i+'].reflect');
                    state.uMaterialsLoc[i].transparent        = gl.getUniformLocation(program, 'uMaterials['+i+'].transparent');
                    state.uMaterialsLoc[i].indexOfRefraction        = gl.getUniformLocation(program, 'uMaterials['+i+'].indexOfRefraction');
                }
                
             
                //Location of Shapes
                state.uShapes = [];

                for (var i=0; i<NS; i++){
                    state.uShapes[i] = {};
                    state.uShapes[i].center        = gl.getUniformLocation(program, 'uShapes['+i+'].center');
                    state.uShapes[i].typeOfShape        = gl.getUniformLocation(program, 'uShapes['+i+'].type');
                    state.uShapes[i].shapeSize        = gl.getUniformLocation(program, 'uShapes['+i+'].size');
                    state.uShapes[i].matrix        = gl.getUniformLocation(program, 'uShapes['+i+'].matrix');
                    state.uShapes[i].imatrix        = gl.getUniformLocation(program, 'uShapes['+i+'].imatrix');
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

    cursor = ScreenCursor.trackCursor(MR.getCanvas());

    if (!shaderSource) {
        throw new Error("Could not load shader");
    }


    // Create a square as a triangle strip consisting of two triangles
    state.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,0, 1,1,0, -1,-1,0, 1,-1,0]), gl.STATIC_DRAW);

    // Assign aPos attribute to each vertex
    let aPos = gl.getAttribLocation(state.program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
}

// I HAVE IMPLEMENTED inverse() FOR YOU. FOR HOMEWORK, YOU WILL STILL NEED TO IMPLEMENT:
// identity(), translate(x,y,z), rotateX(a), rotateY(a) rotateZ(a), scale(x,y,z), multiply(A,B)

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

// NOTE: t is the elapsed time since system start in ms, but
// each world could have different rules about time elapsed and whether the time
// is reset after returning to the world

var identity_matrix = function(){
    return [1.,0.,0.,0.,
            0.,1.,0.,0,
            0.,0.,1.,0.,
            0.,0.,0.,1.];
};

var translate_matrix = function(x,y,z){
    return [1.,0.,0.,0.,
            0.,1.,0.,0.,
            0.,0.,1.,0.,
            x,y,z,1.];
};

var rotate_X_matrix = function(theta){
    var c = Math.cos(theta);
    var s = Math.sin(theta);
    return [1.,0.,0.,0.,
            0.,c,s,0.,
            0.,-s,c,0.,
            0.,0.,0.,1.];
};

var rotate_Y_matrix  = function(theta){
    var c = Math.cos(theta);
    var s = Math.sin(theta);
    return [c,0.,-s,0.,
            0.,1.,0.,0.,
            s,0.,c,0.,
            0.,0.,0.,1.];
};


function rotate_Z_matrix(theta)  {
    var c = Math.cos(theta);
    var s = Math.sin(theta);
    return [c,s,0.,0.,
            -s,c,0.,0.,
            0.,0.,1.,0.,
            0.,0.,0.,1.];
};

var scale_matrix  = function(x,y,z){
    return [x,0.,0.,0.,
            0.,y,0.,0.,
            0.,0.,z,0.,
            0.,0.,0.,1.];
};

var perspective_matrix  = function(x,y,z){
    return [1.,0.,0.,x,
            0.,1.,0.,y,
            0.,0.,1,z,
            0.,0.,0.,w];
};

//returns dot product for vectors (lists of values) of same length
function dot(v1,v2){
    var dot = 0;
    if (v1.length == v2.length){
        for (var i=0;i<v1.length;i++){
            dot += v1[i]*v2[i];
        }
        return dot;
    } else {
        return -1;
    }
}
dot([4,5,1],[1,2,3]);

//Matrix multiplication of M * N, assumming 4x4 matrices
function multiply_matrix(M,N){
    var result = new Array(16);
    var index = 0;
    //Go through M 
    for (var i=0; i < 4; i++){
        var vec1 = M.slice(0+i*4,4+i*4);
        vec1 = [ M[i], M[i+4], M[i+8], M[i+12]];
        //Go through N
        for (var j=0; j < 4; j++){
            var vec2 = [ N[j], N[j+4], N[j+8], N[j+12]];
            vec2 = N.slice(0+j*4,4+j*4);
            result[index]= dot(vec1,vec2);
            index++;
        }
    }
    return transpose(result);

};

multiply_matrix([1,3,0,4,0,-1,0,0,0,0,0,1,0,0,0,1],[1,0,0,0,34,1,0,0,23,0,1,0,0,0,0,1])


//Matrix multiplication of M (4x4)  by Point V (4x1)
function multiply_point(M,V){
    var result = new Array(4);
    //Go through M 
    for (var i=0; i < 4; i++){
        var vec1 = M.slice(0+i*4,4+i*4);

        result[i]= dot(vec1,V);
    }
    return result;

};

multiply_point([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],[3,53,5])

//Transpose a 4x4 matrix
function transpose(M){
    var result = new Array(M.length);
    if (M.length == 16){
        result[0] = M[0];
        result[1] = M[4];
        result[2] = M[8];
        result[3] = M[12];
        result[4] = M[1];
        result[5] = M[5];
        result[6] = M[9]; 
        result[7] = M[13]; 
        result[8] = M[2]; 
        result[9] = M[6]; 
        result[10] = M[10]; 
        result[11] = M[14]; 
        result[12] = M[13]; 
        result[13] = M[7]; 
        result[14] = M[11]; 
        result[15] = M[15]; 
    }
    return result;
};

transpose([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);


var objectNumber = 0;

function Material(ambient,diffuse,specular,power,reflect,transparent,indexOfRefraction){
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.specular = specular;
    this.power = power;
    this.reflect = reflect;
    this.transparent = transparent;
    this.indexOfRefraction = indexOfRefraction;
}

var glass = new Material([.0,0.0,.05],[.01,0.01,0.01],[0.2,.3,.7], 20.,[0.9,0.9,0.9],[.9,.9,.9],1.6);
var shinyPink = new Material([.6,.2,.8],[.2,.5,.5],[0.9,0.9,0.2],20.,[0.9,0.9,0.9],[0.,0.,0.],1.2);
var shinyBlue = new Material([.1,.5,.8],[.0,.5,.8],[0.9,0.9,0.9],20.,[0.9,0.9,0.9],[0.,0.,0.],1.2);
var shinyPurple = new Material([.1,.0,.7],[.2,.1,.7],[0.0,0.9,0.0],20.,[0.9,0.9,0.9],[0.,0.,0.],1.2);
var clearBlue = new Material([.00,.01,.02],[.0,.0,.0],[0.9,0.9,0.9],20.,[0.9,0.9,0.9],[1.,1.,1.],1.6);

var shapeToInt = {
    "sphere":0,
    "cube": 1,
    "octahedron":2,
    "infiniteCylinder":3,
    "cylinder":4,
    "bowl":5
};

function setShape(state, material, shapeType, center, size,transformation){

    gl.uniform3fv(state.uMaterialsLoc[objectNumber].ambient , material.ambient);
    gl.uniform3fv(state.uMaterialsLoc[objectNumber].diffuse , material.diffuse);
    gl.uniform3fv(state.uMaterialsLoc[objectNumber].specular, material.specular);
    gl.uniform1f(state.uMaterialsLoc[objectNumber].power   , material.power);
    gl.uniform3fv(state.uMaterialsLoc[objectNumber].reflect   , material.reflect);
    gl.uniform3fv(state.uMaterialsLoc[objectNumber].transparent   ,material.transparent);
    gl.uniform1f(state.uMaterialsLoc[objectNumber].indexOfRefraction   ,material.indexOfRefraction);


    gl.uniform3fv(state.uShapes[objectNumber].center , center);
    gl.uniform1f(state.uShapes[objectNumber].shapeSize   , size);
    gl.uniform1i(state.uShapes[objectNumber].typeOfShape   , shapeToInt[shapeType]);

    if (transformation == null){
        transformation = identity_matrix();
    } else if (transformation.constructor === Array && transformation[0].constructor === Array){
        var multipliedTransforms = identity_matrix();
        for (var i = 0; i < transformation.length; i++){
            multipliedTransforms = multiply_matrix(multipliedTransforms,transformation[i]);
        }
        transformation = multipliedTransforms;
    } 
    gl.uniformMatrix4fv(state.uShapes[objectNumber].matrix , false, transformation);
    gl.uniformMatrix4fv(state.uShapes[objectNumber].imatrix, false, inverse(transformation));
    objectNumber++;
}

var lightNumber = 0;

function setLight(state,sourcePoint, color){
    gl.uniform3fv(state.uLightsLoc[lightNumber].direction,normalize(sourcePoint));
    gl.uniform3fv(state.uLightsLoc[lightNumber].col,color);
    lightNumber++;
};

function onStartFrame(t, state) {

    objectNumber = 0;
    lightNumber = 0;

    let tStart = t;
    if (!state.tStart) {
        state.tStart = t;
        state.time = t;
    }

    let cursorValue = () => {
       let p = cursor.position(), canvas = MR.getCanvas();
       return [ p[0] / canvas.clientWidth * 2 - 1, 1 - p[1] / canvas.clientHeight * 2, p[2] ];
    }

    tStart = state.tStart;

    let now = (t - tStart);
    // different from t, since t is the total elapsed time in the entire system, best to use "state.time"
    state.time = now;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let time = now / 1000;

    gl.uniform3fv(state.uCursorLoc     , cursorValue());
    gl.uniform1f (state.uTimeLoc       , time);


    //Matrix primitives




    /*Set lights (source Point, color)*/
    setLight(state,[5.,5.,4.],[1.,1.,1.]);

    setLight(state,[-1.,-.1,0.4],[0.3,.2,.9]);

    setLight(state,[-1.,-1.,-1.],[0.0,.9,.1]);
    
    /*Set Shapes: (state, material, shapeType, center, size,transformation)*/
    setShape(state, glass,"sphere",[0.,0.,-3.],.4);

     var hover1 = translate_matrix(0,Math.sin(time)*.1,0);
     var hover2 = translate_matrix(0,Math.sin(time+.5)*.1,0);
      var hover3 = translate_matrix(0,Math.sin(time+1)*.1,0);

    setShape(state, shinyBlue,"octahedron",[-1.5,.6,-3.],.2,[hover1,rotate_Y_matrix(Math.PI/2.3*time)]);

    setShape(state, shinyPink,"octahedron",[1.2,-.6,-3.],.1,[hover1,rotate_X_matrix(Math.PI/2.3*time),rotate_Z_matrix(Math.PI/2.3*time)]);

    setShape(state, shinyPurple,"octahedron",[1.3,.2,-2.],.15,[hover2,rotate_Y_matrix(Math.PI/2.3*time)]);


    setShape(state, shinyBlue,"octahedron",[-.1,1.2,-2.],.1,[hover3,rotate_Y_matrix(Math.PI/2.3*time)]);

    setShape(state, shinyBlue,"cube",[-1.2,-.8,-2.],.1,[hover1,rotate_Y_matrix(Math.PI/2.3*time)]);


    setShape(state, shinyPurple,"cube",[1.1,.8,-2.2],.15,[hover2,rotate_Y_matrix(Math.PI/2.3*time),rotate_X_matrix(Math.PI/2.3*time)]);

    setShape(state, shinyPink,"cube",[-.7,.8,-3.],.1,[hover3,rotate_Y_matrix(Math.PI/2.3*time), rotate_Z_matrix(Math.PI/2.3*time)]);

    setShape(state, shinyPurple,"cube",[-1.1,-.2,-2.],.1,[hover1,rotate_Y_matrix(Math.PI/2.3*time), rotate_Z_matrix(Math.PI/2.3*time)]);

    setShape(state, clearBlue,"octahedron",[0.,.0,-8.],.8,[hover3,rotate_Y_matrix(Math.PI/2.3*time), rotate_Z_matrix(Math.PI/2.3*time)]);


    var bowlTransform = [scale_matrix(1.,.7,1.),rotate_Y_matrix(Math.PI/2.3*time)];
    setShape(state, shinyPink,"bowl",[0.,-1.45,-3.],.4,bowlTransform);

    gl.enable(gl.DEPTH_TEST);
}

function onDraw(t, projMat, viewMat, state, eyeIdx) {
    const sec = state.time / 1000;

    const my = state;
  
    gl.uniformMatrix4fv(my.uModelLoc, false, new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-1,1]));
    gl.uniformMatrix4fv(my.uViewLoc, false, new Float32Array(viewMat));
    gl.uniformMatrix4fv(my.uProjLoc, false, new Float32Array(projMat));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function onEndFrame(t, state) {
}

export default function main() {
    const def = {
        name         : 'week4',
        setup        : setup,
        onStartFrame : onStartFrame,
        onEndFrame   : onEndFrame,
        onDraw       : onDraw,
    };

    return def;
}
