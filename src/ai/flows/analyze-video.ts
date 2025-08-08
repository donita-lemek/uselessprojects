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

// Simple schema for just getting the transcript
const TranscriptOutputSchema = z.object({
    transcript: z.string().describe('The full transcript of the video.'),
});

const analyzeVideoFlow = ai.defineFlow(
  {
    name: 'analyzeVideoFlow',
    inputSchema: AnalyzeVideoInputSchema,
    outputSchema: AnalyzeVideoOutputSchema,
  },
  async (input) => {
    // Step 1: Get the transcript from the AI.
    const transcriptPrompt = `You are a video analysis expert. Your task is to generate a full, raw transcript of all spoken content from the provided video. Do not add any formatting, timestamps, or headers.

Video: {{media url=videoDataUri}}`;

    const { output: transcriptOutput } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: transcriptPrompt,
        input: input,
        output: {
            schema: TranscriptOutputSchema,
        },
    });

    if (!transcriptOutput) {
      throw new Error("Failed to generate transcript.");
    }

    const { transcript } = transcriptOutput;
    
    // Step 2: Process the transcript in code for accuracy.
    const wordCounts: Record<string, number> = {};
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'as', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'that', 'this', 'so', 'be', 'from', 'out', 'up', 'down', 'like', 'just', 'me']);

    const words = transcript.toLowerCase().match(/\b\w+'?\w*\b/g) || [];

    for (const word of words) {
        if (!commonWords.has(word) && isNaN(Number(word))) { // filter out common words and plain numbers
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    }

    const sortedWords = Object.entries(wordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    const wordFrequencies: WordFrequency[] = sortedWords.map(([word, count]) => ({
        word,
        count,
    }));

    return {
        transcript,
        wordFrequencies,
    };
  }
);


export async function analyzeVideo(input: AnalyzeVideoInput): Promise<AnalyzeVideoOutput> {
    return analyzeVideoFlow(input);
}
