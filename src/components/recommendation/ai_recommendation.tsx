import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Bot, Loader2 } from 'lucide-react';

type TimePeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'summary';

interface AIRecommendationProps {
    // Data can be an object with period keys or a simple string
    data: Record<string, string> | string | null;
    currentPeriod?: TimePeriod;
    title?: string;
    icon?: React.ReactNode;
    loading?: boolean;
    maxHeight?: number;
    maxChars?: number;
    typewriterSpeed?: number;
    persistAnimation?: boolean; // If true, use localStorage to persist
    persistenceKey?: string; // Unique key for localStorage (e.g., 'traffic-factors-2025-10-08')
    enableAnimation?: boolean; // If false, skip animation entirely
    className?: string;
    istenToPeriodChange?: boolean;
}

export function AIRecommendation({
    data,
    currentPeriod = 'summary',
    title = 'AI Recommendation',
    icon,
    loading = false,
    maxHeight = 200,
    maxChars = 1500,
    typewriterSpeed = 5,
    persistAnimation = false,
    persistenceKey,
    enableAnimation = true,
    className = ''
}: AIRecommendationProps) {
    const [displayText, setDisplayText] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasCompletedInitialAnimation, setHasCompletedInitialAnimation] = useState(false);

    const animationRef = useRef<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const currentTextRef = useRef('');

    // Get the text to display based on data type and period
    const getTextForPeriod = (): string => {
        if (!data) return '';

        if (typeof data === 'string') {
            return data;
        }

        const possibleKeys = [
            `${currentPeriod}_reco`,
            `${currentPeriod}_anal`,
            currentPeriod,
            `${currentPeriod}Reco`,
            `${currentPeriod}Anal`
        ];

        for (const key of possibleKeys) {
            if (data[key]) {
                return data[key];
            }
        }

        return '';
    };

    const fullText = getTextForPeriod();
    const hasMore = fullText.length > maxChars;

    // Check if animation should be skipped (already completed)
    const shouldSkipAnimation = (): boolean => {
        if (!persistAnimation || !persistenceKey) return false;

        try {
            const storageKey = `ai-reco-animated-${persistenceKey}-${currentPeriod}`;
            const hasAnimated = localStorage.getItem(storageKey);
            return hasAnimated === 'true';
        } catch (error) {
            console.warn('localStorage not available:', error);
            return false;
        }
    };

    // Mark animation as completed
    const markAnimationComplete = () => {
        if (!persistAnimation || !persistenceKey) return;

        try {
            const storageKey = `ai-reco-animated-${persistenceKey}-${currentPeriod}`;
            localStorage.setItem(storageKey, 'true');
        } catch (error) {
            console.warn('localStorage not available:', error);
        }
    };

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                clearInterval(animationRef.current);
            }
        };
    }, []);

    // Typewriter animation effect - ONLY for initial load
    useEffect(() => {
        // Clear any existing animation
        if (animationRef.current) {
            clearInterval(animationRef.current);
            animationRef.current = null;
        }

        // Reset states when text changes
        setIsExpanded(false);
        setHasCompletedInitialAnimation(false);

        if (!fullText) {
            setDisplayText('');
            setIsAnimating(false);
            return;
        }

        // If we're expanded, show full text immediately (but don't mark as completed animation)
        if (isExpanded) {
            setDisplayText(fullText);
            setIsAnimating(false);
            currentTextRef.current = fullText;
            return;
        }

        // If animation is disabled or we should skip, show text immediately
        if (!enableAnimation || shouldSkipAnimation() || hasCompletedInitialAnimation) {
            const textToShow = hasMore && !isExpanded
                ? fullText.substring(0, maxChars) + '...'
                : fullText;
            setDisplayText(textToShow);
            setIsAnimating(false);
            currentTextRef.current = fullText;
            if (!hasCompletedInitialAnimation) {
                setHasCompletedInitialAnimation(true);
                markAnimationComplete();
            }
            return;
        }

        // Determine text to animate (always truncated for initial animation)
        const textToAnimate = hasMore
            ? fullText.substring(0, maxChars) + '...'
            : fullText;

        currentTextRef.current = fullText;
        setDisplayText('');
        setIsAnimating(true);

        let index = 0;

        animationRef.current = window.setInterval(() => {
            if (index < textToAnimate.length) {
                setDisplayText(textToAnimate.substring(0, index + 1));
                index++;

                // Auto-scroll to bottom
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            } else {
                if (animationRef.current) {
                    clearInterval(animationRef.current);
                    animationRef.current = null;
                }
                setIsAnimating(false);
                setHasCompletedInitialAnimation(true);
                markAnimationComplete();
            }
        }, typewriterSpeed);

        return () => {
            if (animationRef.current) {
                clearInterval(animationRef.current);
                animationRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullText, currentPeriod, maxChars, typewriterSpeed]); // Remove isExpanded from dependencies

    // Handle expand/collapse - separate effect for toggling
    const handleToggle = () => {
        if (!isExpanded) {
            // Expand: show full text immediately and cancel any ongoing animation
            if (animationRef.current) {
                clearInterval(animationRef.current);
                animationRef.current = null;
                setIsAnimating(false);
            }

            // Mark animation as completed since user wants to see full text now
            if (!hasCompletedInitialAnimation) {
                setHasCompletedInitialAnimation(true);
                markAnimationComplete();
            }

            setDisplayText(fullText);
            setIsExpanded(true);
        } else {
            // Collapse: show truncated text immediately
            const truncated = fullText.substring(0, maxChars) + '...';
            setDisplayText(truncated);
            setIsExpanded(false);

            // Scroll to top after collapse to show the beginning
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = 0;
                }
            }, 0);
        }
    };

    const DefaultIcon = icon || <Bot className="h-5 w-5" />;

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-2.5 mt-0.5">
                        {DefaultIcon}
                    </div>
                    <div className="flex">
                        <CardTitle className="text-lg">{title}</CardTitle>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating recommendations...
                        </div>
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : !fullText ? (
                    <div className="text-muted-foreground text-sm py-4">
                        No recommendations available for this period.
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div
                            ref={scrollRef}
                            className="rounded-md border bg-muted/30 p-4 overflow-y-auto text-sm whitespace-pre-wrap leading-relaxed"
                            style={{
                                maxHeight: isExpanded ? 'none' : `${maxHeight}px`,
                                minHeight: '80px'
                            }}
                        >
                            {displayText}
                            {isAnimating && (
                                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                            )}
                        </div>

                        {hasMore && !isAnimating && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggle}
                                className="w-full"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 mr-2" />
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                        Show Full Text
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
