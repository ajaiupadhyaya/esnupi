// For the #WCCChallenge, theme: "collage".
// Original manuscript of the second viola part for J. S. Bach’s cantata 
// “Ich liebe den Höchsten von ganzem Gemüte,” BWV 174, from the year 1729.
// Downloaded from the Library of Congress web site:
// https://blogs.loc.gov/music/2014/02/the-brandenburg-concerto-manuscript-at-the-library-of-congress/

let img;
let pieces = [];
let ydiv = 13;
let xdiv = 12;
let rot, trot;
let stretch = 0;
let tstretch = 0;
let prot = 0;
let mode = 0;
let rseed;
let collage;

async function setup() {
	img = await loadImage("0001.jpg");
	renderer = createCanvas(windowWidth-1, windowHeight-1, WEBGL);
	collage = createGraphics(width * 1.2, height * 1.2);
	renderer.drawingContext.disable(renderer.drawingContext.DEPTH_TEST);
	processImage();
	rseed = random(1000);
	rot = createVector(0, 0, 0);
	trot = createVector(0, 0, 0);
	prot = createVector(0, 0, 0);
	imageMode(CENTER);
	instruct = createP('Press S key to save collage!');
	instruct.position(10, -height / 18);
	instruct.style('font-size', height / 15 + 'px');
	instruct.style('font-family', 'monospace');
	instruct.style('visibility', 'hidden');
	instruct.style('background','#FFFFF0AE');
	instruct.style('border-radius', height/60+'px')
	instruct.style('color', '#43433DDA');
}

function draw() {
	randomSeed(rseed);
	background(255);
	scale(map(rot.y, PI, -PI, 0.1, 1));
	background('cornsilk');
	rotateX(rot.y);
	rotateY(rot.x);
	for (let p of pieces) {
		let z = random(-img.width / 2, img.width / 2)
		push();
		translate(p.px, p.py / (1 + random(3) * stretch), (z * stretch));
		texture(p.pic);
		noStroke();
		rotateY(-prot.x);
		rotateX(-prot.y);
		rotateZ(random(-PI / 12, PI / 12) * stretch);
		plane(p.pic.width, p.pic.height);
		pop();
	}
	if (mode != 3) rot.lerp(trot, 0.1);
	if (mode > 0 && mode < 3 || mode > 3) prot.lerp(trot, 0.1);
	else if (mode == 0) prot.mult(0.9);
	stretch = lerp(stretch, tstretch, 0.1);
	trot.x = map(mouseX, 0, width, -PI, PI);
	trot.y = map(mouseY, 0, height, PI, -PI);
}

function mouseClicked() {
	mode = (mode + 1) % 6;
	if (mode > 1 && mode < 5) tstretch = 1;
	else tstretch = 0;
	if (mode == 0) rseed = random(1000);
	if (mode == 3) instruct.style('visibility', 'visible');
	else instruct.style('visibility', 'hidden');
}

function processImage() {
	img = img.get(0, img.height / 12, 119 * img.width / 120, 10 * img.height / 12);
	img.resize(0, img.height / 2);
	img.loadPixels();
	for (let i = 0; i < img.pixels.length; i += 4) {
		if (img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2] < 200) {
			img.pixels[i] *= 0;
			img.pixels[i + 1] *= 0;
			img.pixels[i + 2] *= 0;
		} else {
			img.pixels[i + 3] = 60;
		}
	}
	img.updatePixels();
	for (let x = 0; x < img.width; x += img.width / xdiv) {
		for (let y = 0; y < img.height; y += img.height / ydiv) {
			let piece = img.get(x, y, img.width / xdiv, img.height / ydiv);
			pieces.push({
				pic: piece,
				px: map(x, 0, img.width, -img.width / 2, img.width / 2),
				py: map(y, 0, img.height, -img.height / 2, img.height / 2)
			});
		}
	}
}

function keyPressed() {
	if (mode != 3) return; // Only allow saving in mode 3
	if (key == "s" || key == "S") {
		collage.imageMode(CENTER);
		collage.rectMode(CENTER);
		collage.background(255);
		collage.fill(0, 180);
		collage.rect(collage.width / 2 + 10, collage.height / 2 + 10, width, height);
		collage.filter(BLUR, 4);
		collage.image(renderer, collage.width / 2, collage.height / 2);
		let now = new Date();
		let timestamp = now.getFullYear() + '-' +
			nf(now.getMonth() + 1, 2) + '-' +
			nf(now.getDate(), 2) + '-' +
			nf(now.getHours(), 2) + '-' +
			nf(now.getMinutes(), 2) + '-' +
			nf(now.getSeconds(), 2);
		let filename = 'collage-' + timestamp;
		save(collage, filename + '.png');
	}
}