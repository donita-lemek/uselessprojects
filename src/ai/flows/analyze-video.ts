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

// Simple schema for just getting the transcript
const TranscriptOutputSchema = z.object({
    transcript: z.string().describe('The full transcript of the video, with timestamps for each utterance in the format [HH:MM:SS].'),
});

const analyzeVideoFlow = ai.defineFlow(
  {
    name: 'analyzeVideoFlow',
    inputSchema: AnalyzeVideoInputSchema,
    outputSchema: AnalyzeVideoOutputSchema,
  },
  async (input) => {
    // Step 1: Get the transcript from the AI.
    const transcriptPrompt = `You are a video analysis expert. Your task is to generate a full transcript of all spoken content from the provided video. The transcript should include timestamps for each utterance in the format [HH:MM:SS].

Video: {{media url=videoDataUri}}`;

    const { output: transcriptOutput } = await ai.generate({
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
    const wordCounts: Record<string, { count: number, timestamps: number[] }> = {};

    const lines = transcript.split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
        const match = line.match(/\[(\d{2}):(\d{2}):(\d{2})\]\s*(.*)/);
        if (match) {
            const [, hours, minutes, seconds, text] = match;
            const timestamp = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
            
            const words = text.toLowerCase().match(/\b\w+'?\w*\b/g) || [];

            for (const word of words) {
                if (isNaN(Number(word))) { // filter out plain numbers
                    if (!wordCounts[word]) {
                        wordCounts[word] = { count: 0, timestamps: [] };
                    }
                    wordCounts[word].count++;
                    if (!wordCounts[word].timestamps.includes(timestamp)) {
                       wordCounts[word].timestamps.push(timestamp);
                    }
                }
            }
        }
    }


    const sortedWords = Object.entries(wordCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10);

    const wordFrequencies: WordFrequency[] = sortedWords.map(([word, data]) => ({
        word,
        count: data.count,
        timestamps: data.timestamps.sort((a,b) => a - b),
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
