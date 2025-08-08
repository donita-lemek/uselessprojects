'use server';

/**
 * @fileOverview Generates a roast based on a word and a transcript.
 *
 * - generateRoast - A function that takes a word and transcript and returns a roast.
 * - GenerateRoastInput - The input type for the generateRoast function.
 * - GenerateRoastOutput - The return type for the generateRoast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TimedWord } from './analyze-video';

const GenerateRoastInputSchema = z.object({
  word: z.string().describe('The word to base the roast on.'),
  timedTranscript: z.custom<TimedWord[]>().describe('The full transcript of the video for context.'),
});
export type GenerateRoastInput = z.infer<typeof GenerateRoastInputSchema>;

const GenerateRoastOutputSchema = z.object({
  roast: z.string().describe('The generated roast.'),
});
export type GenerateRoastOutput = z.infer<typeof GenerateRoastOutputSchema>;


const roastPrompt = ai.definePrompt({
    name: 'roastPrompt',
    input: { schema: z.object({
        word: z.string(),
        transcriptJson: z.string(),
    }) },
    output: { schema: GenerateRoastOutputSchema },
    model: 'googleai/gemini-2.0-flash',
    prompt: `You are a legendary roast comedian, famous for your devastatingly clever and insightful burns. You don't just insult; you craft comedic masterpieces.
You will be given a specific word and the full transcript of a video where that word was spoken.
Your mission is to deliver a truly memorable, witty, and savage roast.

Here are your rules of engagement:
1.  **Be Specific:** Don't just make a generic joke about the word. Use the surrounding transcript to understand the context. Is the person rambling? Are they trying to sound smart? Use that against them.
2.  **Be Creative:** Find an unexpected angle. Connect the word to a funny metaphor or a ridiculous scenario.
3.  **Be Personal (to the transcript):** The roast should feel like it was tailor-made for the person speaking in the video.
4.  **Punch Up:** The humor should be sharp, not just mean. It's a roast, not a hate speech.

Make it so good they'll have to laugh through their tears. Now, let's get to work.

Word to Roast: {{{word}}}

Full Transcript for Context:
{{{transcriptJson}}}
`,
    config: {
        safetySettings: [
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
            },
        ],
    }
});


const generateRoastFlow = ai.defineFlow(
  {
    name: 'generateRoastFlow',
    inputSchema: GenerateRoastInputSchema,
    outputSchema: GenerateRoastOutputSchema,
  },
  async (input) => {
    const { output } = await roastPrompt({
        word: input.word,
        transcriptJson: JSON.stringify(input.timedTranscript),
    });
    if (!output) {
      throw new Error('Failed to generate roast.');
    }
    return {
      roast: output.roast,
    };
  }
);


export async function generateRoast(input: GenerateRoastInput): Promise<GenerateRoastOutput> {
    return generateRoastFlow(input);
}
