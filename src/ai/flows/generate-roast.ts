'use server';

/**
 * @fileOverview Generates a roast based on the most frequent word in a transcript.
 *
 * - generateRoast - A function that generates a roast based on the most frequent word in a transcript.
 * - GenerateRoastInput - The input type for the generateRoast function.
 * - GenerateRoastOutput - The return type for the generateRoast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRoastInputSchema = z.object({
  mostFrequentWord: z.string().describe('The most frequent word in the video transcript.'),
  transcript: z.string().describe('The entire video transcript.'),
});
export type GenerateRoastInput = z.infer<typeof GenerateRoastInputSchema>;

const GenerateRoastOutputSchema = z.object({
  roast: z.string().describe('The generated roast based on the most frequent word.'),
});
export type GenerateRoastOutput = z.infer<typeof GenerateRoastOutputSchema>;

export async function generateRoast(input: GenerateRoastInput): Promise<GenerateRoastOutput> {
  return generateRoastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRoastPrompt',
  input: {schema: GenerateRoastInputSchema},
  output: {schema: GenerateRoastOutputSchema},
  prompt: `You are a professional roast comedian. Your job is to generate a short, humorous, and cutting roast based on the most frequent word used in a video transcript.

  Most Frequent Word: {{{mostFrequentWord}}}
  Transcript: {{{transcript}}}

  Roast:`, // Keep it short and impactful.
});

const generateRoastFlow = ai.defineFlow(
  {
    name: 'generateRoastFlow',
    inputSchema: GenerateRoastInputSchema,
    outputSchema: GenerateRoastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
