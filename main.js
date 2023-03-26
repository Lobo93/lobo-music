// Notas musicais
const notes = {
	C: [ 16.35, 32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093, 4186.01 ],
	Db: [ 17.32, 34.65, 69.3, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92 ],
	D: [ 18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.64 ],
	Eb: [ 19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03 ],
	E: [ 20.6, 41.2, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02, 5274.04 ],
	F: [ 21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83, 5587.65 ],
	Gb: [ 23.12, 46.25, 92.5, 185, 369.99, 739.99, 1479.98, 2959.96, 5919.91 ],
	G: [ 24.5, 49, 98, 196, 392, 783.99, 1567.98, 3135.96, 6271.93 ],
	Ab: [ 25.96, 51.91, 103.83, 207.65, 415.3, 830.61, 1661.22, 3322.44, 6644.88 ],
	A: [ 27.5, 55, 110, 220, 440, 880, 1760, 3520, 7040 ],
	Bb: [ 29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31, 7458.62 ],
	B: [ 30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07, 7902.13 ]
}

// Objeto de audio
const audio = new window.AudioContext()
window.addEventListener('click', () => audio.resume())

// Padrão de ruído
function random(a) {
	var t = a += 0x6D2B79F5;
	t = Math.imul(t ^ t >>> 15, t | 1);
	t ^= t + Math.imul(t ^ t >>> 7, t | 61);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
const whiteNoise = Array(audio.sampleRate).fill(0)
whiteNoise.forEach((e,i) => whiteNoise[i] = random(i) * 2 - 1)

// Função de som
function playSound(frequency = notes.A[4], wave = 'sine', attack = 0.02, sustain = 0, release = 0.5, volume = 1) {
	attack = parseFloat(attack)
	sustain = parseFloat(sustain)
	release = parseFloat(release)
	volume = parseFloat(volume)
	const duration = attack + sustain + release
	const gain = new GainNode(audio, {gain: 0})
	let sound

	// Equalizar volume
	switch (wave) {
		case 'noise': volume *= 1.5; break;
		case 'sawtooth': volume *= .5; break;
		case 'square': volume *= .35; break;
		default:
	}

	// Ruído
	if (wave === 'noise') {
		sound = new AudioBufferSourceNode(audio)
		const noisePattern = [].concat(...Array(Math.ceil(duration)).fill(whiteNoise))
		noisePattern.length = Math.round(audio.sampleRate * duration)
		sound.buffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate)
		sound.buffer.copyToChannel(Float32Array.from(noisePattern), 0)
		const filter = new BiquadFilterNode(audio, {type: 'bandpass', frequency: frequency})
		sound.connect(filter)
		filter.connect(gain)
	}

	// Oscilador
	else {
		sound = new OscillatorNode(audio, {type: wave, frequency: frequency})
		sound.connect(gain)
	}

	// Ciclo de som
	gain.connect(audio.destination)
	sound.start()
	gain.gain.linearRampToValueAtTime(volume, audio.currentTime + attack)
	gain.gain.linearRampToValueAtTime(volume, audio.currentTime + attack + sustain)
	gain.gain.linearRampToValueAtTime(0, audio.currentTime + attack + sustain + release)
	sound.stop(audio.currentTime + duration)
}

// Tocar música
let music
let musicPlaying
let musicTime = 0

function playMusic() {
	const position = musicTime % (Math.ceil(music.length / 4 ) * 4)
	console.log(position)
	if (music[position]) playSound(...music[position])
	inputMusic.style.setProperty('--row', position)
	musicTime++
}

// Validar música
function validateMusic() {
	music = inputMusic.value.replace(/ /g, '').split('\n').map(sound => {
		return !sound ? null : sound.split(/\s*,\s*/)
	})

	music.forEach((musicNote, index) => {
		if (musicNote) {
			const note = musicNote[0].substring(0, musicNote[0].length - 1)
			const octave = musicNote[0].charAt(musicNote[0].length - 1)
			music[index][0] = notes[note][octave]
			music[index][1] = music[index][1].toLowerCase()
			music[index][2] = parseFloat(music[index][2])
			music[index][3] = parseFloat(music[index][3])
			music[index][4] = parseFloat(music[index][4])
			music[index][5] = parseFloat(music[index][5])
		}
	})
}

