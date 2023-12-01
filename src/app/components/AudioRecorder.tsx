'use client'

import { useState, useRef } from 'react'
import axios from 'axios'

const AudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const startRecording = async () => {
    const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })
    const mediaRecorder: MediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
    console.log('Recording started')

    const audioChunks: BlobPart[] = []
    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      setAudioBlob(audioBlob)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    console.log('Recording stopped')
  }

  const handleRecording = () => {
    isRecording ? stopRecording() : startRecording()
  }

  const sendAudioToServer = async () => {
    if (!audioBlob) return

    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    try {
      const response = await axios.post('/api/convert', formData)
      console.log('Transcription:', response.data)
    } catch (err) {
      console.error('Error sending audio to server:', err)
    }
  }

  return (
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
    </div>
  )
}

export default AudioRecorder
