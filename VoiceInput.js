import EventEmitter from 'events'
import axios from 'axios'

/**
 * @class VoiceInput
 * @description Handles voice input, recording, and transcription.
 * @fires VoiceInput#recordingStarted - Emitted when recording starts.
 * @fires VoiceInput#recordingStopped - Emitted when recording stops.
 * @fires VoiceInput#isLoading - While Transcribing voice to text
 * @fires VoiceInput#isFinished - When finished transcribing
 * @extends EventEmitter
 */
class VoiceInput extends EventEmitter {
  /**
   * @private
   * @const
   * @type {string}
   * @description The URL of the transcription API endpoint.
   */
  #endpoint

  /**
   * @private
   * @type {MediaRecorder}
   * @description The MediaRecorder instance for audio recording.
   */
  #recorder

  /**
   * @private
   * @type {FormData}
   * @description The FormData object used for submitting audio to the API.
   */
  #formData

  /**
   * @private
   * @type {HTMLInputElement}
   * @description The input field where the transcribed text will be displayed.
   */
  #outputInputField

  /**
   * @private
   * @type {'ja'|'en'}
   * @description The language code for transcription (default: 'ja').
   */
  #language = 'ja'

  /**
   * @private
   * @type {string}
   * @description The Result Text transcribed
   */
  #textTranscribed

  /**
   * @private
   * @type {Function}
   * @description Function to resolve transcription promise.
   */
  #resolveTranscription

  /**
   * @private
   * @type {Function}
   * @description Function to reject transcription promise.
   */
  #rejectTranscription

  #returnText = false

  /**
   * @constructor
   * @param {HTMLInputElement} outputInputField - The input field for displaying transcribed text.
   * @param {'ja'|'en'} [language='ja'] - The language code for transcription (default: 'ja').
   * @param {URL} [endpoint='http://139.59.254.243:3000/api/transcribe/whisperapi'] - The Endpoint URL for transcription (default: 'http://139.59.254.243:3000/api/transcribe/whisperapi').
   */
  constructor(
    outputInputField = '',
    language = 'ja',
    endpoint = 'http://139.59.254.243:3000/api/transcribe/whisperapi'
  ) {
    super()
    this.#outputInputField = outputInputField
    this.#language = language
    this.#endpoint = endpoint
  }

