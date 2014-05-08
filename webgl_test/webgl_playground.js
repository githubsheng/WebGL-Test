var canvas = document.querySelector("#canvas");

canvas.width = 500;
canvas.height = 500;

//create context and program
var gl = canvas.getContext("webgl");
gl.viewportWidth = canvas.width;
gl.viewportHeight = canvas.height;
gl.clearColor(0,0,0,1.0);
gl.enable(gl.DEPTH_TEST);

var program = gl.createProgram();

//create shaders and compile them
var vShader = gl.createShader(gl.VERTEX_SHADER);
var vShaderSource = document.querySelector("#shader-vertex").innerHTML.trim();
gl.shaderSource(vShader, vShaderSource);
gl.compileShader(vShader);

var fShader = gl.createShader(gl.FRAGMENT_SHADER);
var fShaderSource = document.querySelector("#shader-fragment").innerHTML.trim();
gl.shaderSource(fShader, fShaderSource);
gl.compileShader(fShader);

//connect the shaders to the progam.
gl.attachShader(program, vShader);
gl.attachShader(program, fShader);

gl.linkProgram(program);
gl.useProgram(program);

//feed the information of vertices.
var vertices = new Float32Array([
    1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,
    1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,
    1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0 ]);

var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0 ]);

var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,
    4, 5, 6,   4, 6, 7,
    8, 9,10,   8,10,11,
    12,13,14,  12,14,15,
    16,17,18,  16,18,19,
    20,21,22,  20,22,23 ]);

//create buffers and feed them to the shaders, and always feed the vertices positions and vertices normals
var aPositionIdx = gl.getAttribLocation(program, "MCVertex");
var vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.vertexAttribPointer(aPositionIdx, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPositionIdx);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

var aNormalIdx = gl.getAttribLocation(program, "MCNormal");
var normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
gl.vertexAttribPointer(aNormalIdx, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aNormalIdx);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

var elementBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

play();



/**
 * just before we draw elements... magic happens here.
 */
function play(){
    //get the attribute/uniform indices in the shaders.
    var uMVPMatrixIdx = gl.getUniformLocation(program, "MVPMatrix");
    var uNormalMatrixIdx = gl.getUniformLocation(program, "NormalMatrix");
    var uMVMatrixIdx = gl.getUniformLocation(program, "MVMatrix");

    //feed all kinds of matrices
    var modelMatrix = mat4.create();
    var viewMatrix = mat4.create();
    var projectionMatrix = mat4.create();

    var VPMatrix = mat4.create(); //intermediate result used to calculate MVP
    var MVPMatrix = mat4.create();
    var MVMatrix = mat4.create();
    var normalMatrix = mat3.create();

    //projection matrix, view matrix, and VP matrix.
    mat4.perspective(projectionMatrix, Math.PI * 0.1, gl.viewportWidth / gl.viewportHeight, 1, 2000.0);
    mat4.lookAt(viewMatrix, vec3.fromValues(10, 10, 40), vec3.fromValues(0,0,0), vec3.fromValues(0,1,0));
    mat4.multiply(VPMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(MVPMatrix, VPMatrix, modelMatrix);
    gl.uniformMatrix4fv(uMVPMatrixIdx, false, MVPMatrix);

    //hemisphere light
    var skyColorIdx = gl.getUniformLocation(program, "SkyColor");
    var groundColorIdx = gl.getUniformLocation(program, "GroundColor");
    gl.uniform3fv(skyColorIdx, vec3.fromValues(1, 1, 1));
    gl.uniform3fv(groundColorIdx, vec3.fromValues(0.1, 0.1, 0.1));

    var ecLightPositionIdx = gl.getUniformLocation(program, "ecLightPosition");
    var wcLightPosition = vec3.fromValues(0, 10, 0);
    var ecLightPosition = vec3.create();
    vec3.transformMat4(ecLightPosition, wcLightPosition, viewMatrix);
    gl.uniform3fv(ecLightPositionIdx, ecLightPosition);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //draw those 9 cuboids
    drawSingleCuboid(0, 0); //正中心的
    drawSingleCuboid(4, 0);
    drawSingleCuboid(-4, 0);

    drawSingleCuboid(0, 4);
    drawSingleCuboid(4, 4);
    drawSingleCuboid(-4, 4);

    drawSingleCuboid(0, -4);
    drawSingleCuboid(4, -4);
    drawSingleCuboid(-4, -4);


    function drawSingleCuboid(x, z){
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(x, 0, z));
        //model matrix and MVP matrix...
        mat4.multiply(MVPMatrix, VPMatrix, modelMatrix);
        gl.uniformMatrix4fv(uMVPMatrixIdx, false, MVPMatrix);

        //normal matrix and MV matrix.
        mat4.multiply(MVMatrix, viewMatrix, modelMatrix);
        mat3.normalFromMat4(normalMatrix, MVMatrix);
        gl.uniformMatrix4fv(uMVMatrixIdx, false, MVMatrix);
        gl.uniformMatrix3fv(uNormalMatrixIdx, false, normalMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
    }
}



//function addDiffuseLight(){
//    //add diffuse lighting.
//    var uLightDirIdx = gl.getUniformLocation(program, "uLightDir");
//    var diffuseLightDirection = vec3.fromValues(10.0, 10.0, 40.0);
//    vec3.normalize(diffuseLightDirection, diffuseLightDirection);
//    gl.uniform3fv(uLightDirIdx, diffuseLightDirection);
//}