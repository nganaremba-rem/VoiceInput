
# VoiceInput is a Web Browser JavaScript module for handling voice input, recording, and transcription.

## Installation

```bash
npm install @remba/voiceinput
```

# Usage

## Simple Example

```javascript
// Import the VoiceInput package
import VoiceInput from '@remba/voiceinput'; 

// Select the Output from the HTML Document (should be HTMLInputElement)
// eg: <input type="text" id="inputElementToShowOutput" />
// or 
// eg: <textarea id="inputElementToShowOutput"></textarea>

const outputInputElement = document.querySelector('#inputElementToShowOutput'); 

// Select the microphone button 
const micButton = document.querySelector("#mic-button")

// #### VERY IMPORTANT - PASS HTMLInputElement Only as argument if output element is needed, if you want the RAW output text use the Custom Output example below ###
// Create an instance for each voice input
const voiceInput = new VoiceInput(outputInputElement);

// When the Mic button is clicked call the startOrStopTranscription() function from the voiceInput instance
micButton.addEventListener('click', () => voiceInput.startOrStopTranscription())


```

### (Optional) Handling Recording State

#### [Recording Started State]
voiceInput.on('recordingStarted', yourUILogicFunctionHere)

#### [Recording Stopped State]
voiceInput.on('recordingStopped', yourUILogicFunctionHere)

#### [While Transcription is in process - Loading State]
voiceInput.on('isLoading', yourUILogicFunctionHere)

#### [When Transcription Finished]
voiceInput.on('isFinished', yourUILogicFunctionHere)

EXAMPLE:
```javascript
    // (event - recordingStarted) UI Update while recording - EXAMPLE
voiceInput.on('recordingStarted', () => {
  micButton.style.backgroundColor = 'red'
})

// (event - recordingStopped) UI Update when finished recording - EXAMPLE
voiceInput.on('recordingStopped', () => {
  micButton.style.backgroundColor = 'white'
})

// (event - isLoading) UI Update while transcription is in process - EXAMPLE
voiceInput.on('isLoading', () => {
  outputInputElement.value = 'Loading...'
  outputInputElement.disabled = true
})

// (event - isFinished) UI Update while transcription is Finished/Done - EXAMPLE
voiceInput.on('isFinished', () => {
  outputInputElement.disabled = false
})
```

# Usage 
## Specifying Language Example

```javascript
// Import the VoiceInput package
import VoiceInput from '@remba/voiceinput'; 

// Select the Output from the HTML Document (should be HTMLInputElement)
// eg: <input type="text" id="inputElementToShowOutput" />
// or 
// eg: <textarea id="inputElementToShowOutput"></textarea>
const outputInputElement = document.querySelector('#inputElementToShowOutput'); 

// Select the microphone button 
const micButton = document.querySelector("#mic-button")

// Create an instance for each voice input with specified language
// Language can be: en for English ja for Japanese (Default: ja)
const voiceInput = new VoiceInput(outputInputElement, 'en');

// When the Mic button is clicked call the startOrStopTranscription() function from the voiceInput instance
micButton.addEventListener('click', () => voiceInput.startOrStopTranscription())

```


# Usage 
## Using Custom Output Example

NOTE: You cannot use BOTH "new VoiceInput(outputHTMLInputField)" with output parameter and call "voiceInput.startOrStopTranscription(true)" with true as parameter (USE EITHER ONE OF THEM)

WRONG IMPLEMENTATION
```javascript 
new VoiceInput(outputHTMLInputField)
voiceInput.startOrStopTranscription(true)
```

USE THIS SIMPLE METHOD [CORRECT IMPLEMENTATION]
```javascript 
new VoiceInput(outputHTMLInputField)
voiceInput.startOrStopTranscription()
```

OR THIS METHOD WHICH RETURNS PROMISE [CORRECT IMPLEMENTATION]
```javascript 
new VoiceInput()
voiceInput.startOrStopTranscription(true)
```

EXAMPLE:
```javascript
// Import the VoiceInput package
import VoiceInput from '@remba/voiceinput'; 

// Custom output field (can be any HTML element)
// eg: <p></p>
const outputField = document.querySelector('p'); 

// Select the microphone button 
const micButton = document.querySelector("#mic-button")

// Create an instance for each voice input with default settings
// NO PARAMETER REQUIRED IF USING CUSTOM OUTPUT ELEMENT
const voiceInput = new VoiceInput();

// When the Mic button is clicked, call the startOrStopTranscription() function with true as a single argument
micButton.addEventListener('click', getTranscribedText)

function getTranscribedText() {
    // Call startOrStopTranscription(true) - MAKE SURE TO PASS true as an argument
    voiceInput.startOrStopTranscription(true)
    .then((result) => {
        console.log(result)
        outputField.textContent = result
    })
    .catch((error) => {
        console.error(error)
    })
}


```
