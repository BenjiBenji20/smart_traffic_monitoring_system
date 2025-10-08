'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart } from 'lucide-react';

interface PredictionRequestFormProps {
    onRequestPrediction: (endDate: string) => void;
    isLoading?: boolean;
}

export function PredictionRequestForm({
    onRequestPrediction,
    isLoading = false
}: PredictionRequestFormProps) {
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!endDate) {
            alert('Please select a date for prediction');
            return;
        }
        onRequestPrediction(endDate);
    };

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleSubmit(e as any);
    };

    // Set minimum date to tomorrow
    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().slice(0, 16);
    };

    return (
        <div className="fade-in">
            <Card className='h-43'>
                <CardContent className="p-4">
                    <div>
                        <Label htmlFor="prediction_date" className="font-semibold mb-4">
                            Select future date for prediction:
                        </Label>
                        <Input
                            type="datetime-local"
                            id="prediction_date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={getMinDate()}
                            className="w-full"
                            disabled={isLoading}
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={handleButtonClick}
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Requesting Predictions...
                            </>
                        ) : (
                            <>
                                <LineChart className="h-4 w-4 mr-2" />
                                Request Traffic Predictions
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}