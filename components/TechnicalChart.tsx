'use client';

import React, { useEffect, useRef } from 'react';
import { 
  createChart, 
  CrosshairMode, 
  LineStyle, 
  ColorType, 
  CandlestickSeries, 
  LineSeries,
  createSeriesMarkers,
  SeriesMarker
} from 'lightweight-charts';

// ✨ NEW: Define exactly what data the chart expects to receive
export interface ChartProps {
  ticker: string;
  data: { time: string; open: number; high: number; low: number; close: number }[];
  ema: { time: string; value: number }[];
  supportLevel?: number;
  markers?: SeriesMarker<any>[];
}

export default function TechnicalChart({ ticker, data, ema, supportLevel, markers }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // 1. Initialize Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748B', 
      },
      grid: {
        vertLines: { color: '#F1F5F9' }, 
        horzLines: { color: '#F1F5F9' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#E2E8F0', 
      },
      timeScale: {
        borderColor: '#E2E8F0',
        timeVisible: true,
      },
      autoSize: true,
    });

    // 2. Add Candlesticks (using dynamic data prop)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981', 
      downColor: '#F43F5E', 
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
    });
    candlestickSeries.setData(data);

    // 3. Add 21 EMA Line (using dynamic ema prop)
    const emaSeries = chart.addSeries(LineSeries, {
      color: '#3B82F6', 
      lineWidth: 2,
      crosshairMarkerVisible: false,
      title: '21 W EMA',
    });
    emaSeries.setData(ema);

    // 4. Draw Horizontal Support Line dynamically if provided
    if (supportLevel) {
      candlestickSeries.createPriceLine({
        price: supportLevel,
        color: '#10B981',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Support Base',
      });
    }

    // 5. Add Up-Arrow Markers dynamically if provided
    if (markers && markers.length > 0) {
      createSeriesMarkers(candlestickSeries, markers);
    }

    // Auto-fit the chart to the data
    chart.timeScale().fitContent();

    // Cleanup on unmount
    return () => {
      chart.remove();
    };
  }, [data, ema, supportLevel, markers]); // Re-render if new data is passed

  return (
    <div className="w-full h-full relative">
      <div ref={chartContainerRef} className="absolute inset-0" />
      
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-2 rounded-lg shadow-sm flex items-center gap-4 text-xs font-bold pointer-events-none">
        <div className="flex items-center gap-1.5 text-slate-700">
          <div className="w-2 h-2 bg-emerald-500 rounded-sm" /> Weekly
        </div>
        <div className="flex items-center gap-1.5 text-blue-600">
          <div className="w-3 h-0.5 bg-blue-500" /> 21 EMA
        </div>
      </div>
    </div>
  );
}