// Mudar BPM
const labelBPM = document.querySelector(`label[for="${inputBPM.id}"]`)
labelBPM.textContent = `BPM: ${inputBPM.value}`

inputBPM.addEventListener('input', () => {
	labelBPM.textContent = `BPM: ${inputBPM.value}`
})

inputBPM.addEventListener('change', () => {
	if (musicPlaying) {
		clearInterval(musicPlaying)
		musicPlaying = setInterval(playMusic, 60 / 4 / inputBPM.value * 1000)
	}
})

// Botões para tocar / parar música
buttonMusic.addEventListener('click', () => {
	if (musicPlaying) {
		clearInterval(musicPlaying)
		musicPlaying = false
		buttonMusic.textContent = 'Play'
	}
	else {
		validateMusic()
		musicPlaying = setInterval(playMusic, 60 / 4 / inputBPM.value * 1000)
		buttonMusic.textContent = 'Pause'
	}
})

buttonStop.addEventListener('click', () => {
	clearInterval(musicPlaying)
	musicPlaying = false
	musicTime = 0
	inputMusic.style.setProperty('--row', 0)
	buttonMusic.textContent = 'Play'
})

inputMusic.addEventListener('focus', () => {
	clearInterval(musicPlaying)
	musicPlaying = false
	musicTime = 0
	inputMusic.style.setProperty('--row', 0)
	buttonMusic.textContent = 'Play'
})

buttonExample.addEventListener('click', () => {
	clearInterval(musicPlaying)
	musicPlaying = false
	musicTime = 0
	inputMusic.style.setProperty('--row', 0)
	buttonMusic.textContent = 'Play'
	inputMusic.textContent = 'A4, triangle, 0.01, 0, 0.5, 1\n\n\n\nF4, triangle, 0.01, 0, 0.5, 1\n\n\nC4, triangle, 0.01, 0, 0.2, 1\nD4, triangle, 0.01, 0, 0.2, 1\nF4, triangle, 0.01, 0, 0.35, 1\n\nF4, triangle, 0.01, 0, 0.5, 1\n\n\n\nD4, triangle, 0.01, 0, 0.2, 1\nC4, triangle, 0.01, 0, 0.35, 1\n\nF4, triangle, 0.01, 0, 0.35, 1\n\nF4, triangle, 0.01, 0, 0.35, 1\n\nC5, triangle, 0.01, 0, 0.35, 1\n\nA4, triangle, 0.01, 0, 0.5, 1\n\n\nG4, triangle, 0.01, 0, 0.5, 1\n\n\n\nC4, triangle, 0.01, 0, 0.2, 1\nA4, triangle, 0.01, 0, 0.5, 1\n\n\n\nF4, triangle, 0.01, 0, 0.5, 1\n\n\nC4, triangle, 0.01, 0, 0.2, 1\nD4, triangle, 0.01, 0, 0.2, 1\nF4, triangle, 0.01, 0, 0.35, 1\n\nF4, triangle, 0.01, 0, 0.5, 1\n\n\n\nD4, triangle, 0.01, 0, 0.2, 1\nC4, triangle, 0.01, 0, 0.35, 1\n\nF4, triangle, 0.01, 0, 0.5, 1\n\nBb4, triangle, 0.01, 0, 0.2, 1\nA4, triangle, 0.01, 0, 0.2, 1\nG4, triangle, 0.01, 0, 0.2, 1\nF4, triangle, 0.01, 0, 0.5, 1\n\n\n\n\n\n\n\n'
	inputBPM.value = 130
	labelBPM.textContent = `BPM: ${inputBPM.value}`
})
