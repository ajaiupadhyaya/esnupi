// Earth bands 
// For the #WCCChallenge «Earth» (join the discord! https://discord.gg/S8c7qcjw2b)
//
// This sketch uses a shader to create the soil-like pattern, then uses FIP filters (https://github.com/prontopablo/p5.FIP) to
// add distortion and some color adjustments, then uses clip functions to draw each layer.
// It was tricky to make it work properly with frameBuffers, I had to use shader's `copyToContext` function and use two
// off-screen buffers to do the rendering

let deform
let buffer
let cw, ch
let margin = 1.2
let soilFBW, soilFBH
let paletteMode = 'random' // 'cycle' | 'random'
let paletteIdx = 0

let soilShader, bufferDeformFilter, bufferRotateFilter, bufferContrastFilter, bloomFilter

// Generator-driven build
let comp // 2D accumulation canvas
let buildGen
let plannedLayers

let palettes = [
	["#c9cba3", "#ffe1a8", "#e26d5c", "#723d46", "#472d30"],
	["#606c38","#283618","#fefae0","#dda15e","#bc6c25"],
	["#160f29", "#246a73", "#368f8b", "#f3dfc1", "#ddbea8"],
	["#797d62", "#9b9b7a", "#d9ae94", "#f1dca7", "#ffcb69", "#d08c60", "#997b66"],
	["#d0f1bf", "#b6d7b9", "#9abd97", "#646536", "#483d03"],
	["#004b23","#006400","#007200","#008000","#38b000","#70e000","#9ef01a","#ccff33"],
	["#5fad56","#f2c14e","#f78154","#4d9078","#b4436c"],
	["#483c46","#3c6e71","#70ae6e","#beee62","#f4743b"],
	["#2c6e49","#4c956c","#fefee3","#ffc9b9","#d68c45"],
	["#132a13","#31572c","#4f772d","#90a955","#ecf39e"],
	["#033f63","#28666e","#7c9885","#b5b682","#fedc97"],
	["#f7e7ce","#ffeeb0","#c3af92","#173a2e","#95b09f"]
]
let palette
let skyColors = ["#03045e","#023e8a","#0077b6","#0096c7","#00b4d8","#48cae4","#90e0ef","#ade8f4","#caf0f8"]
let skyColor

function setup() {
	cw = windowWidth
	ch = windowHeight
	createCanvas(cw, ch, WEBGL)
	palette = random(palettes)
	skyColor = random(skyColors)

	// Make buffer square using the larger dimension to avoid aspect ratio issues
	let bufferSize = max(cw, ch) * margin
	buffer = createGraphics(bufferSize, bufferSize, WEBGL)
	imageMode(CENTER)
	buffer.imageMode(CENTER)

	// 2D composition buffer for final image
	comp = createGraphics(cw, ch)
	
	pixelDensity(1)
	buffer.pixelDensity(1)
	comp.pixelDensity(1)

	noStroke()
	frameRate(5)

	// Create shader in main, copy to buffer context
	let _soilShader = new p5.Shader(this._renderer, vertSrc, fragSrc)
	soilShader = _soilShader.copyToContext(buffer)

	// Framebuffer created in buffer's context (square)
	soilBuffer = buffer.createFramebuffer({ width: bufferSize, height: bufferSize })
	soilFBW = bufferSize
	soilFBH = bufferSize

	// Create filter shaders in main context first and copy to buffer
	let _deformFilter = createFilterShader(fip.deform)
	bufferDeformFilter = _deformFilter.copyToContext(buffer)
	let _contrastFilter = createFilterShader(fip.contrast)
	bufferContrastFilter = _contrastFilter.copyToContext(buffer)
	let _rotateFilter = createFilterShader(fip.rotate)
	bufferRotateFilter = _rotateFilter.copyToContext(buffer)
	let _bloomFilter = createFilterShader(fip.bloom)
	bloomFilter = _bloomFilter.copyToContext(buffer)

	// Start generator-driven build
	plannedLayers = planWaveLayers()
	buildGen = buildSequence()
}

