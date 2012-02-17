//(function(){
var gl;
window.requestAnimFrame = window.requestAnimFrame || (function() {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(FrameRequestCallback, Element) {
        window.setTimeout(FrameRequestCallback, 1000 / 60);
    };
})();


function check(n) {
    var x;
    while (x = gl.getError()) {
        var str = "";
        for (i in gl) {
            if (gl[i] == x) {
                str = i;
                break;
            }
        }
        console.error(n + ": " + x + ": " + str);
    }
}
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    shaderProgram.tUniform = gl.getUniformLocation(shaderProgram, "t");
	shaderProgram.aspectUniform = gl.getUniformLocation(shaderProgram, "aspect");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

}
var ABuffer;
var vertices;
var N = 4096;
function initBuffers() {
	ABuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ABuffer);
    vertices = [
    ];
	var i;
	for(i = 0; i < N; i++) {
		var x = 2.0*(Math.random() - 0.5);
		var y = 2.0*(Math.random() - 0.5);
		var vx = 0.001 * (Math.random() - 0.5);
		var vy = 0.001 * (Math.random() - 0.5);
		
		var z = Math.random() * Math.PI;
		vertices.push(x,y, z);
		vertices.push(x+vx,y+vy, z);
		
	}
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    ABuffer.itemSize = 3;
    ABuffer.numItems = vertices.length / 3;
}
function sqrt_a(x) {
return (((x+1)*0.5)+(x/((x+1)*0.5)))*0.5;
}
function sqrt_b(x) {
return (((((x+1)*0.5)+(x/((x+1)*0.5)))*0.5)+(x/((((x+1)*0.5)+(x/((x+1)*0.5)))*0.5)))*0.5;
}
var mx = 0;
var my = 0;
var mz = 0;
function next(){
	var i;
	var X = 0;
	var Y = 1;
	var Z = 2;
	
	for(i = 0; i < N; i++) {
		var last = i*3*2;
		var now = last + 3;
		var dx = vertices[now+X] - vertices[last+X];
		var dy = vertices[now+Y] - vertices[last+Y];
		//var dz = vertices[now+Z] - vertices[last+Z];
		vertices[last+X] = vertices[now+X];
		vertices[last+Y] = vertices[now+Y];
		//vertices[last+Z] = vertices[now+Z];
		
		var centering = 0.1/ N;
		
		
		var _dx = mx - vertices[now+X];
		var _dy = my - vertices[now+Y];
		//var _dz = mz - vertices[now+Z];
		
		var dist2 = _dx*_dx + _dy*_dy;
		var f_o = sqrt_a(dist2+0.01);
		var magF_dist = centering / (f_o * f_o * f_o);
		
		var ddx = magF_dist * _dx;
		var ddy = magF_dist * _dy;
		var b;
		for(b = N + 1; b < N; b++) {
			var now_b = b*3*2 + 3;
			var _dx = vertices[now_b+X] - vertices[now+X];
			var _dy = vertices[now_b+Y] - vertices[now+Y];
			var dist2 = _dx*_dx + _dy*_dy;
			//var magF_dist = (0.000001/(dist^3));
			//var magF_dist = (0.000001/(dist2^(3/2)));
			//var magF_dist = (0.000001 * Math.pow(dist2+0.01, -3/2));
			var f_o = sqrt_a(dist2+0.01);
			var magF_dist = 0.000001 / (f_o * f_o * f_o);
			var iddx = magF_dist * _dx;
			var iddy = magF_dist * _dy;
			ddx += iddx;
			ddy += iddy;
		}
		
		var damping = 0.99999;
		vertices[now+X] += damping * dx + 0.5 * ddx;
		vertices[now+Y] += damping * dy + 0.5 * ddy;
		
		var D;
		for(D = Y+1; D <= Y; D++) {
			if(vertices[now+D] > 1.0) {
				vertices[now+D] -= 2.0;
				vertices[last+D] -= 2.0;
			} else if(vertices[now+D] < -1.0) {
				vertices[now+D] += 2.0;
				vertices[last+D] += 2.0;
			}
		}
		
		
		
	}
	
    gl.bindBuffer(gl.ARRAY_BUFFER, ABuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

var t = 0.0;
var aspect;
function drawScene() {
    check("draw");
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, ABuffer);
	var stride, offset;
	t += 0.01;
	gl.uniform1f(shaderProgram.tUniform, t);
	gl.uniform1f(shaderProgram.aspectUniform, aspect);
	var i;
	for (i = 0; i < 64; i++) {
		next();
	    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, ABuffer.itemSize, gl.FLOAT, false, stride=0, offset=0);
	    gl.drawArrays(gl.LINES, 0, N);
	}
}
var resize;
window.addEventListener("resize", resize = function(e){
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
	aspect = gl.viewportWidth / gl.viewportHeight;
});
function webGLStart() {
    var canvas = document.getElementById("canvas");
    var params = {
        antialias: false
    };
    try {
        //TODO: check this
        params = {
            antialias: true
        };
        gl = canvas.getContext("webgl", params);
        if (gl === null) {
            gl = canvas.getContext('experimental-webgl', params);
        }
        if (gl === null) {
            return false;
        }
    } catch(e) {
        alert(e);
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);

	gl.lineWidth(1.0);
	
    gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.depthMask(false);
	
	resize();
    drawScene();
}
document.body.style.padding = 0;
document.body.style.margin = 0;
canvas.style.position = "fixed";
canvas.style.top = 0;
canvas.style.left = 0;

webGLStart();
canvas.addEventListener("mousemove", function(e){
	mx = (2.0 * e.offsetX/gl.viewportWidth - 1.0) * aspect;
	my = - 2.0 * e.offsetY/gl.viewportHeight + 1.0;
});
var stop = false;
function tick() {
	if(stop){
		return;
	}
    requestAnimFrame(tick);
    drawScene();
}
tick();

//})();
