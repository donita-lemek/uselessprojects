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

const GenerateRoastInputSchema = z.object({
  word: z.string().describe('The word to base the roast on.'),
  transcript: z.string().describe('The full transcript of the video for context.'),
});
export type GenerateRoastInput = z.infer<typeof GenerateRoastInputSchema>;

const GenerateRoastOutputSchema = z.object({
  roast: z.string().describe('The generated roast.'),
});
export type GenerateRoastOutput = z.infer<typeof GenerateRoastOutputSchema>;


const roastPrompt = ai.definePrompt({
    name: 'roastPrompt',
    input: { schema: GenerateRoastInputSchema },
    output: { schema: GenerateRoastOutputSchema },
    prompt: `You are a professional comedian known for your sharp, witty roasts.
You will be given a word and the full transcript of a video where that word was spoken.
Your task is to generate a cutting, concise, and humorous roast based on the given word and its context in the transcript.

Make it burn!

Word: {{{word}}}
Transcript:
{{{transcript}}}
`,
    config: {
        model: 'googleai/gemini-2.0-flash',
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
    const { output } = await roastPrompt(input);
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