function draw() {
	const step = buildGen ? buildGen.next() : { done: true }
	background(skyColor)

	if (step.done) {
		for (let i = 0; i < 300; i++) {
			let x = random(-cw/2, cw/2)
			let y = random(-ch/2, -ch/4)
			let h = random(15, 50)
			let w = h * random(3, 5)
			let c = random(skyColors) + '20'
			fill(c)
			rect(x, y, w, h)
		}
	}

	// Show accumulated composition as we build (if it still exists)
	if (comp) {
		resetMatrix()
		imageMode(CORNER)
		image(comp, -width / 2, -height / 2, width, height)
	}

	if (step.done) {
		// Cleanup: destroy buffers after final layer to allow proper snapshot capture
		if (soilBuffer) {
			soilBuffer.remove()
			soilBuffer = null
		}
		if (buffer) {
			buffer.remove()
			buffer = null
		}
		if (comp) {
			comp.remove()
			comp = null
		}
		noLoop()
	}
}

function renderSoil(params) {
	const seed = random(1000)

	soilBuffer.begin()
	buffer.clear()
	buffer.shader(soilShader)

	// Resolution relative to framebuffer size
	soilShader.setUniform("u_resolution", [soilFBW * pixelDensity(), soilFBH * pixelDensity()])
	soilShader.setUniform("u_seed", seed)
	soilShader.setUniform("u_scale", params.scale)
	soilShader.setUniform("u_period", [1000.0, 1000.0])
	soilShader.setUniform("u_warpAmp", params.warpAmp)
	soilShader.setUniform("u_warpFreq", params.warpFreq)
	soilShader.setUniform("u_octaves", 5)
	soilShader.setUniform("u_moisture", params.moisture)
	soilShader.setUniform("u_pebbleFreq", params.pebbleFreq)
	soilShader.setUniform("u_crackStrength", params.crackStrength)
	soilShader.setUniform("u_grainFreq", params.grainFreq)
	soilShader.setUniform("u_grainAmount", params.grainAmount)
	soilShader.setUniform("u_heightStrength", 1.0)
	soilShader.setUniform("u_lightDir", [0.8, 0.6, 0.3])
	soilShader.setUniform("u_useLighting", 1.0)

	soilShader.setUniform("u_mainTint", params.mainTint)
	soilShader.setUniform("u_mainTintAmount", params.mainTintAmount)
	soilShader.setUniform("u_detailTint", params.detailTint)
	soilShader.setUniform("u_detailTintAmount", params.detailTintAmount)
	soilShader.setUniform("u_rockTint", params.rockTint)
	soilShader.setUniform("u_rockTintAmount", params.rockTintAmount)

	buffer.beginShape()
	buffer.vertex(-1, -1, 0, 0, 0)
	buffer.vertex(1, -1, 0, 1, 0)
	buffer.vertex(1, 1, 0, 1, 1)
	buffer.vertex(-1, 1, 0, 0, 1)
	buffer.endShape(CLOSE)
	soilBuffer.end()
}

// Bake soil + filter in buffer context; no get()/pixels
function bakeSoilToBuffer(params, deformAmtA, deformAmtB) {
	// 1) Render procedural soil to soilBuffer (buffer context)
	renderSoil(params)

	// 2) Draw soilBuffer in buffer and apply filters there
	buffer.push()

	// Create desaturated background color using chroma.js
	let layerColor = chroma.rgb(params.mainTint[0] * 255, params.mainTint[1] * 255, params.mainTint[2] * 255)
	let desaturatedBg = layerColor.saturate(2).brighten(0.5)
	buffer.background(desaturatedBg.hex())

	buffer.image(soilBuffer, 0, 0, buffer.width, buffer.height)
	bufferDeformFilter.setUniform('deformationAmount', deformAmtA)
	buffer.filter(bufferDeformFilter)
	bufferRotateFilter.setUniform('rotationAngle', 90)
	buffer.filter(bufferRotateFilter)
	// bloomFilter.setUniform('intensity', random(0.3, 0.8))
	// bloomFilter.setUniform('glow', random(0.1, 0.4))
	// buffer.filter(bloomFilter)
	bufferDeformFilter.setUniform('deformationAmount', deformAmtB)
	buffer.filter(bufferDeformFilter)
	bufferContrastFilter.setUniform('contrast', random(0.8, 1.2))
	buffer.filter(bufferContrastFilter)
	buffer.pop()
}

