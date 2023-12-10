import { Configuration, OpenAIApi } from 'openai-edge'
import { Message, OpenAIStream, StreamingTextResponse } from 'ai'
import { getContext } from '@/utils/context'

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OA_OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  try {

    const { messages } = await req.json()

    // Get the last message
    const lastMessage = messages[messages.length - 1]

    // Get the context from the last message
    const context = await getContext(lastMessage.content, '')

    const prompt = [
      {
        role: 'system',
        content: `You are an AI assistant who is truthful, helpful, clever, and articulate. You are eager to provide vivid and thoughtful responses to the user.
        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        AI assistant will not invent anything that is not drawn directly from the CONTEXT BLOCK, you can only use facts and truthful information learned during training.
        `,
      },
    ]

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
      model: 'gpt-4-1106-preview',
      stream: true,
      messages: [...prompt, ...messages.filter((message: Message) => message.role === 'user')],
      temperature: 0.3
    })
    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response)
    // Respond with the stream
    return new StreamingTextResponse(stream)
  } catch (e) {
    throw (e)
  }
}