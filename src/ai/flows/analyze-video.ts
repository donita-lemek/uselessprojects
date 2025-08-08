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
  transcript: z.string().describe('The full transcript of the video.'),
  wordFrequencies: z.array(WordFrequencySchema).describe('An array of the 10 most frequent words and their counts.'),
});
export type AnalyzeVideoOutput = z.infer<typeof AnalyzeVideoOutputSchema>;
export type WordFrequency = z.infer<typeof WordFrequencySchema>;

const analyzeVideoFlow = ai.defineFlow(
  {
    name: 'analyzeVideoFlow',
    inputSchema: AnalyzeVideoInputSchema,
    outputSchema: AnalyzeVideoOutputSchema,
  },
  async (input) => {
    // This is a mock implementation.
    console.log('Analyzing video (mock):', input.videoDataUri.substring(0, 50));
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      transcript: "This is a mock transcript. The user said girlfriend many times. This is just a test.",
      wordFrequencies: [
        { word: 'girlfriend', count: 10 },
        { word: 'like', count: 8 },
        { word: 'actually', count: 5 },
        { word: 'project', count: 4 },
        { word: 'really', count: 3 },
      ]
    };
  }
);


export async function analyzeVideo(input: AnalyzeVideoInput): Promise<AnalyzeVideoOutput> {
    return analyzeVideoFlow(input);
}
