import axios from 'axios'

/**
 * @class VoiceInput
 * @description Handles voice input, recording, and transcription.
 */
class VoiceInput {
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
    this.#outputInputField = outputInputField
    this.#language = language
    this.#endpoint = endpoint
  }

  /**
   * Checks if currently recording.
   *
   * @returns {boolean} True if recording, false otherwise.
   */
  isRecording() {
    return (this.#recorder && this.#recorder.state === 'recording') || false
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

      if (this.isRecording()) {
        await this.#stopRecording()
        return this.#textTranscribed
      } else {
        await this.#startRecording()
        if (returnText)
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
   * @throws {Error} If starting recording fails.
   */
  async #startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.#recorder = new MediaRecorder(stream)

      const audioChunks = []

      this.#recorder.ondataavailable = (e) =>
        e.data.size > 0 && audioChunks.push(e.data)

      this.#recorder.onstop = () =>
        this.#processAudioBlob(new Blob(audioChunks, { type: 'audio/wav' }))

      this.#recorder.start()
    } catch (error) {
      console.error('Error starting recording:', error)
      throw error // Re-throw for proper error handling
    }
  }

  /**
   * @private
   * Stops recording, releases resources, and prepares for transcription.
   *
   * @async
   * @throws {Error} If stopping recording fails.
   */
  async #stopRecording() {
    try {
      if (this.#recorder && this.#recorder.state === 'recording') {
        this.#recorder.stop()
        this.#recorder.stream.getTracks().forEach((track) => track.stop())
      } else {
        if (this.#returnText)
          this.#resolveTranscription(null) // Resolve with null if not recording
        else throw new Error(null)
      }
    } catch (error) {
      if (this.#returnText)
        this.#rejectTranscription(new Error(error?.message || 'Error Stopping'))
      else throw new Error(error?.message || 'Error Stopping')
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
      console.log(e?.message)
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
      if (formData) this.#formData = formData

      const response = await axios.post(this.#endpoint, this.#formData)

      if (response.status === 200) {
        this.#textTranscribed = response?.data?.text
        if (!this.#returnText && this.#outputInputField !== '')
          this.#outputInputField.value = response?.data?.text

        if (this.#returnText) this.#resolveTranscription(this.#textTranscribed)
      }
    } catch (err) {
      if (this.#returnText)
        this.#rejectTranscription(
          new Error(err?.response?.data?.error || 'API call error')
        )
      else throw new Error(err?.response?.data?.error || 'API call error')
    }
  }
}

export default VoiceInput
