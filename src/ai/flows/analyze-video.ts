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
      "A video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeVideoInput = z.infer<typeof AnalyzeVideoInputSchema>;

const AnalyzeVideoOutputSchema = z.object({
  transcript: z.string().describe('The full transcript of the video, with timestamps for each utterance.'),
  wordFrequencies: z.array(WordFrequencySchema).describe('An array of the most frequent words and their timestamps.'),
});
export type AnalyzeVideoOutput = z.infer<typeof AnalyzeVideoOutputSchema>;
export type WordFrequency = z.infer<typeof WordFrequencySchema>;

export async function analyzeVideo(input: AnalyzeVideoInput): Promise<AnalyzeVideoOutput> {
  return analyzeVideoFlow(input);
}

const prompt = ai.definePrompt({
    name: 'analyzeVideoPrompt',
    input: {schema: AnalyzeVideoInputSchema},
    output: {schema: AnalyzeVideoOutputSchema},
    prompt: `You are an expert video analyst. Your task is to transcribe the provided video and analyze the transcript to find the most frequently used words.

    Follow these steps:
    1.  Create a detailed transcript of the video. Include timestamps for each spoken phrase or sentence.
    2.  Analyze the transcript to identify all words.
    3.  Count the occurrences of each word.
    4.  For the 10 most frequent words, list all the timestamps (in seconds from the start of the video) where each word is spoken.
    5.  Return the full transcript and the list of the top 10 most frequent words with their counts and timestamps.

    Video: {{media url=videoDataUri}}`,
});


const analyzeVideoFlow = ai.defineFlow(
  {
    name: 'analyzeVideoFlow',
    inputSchema: AnalyzeVideoInputSchema,
    outputSchema: AnalyzeVideoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
