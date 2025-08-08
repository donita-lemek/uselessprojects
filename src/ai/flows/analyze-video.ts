'use server';

/**
 * @fileOverview Analyzes a video to generate a transcript and word frequencies.
 *
 * - analyzeVideo - A function that takes a video and returns its transcript and word frequency analysis.
 * - AnalyzeVideoInput - The input type for the analyzeVideo function.
 * - AnalyzeVideoOutput - The return type for the analyzeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WordFrequencySchema = z.object({
  word: z.string().describe('A word from the transcript.'),
  count: z.number().describe('The number of times the word appears in the transcript.'),
  timestamps: z.array(z.number()).describe('An array of timestamps (in seconds) where the word appears in the video.'),
});

const AnalyzeVideoInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type AnalyzeVideoInput = z.infer<typeof AnalyzeVideoInputSchema>;

const AnalyzeVideoOutputSchema = z.object({
  transcript: z.string().describe('The full transcript of the video, with timestamps for each utterance.'),
  wordFrequencies: z.array(WordFrequencySchema).describe('An array of the most frequent words and their timestamps.'),
});
export type AnalyzeVideoOutput = z.infer<typeof AnalyzeVideoOutputSchema>;
export type WordFrequency = z.infer<typeof WordFrequencySchema>;

// This flow was too complex and was failing.
// We are replacing it with two simpler flows and an orchestrator function.
const analyzeVideoFlow = ai.defineFlow(
  {
    name: 'analyzeVideoFlow',
    inputSchema: AnalyzeVideoInputSchema,
    outputSchema: AnalyzeVideoOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert video analyst. Analyze the provided video to perform two tasks:
1.  Generate a complete and accurate transcript of all spoken words, including timestamps for each utterance.
2.  Analyze the full transcript to identify the 10 most frequently used words. For each of these words, provide a count of its occurrences and an array of the precise timestamps (in seconds) where it is spoken in the video.

Video: {{media url=videoDataUri}}`;

    const {output} = await ai.generate({
        prompt: prompt,
        input: input,
        output: {
            schema: AnalyzeVideoOutputSchema,
        },
    });

    return output!;
  }
);


// Main function that orchestrates the two new flows
export async function analyzeVideo(input: AnalyzeVideoInput): Promise<AnalyzeVideoOutput> {
    return analyzeVideoFlow(input);
}
