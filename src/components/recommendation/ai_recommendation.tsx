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

// Demo Component
export default function AIRecommendationDemo() {
    const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>('hourly');
    const [requestCount, setRequestCount] = useState(0);

    // Simulated data structures
    const trafficFactorsData = {
        hourly_anal: "Hourly Analysis:\n\nPeak:\nThe peak hour for traffic on the specified date and time is 2025-10-08 at 18:00 with 245 vehicles. This represents a significant concentration of traffic during the evening rush hour.\n\nFactors:\n1. Evening commute patterns\n2. School dismissal times\n3. Shopping center activity\n4. Weather conditions favorable for travel",
        daily_anal: "Daily Analysis:\n\nPeak: The peak day for traffic was October 6, 2025, with 1,929 vehicles during peak hours (7:00 AM - 8:00 AM).\n\nFactors:\n1. Weekday morning rush hour\n2. School and office opening times\n3. Public transportation schedules\n4. Market day activities in the area",
        weekly_anal: "Weekly Analysis:\n\nPeak analysis and factors:\nWeek start: 2025-11-17 | Week end: 2025-11-23\nTotal vehicles: 12,450\n\nFactors:\n1. Mid-week traffic concentration\n2. Payroll week increased activity\n3. Special events in the district\n4. Construction projects affecting alternate routes",
        monthly_anal: "Monthly Analysis:\n\nPeak: March 2025 with a predicted 64,195 vehicles during peak hours.\n\nFactors:\n1. Summer season increased travel\n2. School enrollment period\n3. Local festival preparations\n4. Infrastructure improvements completed"
    };

    const adminRecommendationData = {
        summary_reco: "1. Today's traffic prediction indicates a congested volume condition with 1,929 vehicles.\n\n   Recommendations:\n   - Allocate additional budget for overtime pay of traffic enforcers and emergency services during peak hours.\n   - Increase the frequency of public transportation to accommodate more passengers and reduce private vehicle usage.\n   - Implement a temporary one-way traffic scheme to ease congestion in critical areas.\n\n2. This week's prediction shows a total of 14,374 vehicles.\n\n   Recommendations:\n   - Schedule a series of coordination meetings with barangay officials and traffic enforcers to discuss traffic management strategies.\n   - Allocate resources for traffic signage and road markings maintenance to ensure clear traffic guidance.\n   - Monitor traffic conditions in real-time and adjust traffic signal timings accordingly to optimize traffic flow.\n\n3. The three-month prediction indicates a total of 189,372 vehicles.\n\n   Recommendations:\n   - Develop a strategic plan for traffic infrastructure improvements, including road widening and new traffic light installations.\n   - Allocate budget for the procurement of additional traffic management equipment, such as speed guns, traffic cones, and variable message signs.\n   - Coordinate with the city council to draft and pass ordinances that promote alternative modes of transportation, such as cycling and walking.\n   - Organize a city-wide traffic awareness campaign in collaboration with barangay officials, schools, and local media outlets.\n   - Consider implementing a traffic demand management program to reduce peak-hour traffic by encouraging flexible work hours and carpooling.",
        hourly_reco: "Peak Hour (18:00):\n\nRecommendations:\n1. Allocate additional resources for traffic enforcement during peak hours to maintain smooth flow\n2. Deploy motorcycle patrols for rapid incident response\n3. Coordinate with nearby establishments for staggered closing times\n4. Monitor and adjust traffic light timings dynamically\n5. Prepare towing services for quick clearance of stalled vehicles",
        daily_reco: "Peak Day (2025-10-06):\n\nRecommendations:\n1. Allocate additional budget for traffic management during peak periods\n2. Schedule extra shifts for traffic personnel\n3. Implement one-way traffic schemes on congested routes\n4. Coordinate with schools for staggered dismissal times\n5. Deploy mobile command centers at critical points",
        weekly_reco: "Peak Week (Nov 17-23):\n\nRecommendations:\n1. Allocate additional budget for overtime pay of traffic enforcers during peak periods\n2. Plan for increased fuel and vehicle maintenance costs\n3. Stock up on traffic management equipment and supplies\n4. Coordinate with local government for emergency funding if needed\n5. Prepare public awareness campaigns about traffic conditions",
        monthly_reco: "Peak Month (March):\n\nRecommendations:\n1. Allocate additional budget for traffic management during peak periods\n2. Hire temporary traffic personnel for the season\n3. Invest in infrastructure improvements for bottleneck areas\n4. Develop partnerships with private sector for traffic solutions\n5. Implement comprehensive public transportation enhancements"
    };

    const trafficRequestData = `Peak Traffic Forecast:\n\n1. Allocate additional budget for traffic management during peak periods, such as increasing the number of traffic enforcers and implementing temporary traffic schemes.\n\n2. Deploy traffic personnel at strategic locations to manage congestion and ensure smooth flow of vehicles.\n\n3. Coordinate with public transportation providers to increase trip frequencies during peak hours.\n\n4. Implement intelligent traffic management systems with real-time monitoring and adaptive signal control.\n\n5. Conduct public awareness campaigns about peak traffic times and alternative routes.\n\nRequest generated at: ${new Date().toLocaleTimeString()}`;

    const getTodayKey = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">AI Recommendation Component Demo</h1>
                    <p className="text-muted-foreground">Persistent typewriter effect with time period switching</p>
                </div>

                {/* Time Period Selector */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Time Period</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 flex-wrap">
                            {(['summary', 'hourly', 'daily', 'weekly', 'monthly'] as TimePeriod[]).map((period) => (
                                <Button
                                    key={period}
                                    variant={currentPeriod === period ? 'default' : 'outline'}
                                    onClick={() => setCurrentPeriod(period)}
                                    className="capitalize"
                                >
                                    {period}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Example 1: Traffic Factors Analysis (Persistent) */}
                <AIRecommendation
                    data={trafficFactorsData}
                    currentPeriod={currentPeriod}
                    title="Traffic Factors Analysis"
                    icon={<Bot className="h-5 w-5" />}
                    persistAnimation={true}
                    persistenceKey={`traffic-factors-${getTodayKey()}`}
                />

                {/* Example 2: Admin Recommendations (Persistent) */}
                <AIRecommendation
                    data={adminRecommendationData}
                    currentPeriod={currentPeriod}
                    title="Administrative Recommendations"
                    icon={<Bot className="h-5 w-5" />}
                    persistAnimation={true}
                    persistenceKey={`admin-reco-${getTodayKey()}`}
                />

                {/* Example 3: Traffic Request (Non-Persistent) */}
                <div className="space-y-3">
                    <Card>
                        <CardContent className="pt-6">
                            <Button
                                onClick={() => setRequestCount(prev => prev + 1)}
                                className="w-full"
                            >
                                Request New Traffic Prediction (Count: {requestCount})
                            </Button>
                        </CardContent>
                    </Card>

                    <AIRecommendation
                        data={trafficRequestData}
                        title="Traffic Request Recommendation"
                        icon={<Bot className="h-5 w-5" />}
                        persistAnimation={false}
                        key={requestCount}
                    />
                </div>

                {/* Instructions */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-2">How to test:</h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Wait for animations to complete on first load</li>
                            <li>Switch between time periods - no re-animation!</li>
                            <li>Hard refresh (F5) - animations won't run again today</li>
                            <li>Click "Request New Traffic Prediction" - always animates</li>
                            <li>Try expanding/collapsing recommendations</li>
                            <li>Open browser DevTools → Application → Local Storage to see persistence keys</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