  /**
   * Checks if currently recording.
   *
   * @returns {boolean} True if recording, false otherwise.
   */
  #isRecording() {
    return this.#recorder && this.#recorder.state === 'recording'
  }

  /**
   * Starts or stops voice recording and transcription.
   *
   * @async

   * @returns {Promise<string>} Resolves with the transcribed text.
   * @throws {Error} If any operation fails (e.g., API call, recording).
   */
  async startOrStopTranscription(returnText = false) {
    try {
      this.#returnText = returnText

      if (this.#isRecording()) {
        await this.#stopRecording()
        return this.#textTranscribed
      }
      await this.#startRecording()
      if (returnText) {
        return new Promise((resolve, reject) => {
          this.#resolveTranscription = resolve
          this.#rejectTranscription = reject
        })
      }
    } catch (error) {
      throw new Error(error?.message || 'Error Starting or Stopping')
    }
  }

  /**
   * @private
   * Starts recording audio and prepares for processing.
   *
   * @async
   * @fires VoiceInput#recordingStarted - Emitted when recording starts.

   * @throws {Error} If starting recording fails.
   */
  async #startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.#recorder = new MediaRecorder(stream)
      // Emitting recording started event
      /**
       * @event VoiceInput#recordingStarted
       */
      this.emit('recordingStarted')

      let audioChunks = []
      let isSilent = false // Flag to track silence
      let silenceTimer // Timer to track silence duration

      // Create an AudioContext and AnalyserNode for silence detection
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Set up frequency analysis parameters
      analyser.fftSize = 2048
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      // Function to check for silence based on frequency analysis
      const checkForSilence = async () => {
        analyser.getByteFrequencyData(dataArray)
        const sum = dataArray.reduce((acc, val) => acc + val, 0)
        const average = sum / bufferLength

        // Check if average amplitude is below threshold
        if (average < 10) {
          // Adjust threshold as needed
          if (!isSilent) {
            // If not already silent, start silence timer
            silenceTimer = setTimeout(() => {
              this.#stopRecording()
            }, 1500) // Stop recording after 2.5 seconds of silence
            isSilent = true
          }
        } else {
          // If audio detected, clear silence timer and reset isSilent flag
          clearTimeout(silenceTimer)
          isSilent = false
        }
      }

      // Start silence detection loop
      const silenceDetectionInterval = setInterval(checkForSilence, 100) // Check every 100 milliseconds

      // Event listeners for recording
      this.#recorder.ondataavailable = (e) => {
        e.data.size > 0 && audioChunks.push(e.data)
      }

      this.#recorder.onstop = () => {
        clearInterval(silenceDetectionInterval) // Stop silence detection loop
        source.disconnect() // Disconnect AnalyserNode
        this.#processAudioBlob(new Blob(audioChunks, { type: 'audio/wav' }))
        audioChunks = []
      }

      this.#recorder.start()
    } catch (error) {
      console.error('Error starting recording:', error)
      throw error
    }
  }

  /**
   * @private
   * Stops recording, releases resources, and prepares for transcription.
   *
   * @async
   * @fires VoiceInput#recordingStopped - Emitted when recording stops.

   * @throws {Error} If stopping recording fails.
   */
  async #stopRecording() {
    try {
      if (this.#recorder && this.#recorder.state === 'recording') {
        this.#recorder.stop()
        for (const track of this.#recorder.stream.getTracks()) {
          track.stop()
        }
      } else if (this.#returnText) {
        await this.#resolveTranscription(null) // Resolve with null if not recording
      } else {
        throw new Error(null)
      }

      // Emitting event when recording stops
      /**
       * @event VoiceInput#recordingStopped
       */
      this.emit('recordingStopped')
    } catch (error) {
      if (this.#returnText) {
        this.#rejectTranscription(new Error(error?.message || 'Error Stopping'))
      } else {
        throw new Error(error?.message || 'Error Stopping')
      }
    }
  }

  /**
   * Prepares and submits recorded audio for transcription.
   *
   * @async
   * @throws {Error} If processing or API call fails.
   */

  async #processAudioBlob(audioBlob) {
    try {
      this.#formData = new FormData()
      this.#formData.append('file', audioBlob) // recorded audio
      this.#formData.append('language', this.#language) // ja || en
      return await this.transcribe()
    } catch (e) {
      throw new Error(
        e?.message || 'Please say something the audio is too short.'
      )
    }
  }

  /**
   * @private
   * Sends recorded audio to the API and updates the UI with transcribed text.
   *
   * @param {FormData} formData - FormData with file and language
   *
   * @async
   * @throws {Error} If the API call fails.
   */
  async transcribe(formData) {
    try {
      const isOutputFieldAvailable =
        !this.#returnText && this.#outputInputField !== ''

      if (formData) {
        this.#formData = formData
      }

      /**
       * @event VoiceInput#isLoading
       */
      this.emit('isLoading')
      if (isOutputFieldAvailable) {
        this.#outputInputField.value = 'Loading...'
        this.#outputInputField.disabled = true
      }
      const response = await axios.post(this.#endpoint, this.#formData)

      if (response.status === 200) {
        this.#textTranscribed = response?.data?.text
        if (isOutputFieldAvailable) {
          this.#outputInputField.value = response?.data?.text
        }

        if (!isOutputFieldAvailable) {
          this.#resolveTranscription(this.#textTranscribed)
        }
      }
      /**
       * @event VoiceInput#isFinished
       */
      this.emit('isFinished')

      if (isOutputFieldAvailable) {
        this.#outputInputField.disabled = false
      }
    } catch (err) {
      if (this.#returnText) {
        this.#rejectTranscription(
          new Error(err?.response?.data?.error || 'API call error')
        )
      } else {
        throw new Error(err?.response?.data?.error || 'API call error')
      }
    }
  }
}

export default VoiceInput
