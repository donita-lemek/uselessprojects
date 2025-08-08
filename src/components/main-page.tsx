"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { analyzeVideo, type WordFrequency, type TimedWord } from '@/ai/flows/analyze-video';
import { generateRoast } from '@/ai/flows/generate-roast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { LoaderCircle, Upload, Wand2, Copy, Share2, MessageSquareQuote, PlayCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function MainPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ timedTranscript: TimedWord[], wordFrequencies: WordFrequency[] } | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedWord, setSelectedWord] = useState<WordFrequency | null>(null);
  const [isRoasting, setIsRoasting] = useState(false);
  const [roast, setRoast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  
  const wordClips = useMemo(() => {
    if (!analysisResult || !selectedWord) return [];
    
    const { timedTranscript } = analysisResult;
    const { word } = selectedWord;
    
    return timedTranscript.filter(
      (timedWord) => timedWord.word.toLowerCase().replace(/[^a-z]/g, '') === word.toLowerCase()
    );
  }, [analysisResult, selectedWord]);


  useEffect(() => {
    if (analysisResult && analysisResult.wordFrequencies.length > 0) {
      if (!selectedWord || !analysisResult.wordFrequencies.find(f => f.word === selectedWord.word)) {
        setSelectedWord(analysisResult.wordFrequencies[0]);
      }
    } else {
      setSelectedWord(null);
    }
    setRoast(null);
  }, [analysisResult]);


  useEffect(() => {
    if (selectedWord && analysisResult) {
      handleRoastGeneration(selectedWord.word, analysisResult.timedTranscript);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWord]);

  const handleRoastGeneration = async (word: string, timedTranscript: TimedWord[]) => {
    setIsRoasting(true);
    setRoast(null);
    try {
      const result = await generateRoast({ word, timedTranscript });
      setRoast(result.roast);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Roast Failed',
        description: 'Could not generate a roast. Please try a different word.',
      });
    } finally {
      setIsRoasting(false);
    }
  };

  const handleCopyRoast = () => {
    if (roast) {
      navigator.clipboard.writeText(roast);
      toast({
        title: 'Copied to clipboard!',
        description: 'Your roast is ready to be shared.',
      });
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setVideoUrl(URL.createObjectURL(file));

      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const videoDataUri = reader.result as string;
          try {
            const result = await analyzeVideo({ videoDataUri });
            setAnalysisResult(result);
          } catch (error) {
            console.error(error);
            toast({
              variant: 'destructive',
              title: 'Analysis Failed',
              description: 'Could not analyze the video. Please try again.',
            });
            setVideoUrl('');
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          } finally {
            setIsAnalyzing(false);
          }
        };
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'There was an error reading the file.',
        });
        setIsAnalyzing(false);
      }
    }
  };

  const handleClipPlay = (startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();

      // Optional: stop after a few seconds
      const stopTimeout = setTimeout(() => {
        videoRef.current?.pause();
      }, 4000); // Plays for 4 seconds

      // Cleanup timeout on component unmount or new clip play
      return () => clearTimeout(stopTimeout);
    }
  };

  if (!videoUrl && !isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#8d8d8d33_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-between">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-1">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            Roast <span className="text-primary">Radar</span>
          </h1>
        </div>
         <Button variant="outline" size="sm" onClick={() => {
            setVideoUrl('');
            setAnalysisResult(null);
            setSelectedWord(null);
            setRoast(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }} disabled={isAnalyzing}>
              <Upload className="mr-2 h-4 w-4" />
              New Video
          </Button>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                <div className="md:col-span-3">
                  <Card className="overflow-hidden shadow-2xl shadow-primary/10">
                    <div className="aspect-video bg-black flex items-center justify-center">
                      {isAnalyzing && !analysisResult ? (
                        <div className="text-center text-background">
                          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" />
                          <p className="mt-4 text-lg font-medium">Analyzing your video...</p>
                          <p className="text-muted-foreground">This may take a moment.</p>
                        </div>
                      ) : (
                        <video ref={videoRef} src={videoUrl} controls className="w-full h-full" />
                      )}
                    </div>
                  </Card>
                </div>
                <div className="md:col-span-2">
                   <AnimatePresence>
                    {analysisResult && wordClips.length > 0 && selectedWord ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <MessageSquareQuote className="text-primary"/> Word Clips
                            </CardTitle>
                            <CardDescription>
                              Click to play clips where <span className="font-bold text-primary">{`"${selectedWord?.word}"`}</span> was mentioned.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-48">
                              <div className="space-y-2 pr-4">
                                {wordClips.map((clip, index) => (
                                  <button
                                      key={index}
                                      onClick={() => handleClipPlay(clip.startTime)}
                                      className="w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left hover:bg-muted/50"
                                    >
                                      <div className='flex items-center gap-2'>
                                        <PlayCircle className="text-primary w-5 h-5"/>
                                        <span className="text-sm">
                                          Mention at <span className="font-mono text-primary">{clip.startTime.toFixed(1)}s</span>
                                        </span>
                                      </div>
                                  </button>
                                ))}
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : (isAnalyzing && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <MessageSquareQuote className="text-primary"/> Word Clips
                            </CardTitle>
                             <CardDescription>
                              Finding clips...
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 h-48">
                             {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {(isRoasting || roast) && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Wand2 className="text-primary" /> The Roast
                        </CardTitle>
                        <CardDescription>
                          AI-generated roast based on the word <span className="font-bold text-primary">{`"${selectedWord?.word}"`}</span>.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isRoasting ? (
                           <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        ) : (
                          <blockquote className="border-l-4 border-primary pl-4 italic text-lg">
                            {roast}
                          </blockquote>
                        )}
                      </CardContent>
                       {roast && !isRoasting && (
                        <div className="p-6 pt-0 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={handleCopyRoast}>
                                <Copy className="mr-2"/>
                                Copy
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigator.share({ title: 'Check out this roast!', text: roast })}>
                                <Share2 className="mr-2"/>
                                Share
                            </Button>
                        </div>
                        )}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
          
          <div className="space-y-8">
             <AnimatePresence>
              {analysisResult ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Words</CardTitle>
                      <CardDescription>
                        Click a word to generate a new roast.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[calc(100vh-24rem)]">
                        <div className="space-y-2 pr-4">
                          {analysisResult.wordFrequencies.map((item, index) => (
                            <button key={item.word}  onClick={() => setSelectedWord(item)} disabled={isRoasting}
                            className={cn("w-full flex items-center justify-between p-3 rounded-lg transition-colors", 
                            selectedWord?.word === item.word ? 'bg-primary/20' : 'hover:bg-muted/50')}>
                              <div className="flex items-center gap-4">
                                <span className={cn("text-sm font-bold w-6 text-center", selectedWord?.word === item.word ? 'text-primary' : 'text-muted-foreground')}>{index + 1}.</span>
                                <span className="text-lg font-medium capitalize">{item.word}</span>
                              </div>
                              <span className="text-sm text-muted-foreground font-mono px-2 py-1 rounded-md bg-background/50">{item.count}</span>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (isAnalyzing && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Words</CardTitle>
                        <CardDescription>
                          Analyzing the video for top words...
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 h-[calc(100vh-24rem)]">
                        {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                      </CardContent>
                    </Card>
                 </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
