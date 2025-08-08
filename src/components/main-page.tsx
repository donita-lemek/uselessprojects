"use client";

import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { generateRoast } from '@/ai/flows/generate-roast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { Flame, Share2, Clipboard, LoaderCircle, Play, Video, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface WordFrequency {
  word: string;
  count: number;
  timestamps: number[];
}

const MOCK_TRANSCRIPT = "Big Buck Bunny, Big Buck Bunny, oh Big Buck Bunny. The bunny was very big. A big, big, bunny. He was a bunny of unusual size. I like the big bunny. This bunny, this big bunny, is a hero. What a bunny. A truly big bunny.";
const MOCK_WORD_FREQUENCIES: WordFrequency[] = [
  { word: 'bunny', count: 8, timestamps: [1, 3, 5.5, 9.5, 12, 16.5, 18, 20.5, 23] },
  { word: 'big', count: 6, timestamps: [0.5, 2.5, 8.5, 11, 17, 22] },
  { word: 'buck', count: 3, timestamps: [1.5, 3.5, 6] },
  { word: 'a', count: 3, timestamps: [10, 19, 21] },
  { word: 'was', count: 2, timestamps: [7.5, 13] },
  { word: 'the', count: 2, timestamps: [7, 15] },
];


export function MainPage() {
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wordFrequencies, setWordFrequencies] = useState<WordFrequency[]>([]);
  const [transcript, setTranscript] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [roast, setRoast] = useState('');
  const [isRoasting, setIsRoasting] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordFrequency | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      const videoObjectUrl = URL.createObjectURL(file);
      
      // Simulate analysis delay
      setTimeout(() => {
        setVideoUrl(videoObjectUrl);
        setWordFrequencies(MOCK_WORD_FREQUENCIES);
        setTranscript(MOCK_TRANSCRIPT);
        setSelectedWord(MOCK_WORD_FREQUENCIES[0]);
        setIsAnalyzed(true);
        setIsAnalyzing(false);
      }, 1500);
    }
  };

  const handleGenerateRoast = async () => {
    const mostFrequentWord = wordFrequencies[0];
    if (!mostFrequentWord || !transcript) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot generate roast without a frequent word and transcript.",
      });
      return;
    }

    setIsRoasting(true);
    setRoast('');
    try {
      const result = await generateRoast({
        mostFrequentWord: mostFrequentWord.word,
        transcript: transcript,
      });
      setRoast(result.roast);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Roast Failed",
        description: "Could not generate a roast. Please try again.",
      });
    } finally {
      setIsRoasting(false);
    }
  };

  const playClip = (startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      setTimeout(() => {
        videoRef.current?.pause();
      }, 4000); // Play for 4 seconds
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roast);
    toast({
      title: "Copied!",
      description: "Roast copied to clipboard.",
    });
  };

  if (!isAnalyzed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#8d8d8d33_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="animate-fade-in-up">
          <Logo className="w-24 h-24 mx-auto text-primary" />
          <h1 className="mt-6 text-5xl font-bold font-headline tracking-tight text-foreground sm:text-7xl">
            Roast <span className="text-primary">Radar</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            Upload a video, and our AI will find the most used words and cook up a custom roast for you. Ready to feel the burn?
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Input
              type="file"
              accept="video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isAnalyzing}
            />
            <Button size="lg" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            Roast <span className="text-primary">Radar</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden shadow-2xl shadow-primary/10">
              <div className="aspect-video bg-black">
                <video ref={videoRef} src={videoUrl} controls className="w-full h-full" />
              </div>
            </Card>

            {isRoasting ? (
              <Card>
                <CardHeader>
                  <CardTitle>Cooking up a roast...</CardTitle>
                  <CardDescription>Our AI is sharpening its wit. Get ready!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-8 w-2/3" />
                </CardContent>
              </Card>
            ) : roast ? (
              <Card className="bg-gradient-to-br from-card to-card/80 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="text-primary" />
                    The Roast is Ready
                  </CardTitle>
                  <CardDescription>Warning: May cause singed egos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-medium tracking-tight font-headline text-foreground leading-relaxed">
                    &ldquo;{roast}&rdquo;
                  </p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button onClick={handleCopy}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="secondary" disabled>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </CardFooter>
              </Card>
            ) : null}

            {selectedWord && (
               <Card>
                <CardHeader>
                  <CardTitle>Word Clips: <span className="font-bold text-primary">&ldquo;{selectedWord.word}&rdquo;</span></CardTitle>
                  <CardDescription>Click to play moments where the word was spoken.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {selectedWord.timestamps.map((time, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => playClip(time)}>
                      <Play className="mr-2 h-4 w-4" />
                      Instance #{i + 1}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Frequent Words</CardTitle>
                <CardDescription>The words that just couldn&apos;t stay quiet.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2 pr-4">
                    {wordFrequencies.map((item, index) => (
                      <div key={item.word} data-word={item.word} className="group">
                        <Button
                          variant={selectedWord?.word === item.word ? "secondary" : "ghost"}
                          className="w-full justify-between p-4 h-auto"
                          onClick={() => setSelectedWord(item)}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-primary w-6 text-center">{index + 1}</span>
                            <span className="text-lg font-medium">{item.word}</span>
                          </div>
                          <div className="text-muted-foreground">
                            <span className="font-bold text-lg text-foreground">{item.count}</span> times
                          </div>
                        </Button>
                        {index === 0 && (
                          <div className="px-4 pb-2 pt-1">
                            <Button className="w-full" onClick={handleGenerateRoast} disabled={isRoasting || !!roast}>
                              {isRoasting ? (
                                <>
                                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                  Roasting...
                                </>
                              ) : roast ? (
                                "Roasted!"
                              ) : (
                                <>
                                  <Flame className="mr-2 h-4 w-4" />
                                  Roast this word!
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

    