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

// New, simpler flow to just get the transcript
const transcribeVideoFlow = ai.defineFlow(
  {
    name: 'transcribeVideoFlow',
    inputSchema: AnalyzeVideoInputSchema,
    outputSchema: z.object({
      transcript: z.string().describe('The full transcript of the video, with timestamps for each utterance.'),
    }),
  },
  async (input) => {
    const prompt = `You are a video transcription expert. Transcribe the following video and provide timestamps for each utterance.
    Video: {{media url=videoDataUri}}`;

    const {output} = await ai.generate({
        prompt: prompt,
        input: input,
        output: {
            schema: z.object({
                transcript: z.string().describe('The full transcript of the video, with timestamps for each utterance.'),
            }),
        },
    });

    return output!;
  }
);

// New, simpler flow to analyze the transcript text
const analyzeTranscriptFlow = ai.defineFlow(
  {
    name: 'analyzeTranscriptFlow',
    inputSchema: z.object({
      transcript: z.string(),
    }),
    outputSchema: z.object({
      wordFrequencies: z.array(WordFrequencySchema).describe('An array of the most frequent words and their timestamps.'),
    }),
  },
  async (input) => {
    const prompt = `You are an expert text analyst. Analyze the transcript to identify all words. Count the occurrences of each word. For the 10 most frequent words, list all the timestamps (in seconds from the start of the video) where each word is spoken.
    Transcript:
    {{{transcript}}}`;

    const {output} = await ai.generate({
        prompt: prompt,
        input: input,
        output: {
            schema: z.object({
                wordFrequencies: z.array(WordFrequencySchema).describe('An array of the most frequent words and their timestamps.'),
            }),
        },
    });
    return output!;
  }
);


// Main function that orchestrates the two new flows
export async function analyzeVideo(input: AnalyzeVideoInput): Promise<AnalyzeVideoOutput> {
  const { transcript } = await transcribeVideoFlow(input);
  const { wordFrequencies } = await analyzeTranscriptFlow({ transcript });
  return { transcript, wordFrequencies };
}