// --- Palette helpers ---
function hexToRgb01(hex) {
	hex = hex.replace('#', '')
	const bigint = parseInt(hex, 16)
	const r = ((bigint >> 16) & 255) / 255
	const g = ((bigint >> 8) & 255) / 255
	const b = (bigint & 255) / 255
	return [r, g, b]
}

function pickPaletteColor(layerIndex) {
	let colorHex
	if (paletteMode === 'random') {
		colorHex = random(palette)
	} else {
		colorHex = palette[layerIndex % palette.length]
	}
	return hexToRgb01(colorHex)
}

// --- NEW: planning and generator-driven build ---
function planWaveLayers() {
	let layers = []
	let numLayers = 12
	let minAmplitude = 100
	let maxAmplitude = 600
	let amplitudeExponent = 4
	let maxFrequency = 1.6
	let minFrequency = 0.2
	let frequencyExponent = 1.5
	let maxNoiseAmount = 60
	let minNoiseAmount = 5
	let topY = -height / 2.5
	let bottomY = height / 2.5
	for (let layer = 0; layer < numLayers; layer++) {
		let progress = layer / (numLayers - 1)
		let yBase = map(progress, 0, 1, topY, bottomY)
		let amplitudeScale = pow(progress, amplitudeExponent)
		let amplitude = lerp(minAmplitude, maxAmplitude, amplitudeScale)
		let frequencyScale = pow(1 - progress, frequencyExponent)
		let frequency = lerp(minFrequency, maxFrequency, frequencyScale)
		let noiseAmount = lerp(minNoiseAmount, maxNoiseAmount, progress)
		let sampling = 14
		let wavePoints = generateWaveLayer(yBase, amplitude, frequency, 0.0, noiseAmount, sampling)
		let tintColor = pickPaletteColor(layer)
		// Soil texture scale: larger in back (maxScale), smaller in front (minScale)
		let minScale = random(10, 15)
		let maxScale = random(20, 35)
		let scaleValue = lerp(maxScale, minScale, progress)
		layers.push({
			points: wavePoints,
			yBase: yBase,
			progress: progress,
			soilParams: {
				scale: scaleValue,
				warpAmp: 0.55,
				warpFreq: 0.55,
				moisture: 0.32,
				pebbleFreq: 0.9,
				crackStrength: 0.55,
				grainFreq: 6.0,
				grainAmount: 0.14,
				mainTint: tintColor,
				mainTintAmount: 0.8, // More aggressive tinting
				detailTint: [min(tintColor[0] * 1.2, 2.0), min(tintColor[1] * 1.2, 2.0), min(tintColor[2] * 1.2, 2.0)],
				detailTintAmount: 0.6, // More aggressive detail tinting
				rockTint: tintColor, // Use palette color for rocks too
				rockTintAmount: 0.9,
			},
			deformAmtA: random(0.05, 0.1),
			deformAmtB: random(0.05, 0.1),
			rotationDeg: random(-10, 10),
			brightness: random(0.8, 1.3),
			strokeColor: tintColor
		})
	}
	return layers
}

