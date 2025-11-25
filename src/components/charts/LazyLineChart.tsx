import React, { Suspense } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Box from '@mui/joy/Box';
import CircularProgress from '@mui/joy/CircularProgress';
import Typography from '@mui/joy/Typography';

interface ChartData {
  month: string;
  count?: number;
  revenue?: number;
  [key: string]: string | number | undefined;
}

interface LazyLineChartProps {
  data: ChartData[];
  dataKey: string;
  stroke: string;
  height?: number;
  width?: number;
  minWidth?: number;
  minHeight?: number;
  title?: string;
  color?: string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
}

const ChartComponent: React.FC<LazyLineChartProps> = ({
  data,
  dataKey,
  stroke,
  height = 220,
  width,
  minWidth = 200,
  minHeight = 200,
  color = '#1976d2',
  formatYAxis,
  formatTooltip
}) => {
  return (
    <Box>
      {/* Chart titles removed - displaying without titles */}
      <ResponsiveContainer
        width={width || '100%'}
        height={height}
        minWidth={minWidth}
        minHeight={minHeight}
      >
        <LineChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#444' />
          <XAxis
            dataKey='month'
            tick={{ fill: '#ffffff', fontSize: 12 }}
            axisLine={{ stroke: '#666' }}
          />
          <YAxis
            tick={{ fill: '#ffffff', fontSize: 12 }}
            axisLine={{ stroke: '#666' }}
            tickFormatter={formatYAxis}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
            formatter={(value: number) => {
              if (formatTooltip) {
                return formatTooltip(value);
              }
              if (formatYAxis) {
                return formatYAxis(value);
              }
              return value.toString();
            }}
          />
          <Line
            type='monotone'
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

const LoadingFallback: React.FC<{ height?: number }> = ({ height = 220 }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: `${height}px`,
      color: '#666'
    }}
  >
    <CircularProgress size='lg' />
    <Typography level='body-sm' sx={{ mt: 1, color: '#ffffff' }}>
      Loading chart...
    </Typography>
  </Box>
);

export const LazyLineChart: React.FC<LazyLineChartProps> = props => {
  return (
    <Suspense fallback={<LoadingFallback height={props.height} />}>
      <ChartComponent {...props} />
    </Suspense>
  );
};

export default LazyLineChart;
