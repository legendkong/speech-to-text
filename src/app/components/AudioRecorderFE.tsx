'use client'

import React, { useState, useRef } from 'react'
import axios from 'axios'

const AudioRecorderFE: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [transcription, setTranscription] = useState<string>('')

  const startRecording = async () => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      })
      const mediaRecorder: MediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)

      const audioChunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
      }
    } catch (err) {
      console.error('Error starting recording:', err)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const handleRecording = () => {
    isRecording ? stopRecording() : startRecording()
  }

  const sendAudioToServer = async () => {
    if (!audioBlob) return

    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.wav')
    formData.append('model', 'whisper-1') // Append model information
    // formData.append('language', 'English') // Append language information

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}` // Replace with your API key
            // Removed 'Content-Type': 'multipart/form-data'
          }
        }
      )
      setTranscription(response.data.text)
      console.log('Transcription:', response.data)
    } catch (err) {
      console.error('Error sending audio to OpenAI:', err)
    }
  }

  return (
    <div>
      <div>
        <button
          className='ml-5 bg-orange-500 p-2 mt-2 rounded-lg'
          onClick={handleRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        {audioBlob && (
          <button onClick={sendAudioToServer}>Convert to Text</button>
        )}
        {transcription && (
          <div>
            <h3>Transcription:</h3>
            <p>{transcription}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AudioRecorderFE
