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
  wordFrequencies: z.array(WordFrequencySchema).describe('An array of the 10 most frequent words and their timestamps.'),
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
    const prompt = `You are a video analysis expert. Your task is to analyze the video provided.
First, generate a full transcript of all spoken content with timestamps.
Second, from the transcript, identify the 10 most frequent words (excluding common stop words like 'the', 'a', 'is'). For each of these 10 words, provide its total count and a list of timestamps (in seconds) for every time it appears in the video.

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


export async function analyzeVideo(input: AnalyzeVideoInput): Promise<AnalyzeVideoOutput> {
    return analyzeVideoFlow(input);
}
