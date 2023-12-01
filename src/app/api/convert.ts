// pages/api/convert.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import formidable, { File, Files } from 'formidable'
import OpenAI from 'openai'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ message: 'Only POST requests allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files: Files) => {
    if (err) {
      console.error('Error parsing the form:', err)
      return res.status(500).json({ error: 'Error parsing the form' })
    }

    if (!files.audio) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio

    const openai = new OpenAI()

    try {
      const transcriptionResponse = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFile.filepath),
        model: 'whisper-1'
      })

      const transcription = transcriptionResponse.text
      res.status(200).json({ transcription })
    } catch (apiError: any) {
      console.error('Error processing audio:', apiError)
      if (apiError.response) {
        console.error('API Response Error:', apiError.response.data)
      }
      res
        .status(500)
        .json({ error: apiError.message || 'Error processing audio' })
    }
  })
}