function* buildSequence() {
	comp.clear()

	// Build one layer per frame, accumulating in comp
	for (let i = 0; i < plannedLayers.length; i++) {
		let L = plannedLayers[i]
		// Bake soil + filters entirely in buffer context
		bakeSoilToBuffer(L.soilParams, L.deformAmtA, L.deformAmtB)

		// Clip and draw into the comp buffer (2D context)
		comp.push()
		comp.beginClip()
		comp.beginShape()
		// Map WEBGL coords (-w/2..w/2, -h/2..h/2) to 2D (0..w, 0..h)
		let firstPoint = true
		for (let p of L.points) {
			let px = p.x + width / 2
			let py = p.y + height / 2
			if (firstPoint) {
				comp.vertex(px, py)
				firstPoint = false
			}
			comp.splineVertex(px, py)
		}
		// Close the shape to bottom corners
		comp.vertex(width, height)
		comp.vertex(0, height)
		comp.endShape(CLOSE)
		comp.endClip()

		// Draw buffer image into comp (crop out margin to fit canvas size)
		comp.imageMode(CENTER)
		let bufferCenter = buffer.width / 2
		// Crop from center of square buffer to fit canvas dimensions
		let cropW = width
		let cropH = height
		comp.image(
			buffer,
			width / 2, height / 2, width, height,
			bufferCenter - cropW / 2, bufferCenter - cropH / 2, cropW, cropH
		)

		let ctx = comp.drawingContext
		let fogH = lerp(height * 0.22, height * 0.08, L.progress)
		let yCenter = L.yBase + height / 2
		let y0 = yCenter - fogH * 0.8
		// Extend fog all the way to the bottom of the canvas
		let grad = ctx.createLinearGradient(0, y0, 0, height)
		// Midpoint of the gradient around the layer height
		let midT = constrain((yCenter - y0) / (height - y0), 0, 1)
		let fogColor = chroma.rgb(L.strokeColor[0] * 255, L.strokeColor[1] * 255, L.strokeColor[2] * 255).saturate(0.2).darken(0.5).hex()
		grad.addColorStop(0.0, fogColor + '20')
		grad.addColorStop(midT, fogColor + '77')
		grad.addColorStop(1.0, fogColor + '99')
		ctx.save()
		ctx.fillStyle = grad
		comp.noStroke()
		comp.rect(0, y0, width, height - y0)
		ctx.restore()

		// Add distinctive thick outline stroke with shadow
		comp.push()
		comp.drawingContext.shadowColor = 'rgba(0, 0, 0, 0.4)'
		comp.drawingContext.shadowBlur = 8
		comp.drawingContext.shadowOffsetX = 3
		comp.drawingContext.shadowOffsetY = 3
		comp.noFill()
		comp.stroke(L.strokeColor[0] * 255, L.strokeColor[1] * 255, L.strokeColor[2] * 255)
		comp.strokeWeight(random(6, 12))
		comp.beginShape()
		let firstStroke = true
		for (let p of L.points) {
			let px = p.x + width / 2
			let py = p.y + height / 2
			if (firstStroke) {
				comp.vertex(px, py)
				firstStroke = false
			}
			comp.splineVertex(px, py)
		}
		comp.endShape()
		comp.pop()

		comp.pop()
		yield 1
	}
}

let wave = (x, t) => sin(3 * x - 3 * t + 5) / 3 + sin(5 * x + 3 * t + 2) / 5 + sin(8 * x + 3 * t + 4) / 8 + sin(13 * x - 3 * t + 3) / 8

function generateWaveLayer(yBase, amplitude, frequency, timeOffset, noiseAmount, sampling = 20) {
	let points = []
	let t = random(1000)
	for (let x = -cw / 2; x <= cw / 2 + 2 * sampling; x += (sampling * random(1, 1.5))) {
		if (x > cw / 2) {
			x = cw / 2
		}
		let normalizedX = map(x, -cw / 2, cw / 2, 0, TWO_PI * frequency)
		let y = yBase + wave(normalizedX, t) * amplitude
		y += noise(x * 0.01, t * 0.01) * noiseAmount
		points.push({ x: x, y: y })
		if (x >= cw / 2) {
			break
		}
	}
	return points
}


