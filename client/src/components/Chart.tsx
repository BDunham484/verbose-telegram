import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type CandlestickData,
} from 'lightweight-charts';
import type { Candle, PriceLevel } from '@shared/types/index.js';

type ChartProps = {
  candles: Candle[];
  levels: PriceLevel[];
};

export const Chart = ({ candles, levels }: ChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceLineRefs = useRef<IPriceLine[]>([]);

  // Initialize chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#e6edf3',
      },
      grid: {
        vertLines: { color: '#1c2128' },
        horzLines: { color: '#1c2128' },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#3fb950',
      downColor: '#f85149',
      borderUpColor: '#3fb950',
      borderDownColor: '#f85149',
      wickUpColor: '#3fb950',
      wickDownColor: '#f85149',
    });

    (chart as any).__candleSeries = candleSeries;
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update candle data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    const series = (chart as any).__candleSeries;
    const data: CandlestickData[] = candles.map(c => ({
      time: c.time as CandlestickData['time'],
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    series.setData(data);
    chart.timeScale().fitContent();
  }, [candles]);

  // Update price lines
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const series = (chart as any).__candleSeries;

    // Remove existing price lines
    for (const line of priceLineRefs.current) {
      series.removePriceLine(line);
    }
    priceLineRefs.current = [];

    // Add new price lines
    for (const level of levels) {
      const line = series.createPriceLine({
        price: level.value,
        color: level.color,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: level.label,
      });
      priceLineRefs.current.push(line);
    }
  }, [levels]);

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, minHeight: 0 }}
    />
  );
};
