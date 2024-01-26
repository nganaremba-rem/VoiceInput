# VoiceInput Module

VoiceInput is a Web Browser JavaScript module for handling voice input, recording, and transcription.

## Installation

```bash
npm install @remba/voiceinput
```

# Usage
## Simple Example

```javascript
// Import the VoiceInput package
// Import the VoiceInput package
import VoiceInput from '@remba/voiceinput'; 

// Select the Output from the HTML Document (should be HTMLInputElement)
// eg: <input type="text" id="inputElementToShowOutput" />
// or 
// eg: <textarea id="inputElementToShowOutput"></textarea>
const outputInputElement = document.querySelector('#inputElementToShowOutput'); 

// Select the microphone button 
const micButton = document.querySelector("#mic-button")

// Create an instance for each voice input
const voiceInput = new VoiceInput(outputInputElement);

// When the Mic button is clicked call the startOrStopTranscription() function from the voiceInput instance
micButton.addEventListener('click', () => voiceInput.startOrStopTranscription())


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
