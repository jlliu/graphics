"use strict"

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

                // Assign MVP matrices
                state.uModelLoc        = gl.getUniformLocation(program, 'uModel');
                state.uViewLoc         = gl.getUniformLocation(program, 'uView');
                state.uProjLoc         = gl.getUniformLocation(program, 'uProj');
                state.uTimeLoc         = gl.getUniformLocation(program, 'uTime');

                var NS = 5;
                var NL = 2;

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
                
             
                //Location of Spheres
                state.uShapes = [];

                for (var i=0; i<NS; i++){
                    state.uShapes[i] = {};
                    state.uShapes[i].center        = gl.getUniformLocation(program, 'uShapes['+i+'].center');
                     state.uShapes[i].typeOfShape        = gl.getUniformLocation(program, 'uShapes['+i+'].type');
                    state.uShapes[i].shapeSize        = gl.getUniformLocation(program, 'uShapes['+i+'].size');
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


function normalize(vec){
    var magnitude = 0;
    for (var i=0; i< vec.length; i++){
      magnitude += vec[i]**2;
    }
    magnitude = Math.sqrt(magnitude);
    return vec.map(x => x/magnitude);
    
}

// NOTE: t is the elapsed time since system start in ms, but
// each world could have different rules about time elapsed and whether the time
// is reset after returning to the world



function onStartFrame(t, state) {
    // (KTR) TODO implement option so a person could pause and resume elapsed time
    // if someone visits, leaves, and later returns
    let tStart = t;
    if (!state.tStart) {
        state.tStart = t;
        state.time = t;
    }

    tStart = state.tStart;

    let now = (t - tStart);
    // different from t, since t is the total elapsed time in the entire system, best to use "state.time"
    state.time = now;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let time = now / 1000;

    gl.uniform1f(state.uTimeLoc, time);

    //custom inputs

    //Set lights
    var lightDir1 = [-3.,2.,4.];



    gl.uniform3fv(state.uLightsLoc[0].direction,normalize(lightDir1));
    gl.uniform3fv(state.uLightsLoc[0].col,[1.,1.,1.]);

    var lightDir2 = [-1.,-.1,0.4];
    gl.uniform3fv(state.uLightsLoc[1].direction,normalize(lightDir2));
    gl.uniform3fv(state.uLightsLoc[1].col,[0.3,.2,.9]);

    //Set Material 1
    gl.uniform3fv(state.uMaterialsLoc[0].ambient , [.01,0.01,.2]);
    gl.uniform3fv(state.uMaterialsLoc[0].diffuse , [.01,0.01,0.01]);
    gl.uniform3fv(state.uMaterialsLoc[0].specular, [0.6,.1,.3]);
    gl.uniform1f(state.uMaterialsLoc[0].power   , 20.);
    gl.uniform3fv(state.uMaterialsLoc[0].reflect   ,[0.4,0.4,0.4]);
    gl.uniform3fv(state.uMaterialsLoc[0].transparent   ,[.9,.9,.9]);
    gl.uniform1f(state.uMaterialsLoc[0].indexOfRefraction   ,1.6);



    //Set sphere
    gl.uniform3fv(state.uShapes[0].center , [-.7,0.8,-1]);
    gl.uniform1f(state.uShapes[0].shapeSize   , .7);
    gl.uniform1i(state.uShapes[0].typeOfShape   , 0);



    //Set material 2
    gl.uniform3fv(state.uMaterialsLoc[1].ambient , [.6,.2,.8]);
    gl.uniform3fv(state.uMaterialsLoc[1].diffuse , [.2,.5,.5]);
    gl.uniform3fv(state.uMaterialsLoc[1].specular, [0.9,0.9,0.2]);
    gl.uniform1f(state.uMaterialsLoc[1].power   , 20.);
    gl.uniform3fv(state.uMaterialsLoc[1].reflect  ,[0.,0.,0.]);
    gl.uniform3fv(state.uMaterialsLoc[1].transparent,[0.,0.,0.]);
    gl.uniform1f(state.uMaterialsLoc[1].indexOfRefraction   ,1.2);

    //Set octohedron
     gl.uniform3fv(state.uShapes[1].center , [1.2,.2,-1.]);
    gl.uniform1f(state.uShapes[1].shapeSize   , .7);
    gl.uniform1i(state.uShapes[1].typeOfShape   , 2);



    //Set material 3
    gl.uniform3fv(state.uMaterialsLoc[2].ambient , [.0,.1,.4]);
    gl.uniform3fv(state.uMaterialsLoc[2].diffuse , [.2,.2,.2]);
    gl.uniform3fv(state.uMaterialsLoc[2].specular, [0.9,0.9,0.4]);
    gl.uniform1f(state.uMaterialsLoc[2].power   , 10.);
    gl.uniform3fv(state.uMaterialsLoc[2].reflect  ,[0.9,0.9,.9]);
    gl.uniform3fv(state.uMaterialsLoc[2].transparent,[0.6,0.6,0.9]);
     gl.uniform1f(state.uMaterialsLoc[2].indexOfRefraction   ,1.5);


    //Set cube
    gl.uniform3fv(state.uShapes[2].center , [-.7,-.6,-.8]);
    gl.uniform1f(state.uShapes[2].shapeSize   , .8);
    gl.uniform1i(state.uShapes[2].typeOfShape   , 1);

    //Set material 4
    gl.uniform3fv(state.uMaterialsLoc[3].ambient , [.1,.7,.7]);
    gl.uniform3fv(state.uMaterialsLoc[3].diffuse , [.2,.2,.2]);
    gl.uniform3fv(state.uMaterialsLoc[3].specular, [0.6,0.4,0.4]);
    gl.uniform1f(state.uMaterialsLoc[3].power   , 20.);
    gl.uniform3fv(state.uMaterialsLoc[3].reflect  ,[0.,0.,0.]);
    gl.uniform3fv(state.uMaterialsLoc[3].transparent,[0.,0.,0.]);
    gl.uniform1f(state.uMaterialsLoc[3].indexOfRefraction   ,1.2);


    //Set Sphere
    gl.uniform3fv(state.uShapes[3].center , [-.5,-.5,0.2]);
    gl.uniform1f(state.uShapes[3].shapeSize   , .15);
    gl.uniform1i(state.uShapes[3].typeOfShape   , 0);


    //Set material 5
    gl.uniform3fv(state.uMaterialsLoc[4].ambient , [.1,.0,.2]);
    gl.uniform3fv(state.uMaterialsLoc[4].diffuse , [.02,.02,.02]);
    gl.uniform3fv(state.uMaterialsLoc[4].specular, [0.4,0.4,0.4]);
    gl.uniform1f(state.uMaterialsLoc[4].power   , 20.);
    gl.uniform3fv(state.uMaterialsLoc[4].reflect  ,[.8,0.8,.8]);
    gl.uniform3fv(state.uMaterialsLoc[4].transparent,[0.,0.,0.]);
     gl.uniform1f(state.uMaterialsLoc[4].indexOfRefraction   ,1.7);


    //Set Background mirror
    gl.uniform3fv(state.uShapes[4].center , [0,0.,-7.]);
    gl.uniform1f(state.uShapes[4].shapeSize   , 7);
    gl.uniform1i(state.uShapes[4].typeOfShape   , 1);



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
        name         : 'week3',
        setup        : setup,
        onStartFrame : onStartFrame,
        onEndFrame   : onEndFrame,
        onDraw       : onDraw,
    };

    return def;
}
